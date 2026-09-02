import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, map, of, switchMap } from 'rxjs';
import { SeasonContextService } from '../../core/context/season-context.service';
import { TeamContextService } from '../../core/context/team-context.service';
import { toAppError } from '../../core/errors/app-error';
import { NotificationService } from '../../core/services/notification.service';
import { CreateDto, Player, PlayerStatus, Position, RosterEntry, UpdateDto } from '../../data/models';
import { PLAYER_REPOSITORY, ROSTER_REPOSITORY } from '../../data/repositories/abstract/tokens';
import { DatabaseService } from '../../data/storage/database.service';
import { LatestRequest } from '../../shared/utils/latest-request';

/**
 * Single surface the players feature exposes to components: read-only signals
 * plus command methods. Components never see a repository.
 */
@Injectable({ providedIn: 'root' })
export class PlayersFacade {
  private readonly players = inject(PLAYER_REPOSITORY);
  private readonly roster = inject(ROSTER_REPOSITORY);
  private readonly teamContext = inject(TeamContextService);
  private readonly seasonContext = inject(SeasonContextService);
  private readonly notifications = inject(NotificationService);
  private readonly database = inject(DatabaseService);
  private readonly latest = new LatestRequest();

  private readonly playersState = signal<readonly Player[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly search = signal('');
  readonly statusFilter = signal<PlayerStatus | 'ALL'>('ALL');
  readonly positionFilter = signal<Position | 'ALL'>('ALL');

  readonly all = this.playersState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly visible = computed(() => {
    const status = this.statusFilter();
    const position = this.positionFilter();
    return this.playersState().filter(
      (player) =>
        (status === 'ALL' || player.status === status) &&
        (position === 'ALL' ||
          player.primaryPosition === position ||
          player.secondaryPositions.includes(position)),
    );
  });

  readonly byId = computed(() => new Map(this.playersState().map((player) => [player.id, player])));

  private readonly rosterState = signal<readonly RosterEntry[]>([]);
  readonly rosterEntries = this.rosterState.asReadonly();

  /** Players on the active season roster, resolved to full player records. */
  readonly rosterPlayers = computed(() => {
    const players = this.byId();
    return this.rosterState()
      .map((entry) => ({ entry, player: players.get(entry.playerId) }))
      .filter((row): row is { entry: RosterEntry; player: Player } => row.player !== undefined)
      .sort((a, b) => a.entry.jerseyNumber - b.entry.jerseyNumber);
  });

  /** Players of the team that are not on the active season roster yet. */
  readonly availableForRoster = computed(() => {
    const rostered = new Set(this.rosterState().map((entry) => entry.playerId));
    return this.playersState().filter((player) => !rostered.has(player.id));
  });

  constructor() {
    // Re-queries whenever the tenant, the search term or the stored data change.
    effect(() => {
      const teamId = this.teamContext.activeTeamId();
      const search = this.search();
      this.database.revision();
      this.fetch(teamId, search);
    });

    effect(() => {
      const teamId = this.teamContext.activeTeamId();
      const seasonId = this.seasonContext.activeSeasonId();
      this.database.revision();
      this.fetchRoster(teamId, seasonId);
    });
  }

  addToRoster(player: Player): Observable<RosterEntry> {
    const seasonId = this.seasonContext.activeSeasonId();
    if (!seasonId) {
      throw new Error('No active season selected.');
    }
    return this.roster.create({
      teamId: this.teamContext.requireTeamId(),
      seasonId,
      playerId: player.id,
      jerseyNumber: player.jerseyNumber,
      status: player.status,
    } as CreateDto<RosterEntry>);
  }

  removeFromRoster(entryId: string): Observable<void> {
    return this.roster.remove(entryId);
  }

  create(dto: Omit<CreateDto<Player>, 'teamId'>): Observable<Player> {
    const teamId = this.teamContext.requireTeamId();
    const seasonId = this.seasonContext.activeSeasonId();
    return this.players.create({ ...dto, teamId }).pipe(
      switchMap((player) =>
        // Newly created players join the active season roster automatically.
        seasonId
          ? this.roster
              .create({
                teamId,
                seasonId,
                playerId: player.id,
                jerseyNumber: player.jerseyNumber,
                status: player.status,
              } as CreateDto<RosterEntry>)
              .pipe(map(() => player))
          : of(player),
      ),
    );
  }

  update(id: string, patch: UpdateDto<Player>): Observable<Player> {
    return this.players.update(id, patch);
  }

  remove(id: string): Observable<void> {
    return this.players.remove(id);
  }

  getById(id: string): Observable<Player> {
    return this.players.getById(id);
  }

  notifyError(error: unknown): void {
    this.notifications.error(error);
  }

  notifySuccess(message: string): void {
    this.notifications.success(message);
  }

  private fetchRoster(teamId: string | null, seasonId: string | null): void {
    if (!teamId || !seasonId) {
      this.rosterState.set([]);
      return;
    }
    this.roster.list({ teamId, filters: { seasonId } }).subscribe({
      next: (entries) => this.rosterState.set(entries),
      error: (error: unknown) => this.errorState.set(toAppError(error).message),
    });
  }

  private fetch(teamId: string | null, search: string): void {
    if (!teamId) {
      this.playersState.set([]);
      return;
    }
    const token = this.latest.start();
    this.loadingState.set(true);
    this.errorState.set(null);
    this.players
      .list({ teamId, search, sort: { field: 'lastName', direction: 'asc' } })
      .subscribe({
        next: (players) => {
          if (!this.latest.isCurrent(token)) {
            return;
          }
          this.playersState.set(players);
          this.loadingState.set(false);
        },
        error: (error: unknown) => {
          if (!this.latest.isCurrent(token)) {
            return;
          }
          this.errorState.set(toAppError(error).message);
          this.loadingState.set(false);
        },
      });
  }
}
