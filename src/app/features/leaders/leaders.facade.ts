import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SeasonContextService } from '../../core/context/season-context.service';
import { TeamContextService } from '../../core/context/team-context.service';
import { toAppError } from '../../core/errors/app-error';
import { LeaderBoard } from '../../data/models';
import { STATS_QUERY_REPOSITORY } from '../../data/repositories/abstract/tokens';
import { DatabaseService } from '../../data/storage/database.service';
import { LatestRequest } from '../../shared/utils/latest-request';

const TOP_N = 10;

@Injectable({ providedIn: 'root' })
export class LeadersFacade {
  private readonly statsQuery = inject(STATS_QUERY_REPOSITORY);
  private readonly teamContext = inject(TeamContextService);
  private readonly seasonContext = inject(SeasonContextService);
  private readonly database = inject(DatabaseService);
  private readonly latest = new LatestRequest();

  private readonly boardsState = signal<readonly LeaderBoard[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly boards = this.boardsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly battingBoards = computed(() =>
    this.boardsState().filter((board) => board.definition.group === 'batting'),
  );
  readonly pitchingBoards = computed(() =>
    this.boardsState().filter((board) => board.definition.group === 'pitching'),
  );

  constructor() {
    effect(() => {
      const teamId = this.teamContext.activeTeamId();
      const seasonId = this.seasonContext.activeSeasonId();
      this.database.revision();
      this.load(teamId, seasonId);
    });
  }

  boardFor(category: string): LeaderBoard | null {
    return this.boardsState().find((board) => board.definition.key === category) ?? null;
  }

  private load(teamId: string | null, seasonId: string | null): void {
    if (!teamId || !seasonId) {
      this.boardsState.set([]);
      return;
    }
    const token = this.latest.start();
    this.loadingState.set(true);
    this.errorState.set(null);
    this.statsQuery.leaders({ teamId, seasonId }, TOP_N).subscribe({
      next: (boards) => {
        if (!this.latest.isCurrent(token)) {
          return;
        }
        this.boardsState.set(boards);
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
