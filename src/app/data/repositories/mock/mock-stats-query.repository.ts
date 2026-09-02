import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  groupBy, sumBatting, sumFielding, sumPitching,
} from '../../../core/domain/stat-aggregation';
import { battingRates, pitchingRates } from '../../../core/domain/stats-calculator';
import {
  BattingStatLine, FieldingStatLine, LEADER_CATEGORIES, LeaderBoard, LeaderCategoryDefinition,
  PitchingStatLine, Player, StatGroup, StatLeader, TeamStatLine,
} from '../../models';
import { Database } from '../../storage/database';
import { DatabaseService } from '../../storage/database.service';
import { StatsQuery, StatsQueryRepository } from '../abstract/entity-repositories';
import { simulate } from './mock-latency';

/**
 * The only repository that aggregates instead of reading rows verbatim.
 * Phase 2 replaces the reductions below with PostgreSQL views or RPC calls,
 * keeping the exact same method signatures.
 */
/** Fields shared by every stat line, used to filter without widening types. */
interface StatLineFilterFields {
  readonly teamId: string;
  readonly seasonId: string;
  readonly gameId: string | null;
  readonly playerId: string;
}

@Injectable()
export class MockStatsQueryRepository implements StatsQueryRepository {
  private readonly database = inject(DatabaseService);

  battingSeasonTotals(query: StatsQuery): Observable<readonly BattingStatLine[]> {
    return simulate(() => this.aggregateBatting(query));
  }

  pitchingSeasonTotals(query: StatsQuery): Observable<readonly PitchingStatLine[]> {
    return simulate(() => this.aggregatePitching(query));
  }

  fieldingSeasonTotals(query: StatsQuery): Observable<readonly FieldingStatLine[]> {
    return simulate(() => {
      const lines = this.scoped('fieldingStats', query);
      return [...groupBy(lines, (line) => line.playerId).entries()].map(([playerId, rows]) =>
        sumFielding(rows, {
          id: `${query.seasonId}-fielding-${playerId}`,
          teamId: query.teamId,
          seasonId: query.seasonId,
          playerId,
        }),
      );
    });
  }

  teamSeasonTotals(query: StatsQuery): Observable<TeamStatLine> {
    return simulate(() => {
      const batting = sumBatting(this.scoped('battingStats', query), {
        id: `${query.seasonId}-team-batting`,
        teamId: query.teamId,
        seasonId: query.seasonId,
        playerId: 'TEAM',
      });
      const pitching = sumPitching(this.scoped('pitchingStats', query), {
        id: `${query.seasonId}-team-pitching`,
        teamId: query.teamId,
        seasonId: query.seasonId,
        playerId: 'TEAM',
      });
      const games = this.database
        .select('games')
        .filter(
          (game) =>
            game.teamId === query.teamId &&
            game.seasonId === query.seasonId &&
            game.status === 'FINAL',
        );

      return {
        teamId: query.teamId,
        seasonId: query.seasonId,
        batting,
        pitching,
        games: games.length,
        wins: games.filter((game) => game.result === 'W').length,
        losses: games.filter((game) => game.result === 'L').length,
        ties: games.filter((game) => game.result === 'T').length,
        runsScored: games.reduce((sum, game) => sum + (game.teamScore ?? 0), 0),
        runsAllowed: games.reduce((sum, game) => sum + (game.opponentScore ?? 0), 0),
      } satisfies TeamStatLine;
    });
  }

  battingGameLog(query: Required<StatsQuery>): Observable<readonly BattingStatLine[]> {
    return simulate(() => this.scoped('battingStats', query));
  }

  pitchingGameLog(query: Required<StatsQuery>): Observable<readonly PitchingStatLine[]> {
    return simulate(() => this.scoped('pitchingStats', query));
  }

  fieldingGameLog(query: Required<StatsQuery>): Observable<readonly FieldingStatLine[]> {
    return simulate(() => this.scoped('fieldingStats', query));
  }

  gameBoxScore(
    teamId: string,
    gameId: string,
    group: StatGroup,
  ): Observable<readonly (BattingStatLine | PitchingStatLine | FieldingStatLine)[]> {
    const collection =
      group === 'batting' ? 'battingStats' : group === 'pitching' ? 'pitchingStats' : 'fieldingStats';
    return simulate(() =>
      this.database
        .select(collection)
        .filter((line) => line.teamId === teamId && line.gameId === gameId),
    );
  }

  leaders(query: StatsQuery, limit: number): Observable<readonly LeaderBoard[]> {
    return simulate(() => {
      const season = this.database.select('seasons').find((row) => row.id === query.seasonId);
      const minimumPa = season?.qualifyingPlateAppearances ?? 0;
      const minimumOuts = season?.qualifyingOuts ?? 0;
      const players = new Map(
        this.database
          .select('players')
          .filter((player) => player.teamId === query.teamId)
          .map((player) => [player.id, player] as const),
      );
      const batting = this.aggregateBatting(query);
      const pitching = this.aggregatePitching(query);

      return LEADER_CATEGORIES.map((definition) => ({
        definition,
        leaders:
          definition.group === 'batting'
            ? this.rankBatting(definition, batting, players, minimumPa, limit)
            : this.rankPitching(definition, pitching, players, minimumOuts, limit),
      }));
    });
  }

  private aggregateBatting(query: StatsQuery): BattingStatLine[] {
    const lines = this.scoped('battingStats', query);
    return [...groupBy(lines, (line) => line.playerId).entries()].map(([playerId, rows]) =>
      sumBatting(rows, {
        id: `${query.seasonId}-batting-${playerId}`,
        teamId: query.teamId,
        seasonId: query.seasonId,
        playerId,
      }),
    );
  }

  private aggregatePitching(query: StatsQuery): PitchingStatLine[] {
    const lines = this.scoped('pitchingStats', query);
    return [...groupBy(lines, (line) => line.playerId).entries()].map(([playerId, rows]) =>
      sumPitching(rows, {
        id: `${query.seasonId}-pitching-${playerId}`,
        teamId: query.teamId,
        seasonId: query.seasonId,
        playerId,
      }),
    );
  }

  private scoped<K extends 'battingStats' | 'pitchingStats' | 'fieldingStats'>(
    collection: K,
    query: StatsQuery,
  ): Database[K] {
    const rows = this.database.select(collection) as readonly StatLineFilterFields[];
    return rows.filter(
      (line) =>
        line.teamId === query.teamId &&
        line.seasonId === query.seasonId &&
        line.gameId !== null &&
        (!query.playerId || line.playerId === query.playerId),
    ) as Database[K];
  }

  private rankBatting(
    definition: LeaderCategoryDefinition,
    lines: readonly BattingStatLine[],
    players: ReadonlyMap<string, Player>,
    minimumPa: number,
    limit: number,
  ): StatLeader[] {
    const rows = lines.map((line) => {
      const rates = battingRates(line);
      const value =
        definition.key === 'avg' ? rates.avg
          : definition.key === 'obp' ? rates.obp
            : definition.key === 'slg' ? rates.slg
              : definition.key === 'ops' ? rates.ops
                : (line[definition.key as 'hr' | 'rbi' | 'h' | 'r' | 'sb'] as number);
      return { line, value, qualified: rates.pa >= minimumPa };
    });
    return this.toLeaders(definition, rows, players, limit);
  }

  private rankPitching(
    definition: LeaderCategoryDefinition,
    lines: readonly PitchingStatLine[],
    players: ReadonlyMap<string, Player>,
    minimumOuts: number,
    limit: number,
  ): StatLeader[] {
    const rows = lines.map((line) => {
      const rates = pitchingRates(line);
      const value =
        definition.key === 'era' ? rates.era
          : definition.key === 'whip' ? rates.whip
            : (line[definition.key as 'so' | 'w' | 'sv'] as number);
      return { line, value, qualified: line.outs >= minimumOuts };
    });
    return this.toLeaders(definition, rows, players, limit);
  }

  private toLeaders(
    definition: LeaderCategoryDefinition,
    rows: readonly { line: { playerId: string }; value: number; qualified: boolean }[],
    players: ReadonlyMap<string, Player>,
    limit: number,
  ): StatLeader[] {
    return rows
      .filter((row) => (definition.qualified ? row.qualified : true))
      .sort((a, b) => (definition.ascending ? a.value - b.value : b.value - a.value))
      .slice(0, limit)
      .map((row, index) => {
        const player = players.get(row.line.playerId);
        return {
          category: definition.key,
          playerId: row.line.playerId,
          playerName: player ? `${player.firstName} ${player.lastName}` : 'Unknown player',
          jerseyNumber: player?.jerseyNumber ?? 0,
          value: row.value,
          rank: index + 1,
          qualified: row.qualified,
        } satisfies StatLeader;
      });
  }
}
