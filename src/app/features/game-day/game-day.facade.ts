import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { TeamContextService } from '../../core/context/team-context.service';
import { toAppError } from '../../core/errors/app-error';
import { NotificationService } from '../../core/services/notification.service';
import {
  BattingStatLine, CreateDto, Game, InningHalf, LineupEntry, PlayEvent, PlayResult,
} from '../../data/models';
import {
  BATTING_STAT_REPOSITORY, GAME_REPOSITORY, LINEUP_REPOSITORY, PLAY_EVENT_REPOSITORY,
} from '../../data/repositories/abstract/tokens';
import { GamesFacade } from '../games/games.facade';

/** Counting-stat deltas produced by a plate appearance. */
const AT_BAT_RESULTS: readonly PlayResult[] = ['1B', '2B', '3B', 'HR', 'K', 'E', 'FC', 'OUT'];

export interface RecordPlayInput {
  readonly playerId: string;
  readonly result: PlayResult;
  readonly rbi: number;
  readonly runsScored: number;
  readonly outs: number;
}

/**
 * Live capture for a single game: lineup, plate appearances and score.
 * Every play updates the player's per-game batting line so the box score,
 * season totals and leaderboards stay consistent with the same source data.
 */
@Injectable()
export class GameDayFacade {
  private readonly games = inject(GAME_REPOSITORY);
  private readonly lineups = inject(LINEUP_REPOSITORY);
  private readonly playEvents = inject(PLAY_EVENT_REPOSITORY);
  private readonly battingStats = inject(BATTING_STAT_REPOSITORY);
  private readonly teamContext = inject(TeamContextService);
  private readonly notifications = inject(NotificationService);
  private readonly gamesFacade = inject(GamesFacade);

  private readonly gameState = signal<Game | null>(null);
  private readonly entriesState = signal<readonly LineupEntry[]>([]);
  private readonly playsState = signal<readonly PlayEvent[]>([]);
  private readonly inningState = signal(1);
  private readonly halfState = signal<InningHalf>('TOP');
  private readonly loadingState = signal(false);

  readonly game = this.gameState.asReadonly();
  readonly entries = this.entriesState.asReadonly();
  readonly plays = this.playsState.asReadonly();
  readonly inning = this.inningState.asReadonly();
  readonly half = this.halfState.asReadonly();
  readonly loading = this.loadingState.asReadonly();

  readonly outs = computed(() =>
    this.plays()
      .filter((play) => play.inning === this.inning() && play.half === this.half())
      .reduce((total, play) => total + play.outs, 0),
  );

  /** Next batter in the order, based on how many plate appearances were taken. */
  readonly nextBatterId = computed(() => {
    const order = [...this.entries()].sort((a, b) => a.battingOrder - b.battingOrder);
    if (order.length === 0) {
      return null;
    }
    return order[this.plays().length % order.length].playerId;
  });

  load(gameId: string): void {
    const teamId = this.teamContext.requireTeamId();
    this.loadingState.set(true);
    forkJoin({
      game: this.games.getById(gameId),
      lineup: this.lineups.findByGame(teamId, gameId),
      plays: this.playEvents.list({
        teamId,
        filters: { gameId },
        sort: { field: 'sequence', direction: 'asc' },
      }),
    }).subscribe({
      next: ({ game, lineup, plays }) => {
        this.gameState.set(game);
        this.entriesState.set(lineup?.entries ?? []);
        this.playsState.set(plays);
        const last = plays.at(-1);
        this.inningState.set(last?.inning ?? 1);
        this.halfState.set(last?.half ?? (game.homeAway === 'HOME' ? 'BOTTOM' : 'TOP'));
        this.loadingState.set(false);
      },
      error: (error: unknown) => {
        this.loadingState.set(false);
        this.notifications.error(toAppError(error).message);
      },
    });
  }

  saveLineup(entries: readonly LineupEntry[]): void {
    const game = this.gameState();
    if (!game) {
      return;
    }
    this.gamesFacade.saveLineup(game.id, entries).subscribe({
      next: (lineup) => {
        this.entriesState.set(lineup.entries);
        this.notifications.success('Lineup guardado.');
      },
      error: (error: unknown) => this.notifications.error(error),
    });
  }

  setInning(inning: number, half: InningHalf): void {
    this.inningState.set(Math.max(1, inning));
    this.halfState.set(half);
  }

  /** Records a plate appearance and applies its runs and batting counters. */
  recordPlay(input: RecordPlayInput): void {
    const game = this.gameState();
    if (!game) {
      return;
    }
    const teamId = this.teamContext.requireTeamId();
    const event: CreateDto<PlayEvent> = {
      teamId,
      gameId: game.id,
      inning: this.inning(),
      half: this.half(),
      playerId: input.playerId,
      pitcherId: null,
      result: input.result,
      rbi: input.rbi,
      runsScored: input.runsScored,
      outs: input.outs,
      sequence: this.plays().length + 1,
    };

    this.playEvents
      .create(event)
      .pipe(
        tap((created) => this.playsState.update((plays) => [...plays, created])),
        switchMap(() =>
          forkJoin({
            batting: this.applyBattingDelta(game, input),
            game: this.applyRuns(game, input.runsScored),
          }),
        ),
      )
      .subscribe({
        next: ({ game: updated }) => {
          this.gameState.set(updated);
          this.notifications.success('Jugada registrada.');
        },
        error: (error: unknown) => this.notifications.error(error),
      });
  }

  /** Removes the last play and reverts its statistical impact. */
  undoLastPlay(): void {
    const game = this.gameState();
    const last = this.plays().at(-1);
    if (!game || !last) {
      return;
    }
    this.playEvents
      .remove(last.id)
      .pipe(
        tap(() => this.playsState.update((plays) => plays.slice(0, -1))),
        switchMap(() =>
          forkJoin({
            batting: this.applyBattingDelta(game, last, -1),
            game: this.applyRuns(game, -last.runsScored),
          }),
        ),
      )
      .subscribe({
        next: ({ game: updated }) => {
          this.gameState.set(updated);
          this.notifications.success('Última jugada deshecha.');
        },
        error: (error: unknown) => this.notifications.error(error),
      });
  }

  addOpponentRuns(runs: number): void {
    const game = this.gameState();
    if (!game || runs === 0) {
      return;
    }

    setTeamRuns(inning: number, runs: number): void {
      this.updateLineScore('team', inning, runs);
    }

    setOpponentRuns(inning: number, runs: number): void {
      this.updateLineScore('opponent', inning, runs);
    }
    const line = [...game.opponentLineScore];
    const index = this.inning() - 1;
    line[index] = Math.max(0, (line[index] ?? 0) + runs);
    const total = line.reduce((sum, value) => sum + value, 0);
    this.games
      .update(game.id, { opponentLineScore: line, opponentScore: total, status: 'IN_PROGRESS' })
      .subscribe({
        next: (updated) => this.gameState.set(updated),
        error: (error: unknown) => this.notifications.error(error),
      });
  }

  finalize(): void {
    const game = this.gameState();
    if (!game) {
      return;
    }

    private updateLineScore(side: 'team' | 'opponent', inning: number, runs: number): void {
      const game = this.gameState();
      if (!game || inning < 1 || !Number.isFinite(runs)) {
        return;
      }
      const line = [...(side === 'team' ? game.teamLineScore : game.opponentLineScore)];
      line[inning - 1] = Math.max(0, Math.floor(runs));
      const total = line.reduce((sum, value) => sum + value, 0);
      const patch = side === 'team'
        ? { teamLineScore: line, teamScore: total }
        : { opponentLineScore: line, opponentScore: total };
      this.games.update(game.id, patch).subscribe({
        next: (updated) => this.gameState.set(updated),
        error: (error: unknown) => this.notifications.error(error),
      });
    }
    const teamScore = game.teamScore ?? 0;
    const opponentScore = game.opponentScore ?? 0;
    this.games
      .update(game.id, {
        status: 'FINAL',
        teamScore,
        opponentScore,
        result: teamScore > opponentScore ? 'W' : teamScore < opponentScore ? 'L' : 'T',
        inningsPlayed: Math.max(this.inning(), game.teamLineScore.length),
      })
      .subscribe({
        next: (updated) => {
          this.gameState.set(updated);
          this.notifications.success('Juego finalizado.');
        },
        error: (error: unknown) => this.notifications.error(error),
      });
  }

  private applyRuns(game: Game, runs: number): Observable<Game> {
    if (runs === 0) {
      return of(game);
    }
    const line = [...game.teamLineScore];
    const index = this.inning() - 1;
    line[index] = Math.max(0, (line[index] ?? 0) + runs);
    const total = line.reduce((sum, value) => sum + value, 0);
    return this.games.update(game.id, {
      teamLineScore: line,
      teamScore: total,
      status: game.status === 'SCHEDULED' ? 'IN_PROGRESS' : game.status,
    });
  }

  private applyBattingDelta(
    game: Game,
    play: RecordPlayInput,
    sign: 1 | -1 = 1,
  ): Observable<BattingStatLine> {
    const teamId = this.teamContext.requireTeamId();
    const delta = this.battingDelta(play, sign);
    return this.battingStats
      .list({ teamId, filters: { gameId: game.id, playerId: play.playerId } })
      .pipe(
        switchMap((lines) => {
          const existing = lines[0];
          if (!existing) {
            return this.battingStats.create({
              teamId,
              seasonId: game.seasonId,
              gameId: game.id,
              playerId: play.playerId,
              gp: 1,
              sb: 0,
              cs: 0,
              ...delta,
            } as CreateDto<BattingStatLine>);
          }
          return this.battingStats.update(existing.id, {
            ab: Math.max(0, existing.ab + (delta.ab ?? 0)),
            r: Math.max(0, existing.r + (delta.r ?? 0)),
            h: Math.max(0, existing.h + (delta.h ?? 0)),
            doubles: Math.max(0, existing.doubles + (delta.doubles ?? 0)),
            triples: Math.max(0, existing.triples + (delta.triples ?? 0)),
            hr: Math.max(0, existing.hr + (delta.hr ?? 0)),
            rbi: Math.max(0, existing.rbi + (delta.rbi ?? 0)),
            bb: Math.max(0, existing.bb + (delta.bb ?? 0)),
            so: Math.max(0, existing.so + (delta.so ?? 0)),
            hbp: Math.max(0, existing.hbp + (delta.hbp ?? 0)),
            sf: Math.max(0, existing.sf + (delta.sf ?? 0)),
            sac: Math.max(0, existing.sac + (delta.sac ?? 0)),
          });
        }),
        map((line) => line),
      );
  }

  private battingDelta(play: RecordPlayInput, sign: 1 | -1): Partial<BattingStatLine> {
    const result = play.result;
    const unit = sign;
    return {
      ab: AT_BAT_RESULTS.includes(result) ? unit : 0,
      h: result === '1B' || result === '2B' || result === '3B' || result === 'HR' ? unit : 0,
      doubles: result === '2B' ? unit : 0,
      triples: result === '3B' ? unit : 0,
      hr: result === 'HR' ? unit : 0,
      bb: result === 'BB' ? unit : 0,
      so: result === 'K' ? unit : 0,
      hbp: result === 'HBP' ? unit : 0,
      sf: result === 'SF' ? unit : 0,
      sac: result === 'SAC' ? unit : 0,
      rbi: play.rbi * unit,
      // Only the batter's own run belongs to their line; other runners are
      // credited when their own plate appearance is recorded.
      r: result === 'HR' ? unit : 0,
    };
  }
}
