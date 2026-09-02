import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { SeasonContextService } from '../../core/context/season-context.service';
import { TeamContextService } from '../../core/context/team-context.service';
import { toAppError } from '../../core/errors/app-error';
import { NotificationService } from '../../core/services/notification.service';
import {
  CreateDto, Game, Lineup, LineupEntry, Opponent, UpdateDto, Venue,
} from '../../data/models';
import {
  GAME_REPOSITORY, LINEUP_REPOSITORY, OPPONENT_REPOSITORY, VENUE_REPOSITORY,
} from '../../data/repositories/abstract/tokens';
import { DatabaseService } from '../../data/storage/database.service';
import { LatestRequest } from '../../shared/utils/latest-request';

/**
 * Games, opponents, venues and lineups for the active team and season.
 * Shared by the games, schedule, dashboard and game-day features.
 */
@Injectable({ providedIn: 'root' })
export class GamesFacade {
  private readonly gamesRepository = inject(GAME_REPOSITORY);
  private readonly opponentsRepository = inject(OPPONENT_REPOSITORY);
  private readonly venuesRepository = inject(VENUE_REPOSITORY);
  private readonly lineupsRepository = inject(LINEUP_REPOSITORY);
  private readonly teamContext = inject(TeamContextService);
  private readonly seasonContext = inject(SeasonContextService);
  private readonly notifications = inject(NotificationService);
  private readonly database = inject(DatabaseService);
  private readonly latest = new LatestRequest();

  private readonly gamesState = signal<readonly Game[]>([]);
  private readonly opponentsState = signal<readonly Opponent[]>([]);
  private readonly venuesState = signal<readonly Venue[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly games = this.gamesState.asReadonly();
  readonly opponents = this.opponentsState.asReadonly();
  readonly venues = this.venuesState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly opponentById = computed(
    () => new Map(this.opponentsState().map((opponent) => [opponent.id, opponent] as const)),
  );
  readonly venueById = computed(
    () => new Map(this.venuesState().map((venue) => [venue.id, venue] as const)),
  );

  readonly playedGames = computed(() =>
    this.gamesState().filter((game) => game.status === 'FINAL'),
  );

  readonly upcomingGames = computed(() =>
    this.gamesState().filter((game) => game.status === 'SCHEDULED' || game.status === 'IN_PROGRESS'),
  );

  readonly nextGame = computed(() => this.upcomingGames()[0] ?? null);
  readonly lastGame = computed(() => this.playedGames().at(-1) ?? null);

  constructor() {
    effect(() => {
      const teamId = this.teamContext.activeTeamId();
      const seasonId = this.seasonContext.activeSeasonId();
      this.database.revision();
      this.load(teamId, seasonId);
    });
  }

  describe(game: Game): string {
    const opponent = this.opponentById().get(game.opponentId);
    return `${game.homeAway === 'HOME' ? 'vs' : '@'} ${opponent?.name ?? 'Rival'}`;
  }

  getById(id: string): Observable<Game> {
    return this.gamesRepository.getById(id);
  }

  create(dto: Omit<CreateDto<Game>, 'teamId' | 'seasonId'>): Observable<Game> {
    const teamId = this.teamContext.requireTeamId();
    const seasonId = this.seasonContext.activeSeasonId();
    if (!seasonId) {
      throw new Error('No active season selected.');
    }
    return this.gamesRepository.create({ ...dto, teamId, seasonId });
  }

  update(id: string, patch: UpdateDto<Game>): Observable<Game> {
    return this.gamesRepository.update(id, patch);
  }

  remove(id: string): Observable<void> {
    return this.gamesRepository.remove(id);
  }

  lineupForGame(gameId: string): Observable<Lineup | null> {
    return this.lineupsRepository.findByGame(this.teamContext.requireTeamId(), gameId);
  }

  saveLineup(gameId: string, entries: readonly LineupEntry[]): Observable<Lineup> {
    const teamId = this.teamContext.requireTeamId();
    return new Observable<Lineup>((subscriber) => {
      this.lineupsRepository.findByGame(teamId, gameId).subscribe({
        next: (existing) => {
          const request = existing
            ? this.lineupsRepository.update(existing.id, { entries })
            : this.lineupsRepository.create({ teamId, gameId, entries });
          request.subscribe({
            next: (lineup) => {
              subscriber.next(lineup);
              subscriber.complete();
            },
            error: (error: unknown) => subscriber.error(error),
          });
        },
        error: (error: unknown) => subscriber.error(error),
      });
    });
  }

  createOpponent(dto: Omit<CreateDto<Opponent>, 'teamId'>): Observable<Opponent> {
    return this.opponentsRepository.create({ ...dto, teamId: this.teamContext.requireTeamId() });
  }

  removeOpponent(id: string): Observable<void> {
    return this.opponentsRepository.remove(id);
  }

  createVenue(dto: Omit<CreateDto<Venue>, 'teamId'>): Observable<Venue> {
    return this.venuesRepository.create({ ...dto, teamId: this.teamContext.requireTeamId() });
  }

  removeVenue(id: string): Observable<void> {
    return this.venuesRepository.remove(id);
  }

  notifyError(error: unknown): void {
    this.notifications.error(error);
  }

  notifySuccess(message: string): void {
    this.notifications.success(message);
  }

  private load(teamId: string | null, seasonId: string | null): void {
    if (!teamId) {
      this.gamesState.set([]);
      this.opponentsState.set([]);
      this.venuesState.set([]);
      return;
    }
    const token = this.latest.start();
    this.loadingState.set(true);
    this.errorState.set(null);

    forkJoin({
      games: seasonId
        ? this.gamesRepository.list({
            teamId,
            filters: { seasonId },
            sort: { field: 'date', direction: 'asc' },
          })
        : of<readonly Game[]>([]),
      opponents: this.opponentsRepository.list({
        teamId,
        sort: { field: 'name', direction: 'asc' },
      }),
      venues: this.venuesRepository.list({ teamId, sort: { field: 'name', direction: 'asc' } }),
    }).subscribe({
      next: ({ games, opponents, venues }) => {
        if (!this.latest.isCurrent(token)) {
          return;
        }
        this.gamesState.set(games);
        this.opponentsState.set(opponents);
        this.venuesState.set(venues);
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
