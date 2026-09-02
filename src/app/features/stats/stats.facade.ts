import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { SeasonContextService } from '../../core/context/season-context.service';
import { TeamContextService } from '../../core/context/team-context.service';
import { toAppError } from '../../core/errors/app-error';
import {
  BattingStatLine, FieldingStatLine, PitchingStatLine, StatGroup, TeamStatLine,
} from '../../data/models';
import { STATS_QUERY_REPOSITORY } from '../../data/repositories/abstract/tokens';
import { DatabaseService } from '../../data/storage/database.service';
import { LatestRequest } from '../../shared/utils/latest-request';

/**
 * Reads aggregated season statistics. All maths lives in the data layer /
 * `StatsCalculator`; the facade only orchestrates and exposes signals.
 */
@Injectable({ providedIn: 'root' })
export class StatsFacade {
  private readonly statsQuery = inject(STATS_QUERY_REPOSITORY);
  private readonly teamContext = inject(TeamContextService);
  private readonly seasonContext = inject(SeasonContextService);
  private readonly database = inject(DatabaseService);
  private readonly latest = new LatestRequest();

  private readonly battingState = signal<readonly BattingStatLine[]>([]);
  private readonly pitchingState = signal<readonly PitchingStatLine[]>([]);
  private readonly fieldingState = signal<readonly FieldingStatLine[]>([]);
  private readonly teamState = signal<TeamStatLine | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly group = signal<StatGroup>('batting');

  readonly batting = this.battingState.asReadonly();
  readonly pitching = this.pitchingState.asReadonly();
  readonly fielding = this.fieldingState.asReadonly();
  readonly teamTotals = this.teamState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly record = computed(() => {
    const totals = this.teamState();
    if (!totals) {
      return '0-0';
    }
    return totals.ties > 0
      ? `${totals.wins}-${totals.losses}-${totals.ties}`
      : `${totals.wins}-${totals.losses}`;
  });

  constructor() {
    effect(() => {
      const teamId = this.teamContext.activeTeamId();
      const seasonId = this.seasonContext.activeSeasonId();
      this.database.revision();
      this.load(teamId, seasonId);
    });
  }

  playerBatting(playerId: string): Observable<BattingStatLine | null> {
    return this.scopedQuery((query) =>
      this.statsQuery
        .battingSeasonTotals({ ...query, playerId })
        .pipe(map((lines) => lines[0] ?? null)),
    );
  }

  playerPitching(playerId: string): Observable<PitchingStatLine | null> {
    return this.scopedQuery((query) =>
      this.statsQuery
        .pitchingSeasonTotals({ ...query, playerId })
        .pipe(map((lines) => lines[0] ?? null)),
    );
  }

  playerFielding(playerId: string): Observable<FieldingStatLine | null> {
    return this.scopedQuery((query) =>
      this.statsQuery
        .fieldingSeasonTotals({ ...query, playerId })
        .pipe(map((lines) => lines[0] ?? null)),
    );
  }

  playerBattingGameLog(playerId: string): Observable<readonly BattingStatLine[]> {
    return this.scopedQuery((query) => this.statsQuery.battingGameLog({ ...query, playerId }));
  }

  playerPitchingGameLog(playerId: string): Observable<readonly PitchingStatLine[]> {
    return this.scopedQuery((query) => this.statsQuery.pitchingGameLog({ ...query, playerId }));
  }

  gameBoxScore(gameId: string, group: StatGroup) {
    return this.statsQuery.gameBoxScore(this.teamContext.requireTeamId(), gameId, group);
  }

  private scopedQuery<T>(
    project: (query: { teamId: string; seasonId: string }) => Observable<T>,
  ): Observable<T> {
    const teamId = this.teamContext.requireTeamId();
    const seasonId = this.seasonContext.activeSeasonId();
    if (!seasonId) {
      throw new Error('No active season selected.');
    }
    return project({ teamId, seasonId });
  }

  private load(teamId: string | null, seasonId: string | null): void {
    if (!teamId || !seasonId) {
      this.battingState.set([]);
      this.pitchingState.set([]);
      this.fieldingState.set([]);
      this.teamState.set(null);
      return;
    }
    const token = this.latest.start();
    const query = { teamId, seasonId };
    this.loadingState.set(true);
    this.errorState.set(null);

    const fail = (error: unknown) => {
      if (this.latest.isCurrent(token)) {
        this.errorState.set(toAppError(error).message);
        this.loadingState.set(false);
      }
    };

    this.statsQuery.battingSeasonTotals(query).subscribe({
      next: (lines) => {
        if (this.latest.isCurrent(token)) {
          this.battingState.set(lines);
          this.loadingState.set(false);
        }
      },
      error: fail,
    });
    this.statsQuery.pitchingSeasonTotals(query).subscribe({
      next: (lines) => this.latest.isCurrent(token) && this.pitchingState.set(lines),
      error: fail,
    });
    this.statsQuery.fieldingSeasonTotals(query).subscribe({
      next: (lines) => this.latest.isCurrent(token) && this.fieldingState.set(lines),
      error: fail,
    });
    this.statsQuery.teamSeasonTotals(query).subscribe({
      next: (totals) => this.latest.isCurrent(token) && this.teamState.set(totals),
      error: fail,
    });
  }
}
