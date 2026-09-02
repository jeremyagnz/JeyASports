import { TeamScopedEntity } from './common.model';

export type Position =
  | 'P' | 'C' | '1B' | '2B' | '3B' | 'SS'
  | 'LF' | 'CF' | 'RF' | 'SF' | 'DP' | 'EP';

export const POSITIONS: readonly Position[] = [
  'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'SF', 'DP', 'EP',
] as const;

export const POSITION_LABELS: Readonly<Record<Position, string>> = {
  P: 'Pitcher',
  C: 'Catcher',
  '1B': 'First base',
  '2B': 'Second base',
  '3B': 'Third base',
  SS: 'Shortstop',
  LF: 'Left field',
  CF: 'Center field',
  RF: 'Right field',
  SF: 'Short fielder',
  DP: 'Designated player',
  EP: 'Extra player',
};

export type BattingHand = 'L' | 'R' | 'S';
export type ThrowingHand = 'L' | 'R';
export type PlayerStatus = 'ACTIVE' | 'INJURED' | 'INACTIVE';

export interface Player extends TeamScopedEntity {
  readonly firstName: string;
  readonly lastName: string;
  readonly jerseyNumber: number;
  readonly primaryPosition: Position;
  readonly secondaryPositions: readonly Position[];
  readonly bats: BattingHand;
  readonly throws: ThrowingHand;
  readonly birthDate: string;
  readonly heightCm: number;
  readonly weightKg: number;
  readonly photoUrl?: string;
  readonly status: PlayerStatus;
  readonly bio: string;
}

/** Per-season membership of a player on the roster. */
export interface RosterEntry extends TeamScopedEntity {
  readonly seasonId: string;
  readonly playerId: string;
  readonly jerseyNumber: number;
  readonly status: PlayerStatus;
}
