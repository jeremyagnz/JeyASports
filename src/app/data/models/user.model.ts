import { BaseEntity } from './common.model';

/** Role held by a user inside a specific team. */
export type TeamRole = 'OWNER' | 'ADMIN' | 'VIEWER';

export const TEAM_ROLES: readonly TeamRole[] = ['OWNER', 'ADMIN', 'VIEWER'] as const;

export type MembershipStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';

export interface User extends BaseEntity {
  readonly email: string;
  readonly displayName: string;
  readonly avatarUrl?: string;
}

/**
 * Pivot between users and teams. In Phase 2 this is the table every RLS policy
 * joins against, which is why a user may hold several memberships.
 */
export interface TeamMembership extends BaseEntity {
  readonly userId: string;
  readonly teamId: string;
  readonly role: TeamRole;
  readonly status: MembershipStatus;
  readonly joinedAt: string;
}

export interface Session {
  readonly userId: string;
  readonly activeTeamId: string | null;
  readonly memberships: readonly TeamMembership[];
}
