import { TeamScopedEntity } from './common.model';
import { Position } from './player.model';

/**
 * Raw counting stats only. Every rate stat (AVG, OBP, ERA, ...) is derived on
 * read by `StatsCalculator`, never persisted, so edits can never desynchronise
 * totals from their components.
 */
export interface BattingStatLine extends TeamScopedEntity {
  readonly seasonId: string;
  /** Null for aggregated season lines, set for per-game lines. */
  readonly gameId: string | null;
  readonly playerId: string;
  readonly gp: number;
  readonly ab: number;
  readonly r: number;
  readonly h: number;
  readonly doubles: number;
  readonly triples: number;
  readonly hr: number;
  readonly rbi: number;
  readonly bb: number;
  readonly so: number;
  readonly hbp: number;
  readonly sf: number;
  readonly sac: number;
  readonly sb: number;
  readonly cs: number;
}

export interface PitchingStatLine extends TeamScopedEntity {
  readonly seasonId: string;
  readonly gameId: string | null;
  readonly playerId: string;
  readonly g: number;
  readonly gs: number;
  /** Innings pitched stored as outs, so thirds never suffer float drift. */
  readonly outs: number;
  readonly h: number;
  readonly r: number;
  readonly er: number;
  readonly bb: number;
  readonly so: number;
  readonly hr: number;
  readonly bf: number;
  readonly w: number;
  readonly l: number;
  readonly sv: number;
}

export interface FieldingStatLine extends TeamScopedEntity {
  readonly seasonId: string;
  readonly gameId: string | null;
  readonly playerId: string;
  readonly position: Position;
  readonly g: number;
  readonly outsPlayed: number;
  readonly po: number;
  readonly a: number;
  readonly e: number;
  readonly dp: number;
}

export type StatGroup = 'batting' | 'pitching' | 'fielding';

/** Derived batting metrics computed from a `BattingStatLine`. */
export interface BattingRates {
  readonly pa: number;
  readonly tb: number;
  readonly avg: number;
  readonly obp: number;
  readonly slg: number;
  readonly ops: number;
  readonly iso: number;
  readonly babip: number;
}

export interface PitchingRates {
  readonly ip: number;
  readonly era: number;
  readonly whip: number;
  readonly kPer7: number;
  readonly bbPer7: number;
  readonly opponentAvg: number;
}

export interface FieldingRates {
  readonly chances: number;
  readonly fieldingPct: number;
  readonly inningsPlayed: number;
}

export interface TeamStatLine {
  readonly teamId: string;
  readonly seasonId: string;
  readonly batting: BattingStatLine;
  readonly pitching: PitchingStatLine;
  readonly games: number;
  readonly wins: number;
  readonly losses: number;
  readonly ties: number;
  readonly runsScored: number;
  readonly runsAllowed: number;
}

export type LeaderCategory =
  | 'avg' | 'hr' | 'rbi' | 'h' | 'r' | 'sb' | 'obp' | 'slg' | 'ops'
  | 'era' | 'whip' | 'so' | 'w' | 'sv';

export interface LeaderCategoryDefinition {
  readonly key: LeaderCategory;
  readonly label: string;
  readonly group: Extract<StatGroup, 'batting' | 'pitching'>;
  /** Rate stats apply the season qualification threshold. */
  readonly qualified: boolean;
  /** True when a lower value is better (ERA, WHIP). */
  readonly ascending: boolean;
  readonly format: 'rate3' | 'rate2' | 'int';
}

export const LEADER_CATEGORIES: readonly LeaderCategoryDefinition[] = [
  { key: 'avg', label: 'Batting average', group: 'batting', qualified: true, ascending: false, format: 'rate3' },
  { key: 'hr', label: 'Home runs', group: 'batting', qualified: false, ascending: false, format: 'int' },
  { key: 'rbi', label: 'Runs batted in', group: 'batting', qualified: false, ascending: false, format: 'int' },
  { key: 'h', label: 'Hits', group: 'batting', qualified: false, ascending: false, format: 'int' },
  { key: 'r', label: 'Runs', group: 'batting', qualified: false, ascending: false, format: 'int' },
  { key: 'sb', label: 'Stolen bases', group: 'batting', qualified: false, ascending: false, format: 'int' },
  { key: 'obp', label: 'On-base percentage', group: 'batting', qualified: true, ascending: false, format: 'rate3' },
  { key: 'slg', label: 'Slugging', group: 'batting', qualified: true, ascending: false, format: 'rate3' },
  { key: 'ops', label: 'OPS', group: 'batting', qualified: true, ascending: false, format: 'rate3' },
  { key: 'era', label: 'Earned run average', group: 'pitching', qualified: true, ascending: true, format: 'rate2' },
  { key: 'whip', label: 'WHIP', group: 'pitching', qualified: true, ascending: true, format: 'rate2' },
  { key: 'so', label: 'Strikeouts', group: 'pitching', qualified: false, ascending: false, format: 'int' },
  { key: 'w', label: 'Wins', group: 'pitching', qualified: false, ascending: false, format: 'int' },
  { key: 'sv', label: 'Saves', group: 'pitching', qualified: false, ascending: false, format: 'int' },
];

export interface StatLeader {
  readonly category: LeaderCategory;
  readonly playerId: string;
  readonly playerName: string;
  readonly jerseyNumber: number;
  readonly value: number;
  readonly rank: number;
  readonly qualified: boolean;
}

export interface LeaderBoard {
  readonly definition: LeaderCategoryDefinition;
  readonly leaders: readonly StatLeader[];
}
