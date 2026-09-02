import { TeamScopedEntity } from './common.model';
import { Position } from './player.model';

export type GameStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'FINAL' | 'POSTPONED' | 'CANCELED';
export type HomeAway = 'HOME' | 'AWAY';
export type GameResult = 'W' | 'L' | 'T';

export interface Game extends TeamScopedEntity {
  readonly seasonId: string;
  readonly opponentId: string;
  readonly date: string;
  readonly time: string;
  readonly venueId: string | null;
  readonly homeAway: HomeAway;
  readonly status: GameStatus;
  readonly teamScore: number | null;
  readonly opponentScore: number | null;
  readonly result: GameResult | null;
  readonly inningsPlayed: number | null;
  /** Runs scored by inning, index 0 = first inning. */
  readonly teamLineScore: readonly number[];
  readonly opponentLineScore: readonly number[];
  readonly notes: string;
}

export interface LineupEntry {
  readonly playerId: string;
  readonly battingOrder: number;
  readonly position: Position;
  readonly isStarter: boolean;
  /** Player replaced by this entry, when it is a substitution. */
  readonly substitutionOf: string | null;
}

export interface Lineup extends TeamScopedEntity {
  readonly gameId: string;
  readonly entries: readonly LineupEntry[];
}

export type PlayResult =
  | '1B' | '2B' | '3B' | 'HR' | 'BB' | 'K' | 'HBP'
  | 'SF' | 'SAC' | 'E' | 'FC' | 'OUT';

export const PLAY_RESULTS: readonly PlayResult[] = [
  '1B', '2B', '3B', 'HR', 'BB', 'K', 'HBP', 'SF', 'SAC', 'E', 'FC', 'OUT',
] as const;

export const PLAY_RESULT_LABELS: Readonly<Record<PlayResult, string>> = {
  '1B': 'Single',
  '2B': 'Double',
  '3B': 'Triple',
  HR: 'Home run',
  BB: 'Walk',
  K: 'Strikeout',
  HBP: 'Hit by pitch',
  SF: 'Sacrifice fly',
  SAC: 'Sacrifice bunt',
  E: 'Reached on error',
  FC: "Fielder's choice",
  OUT: 'Out in play',
};

export type InningHalf = 'TOP' | 'BOTTOM';

/** One plate appearance recorded during live game-day capture. */
export interface PlayEvent extends TeamScopedEntity {
  readonly gameId: string;
  readonly inning: number;
  readonly half: InningHalf;
  readonly playerId: string;
  readonly pitcherId: string | null;
  readonly result: PlayResult;
  readonly rbi: number;
  readonly runsScored: number;
  readonly outs: number;
  readonly sequence: number;
}
