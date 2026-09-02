import { TeamScopedEntity } from './common.model';

export type SeasonStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED';

export interface Season extends TeamScopedEntity {
  readonly name: string;
  readonly year: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly status: SeasonStatus;
  readonly isCurrent: boolean;
  /** Minimum plate appearances required to qualify for batting leaderboards. */
  readonly qualifyingPlateAppearances: number;
  /** Minimum innings pitched (in outs) required to qualify for pitching leaderboards. */
  readonly qualifyingOuts: number;
}
