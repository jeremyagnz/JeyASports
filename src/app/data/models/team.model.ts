import { BaseEntity, TeamScopedEntity } from './common.model';

export interface Team extends BaseEntity {
  readonly name: string;
  readonly abbreviation: string;
  readonly logoUrl?: string;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly city: string;
  readonly league: string;
  readonly division: string;
  readonly homeVenueId?: string;
  /** Softball rules differ from baseball: regulation length is configurable. */
  readonly regulationInnings: number;
  /** 9, 10 (short fielder) or 11 (DP/FLEX) depending on the local ruleset. */
  readonly fieldersPerLineup: number;
}

export interface Venue extends TeamScopedEntity {
  readonly name: string;
  readonly address: string;
}

/** Rival team without its own account in the platform. */
export interface Opponent extends TeamScopedEntity {
  readonly name: string;
  readonly abbreviation: string;
  readonly logoUrl?: string;
}
