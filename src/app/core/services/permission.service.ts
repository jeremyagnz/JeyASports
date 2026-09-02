import { Injectable, computed, inject } from '@angular/core';
import { TeamRole } from '../../data/models';
import { AuthService } from '../auth/auth.service';

export type Permission =
  | 'players.manage'
  | 'games.manage'
  | 'stats.manage'
  | 'seasons.manage'
  | 'team.manage'
  | 'members.manage';

const ROLE_PERMISSIONS: Readonly<Record<TeamRole, readonly Permission[]>> = {
  OWNER: ['players.manage', 'games.manage', 'stats.manage', 'seasons.manage', 'team.manage', 'members.manage'],
  ADMIN: ['players.manage', 'games.manage', 'stats.manage', 'seasons.manage', 'team.manage'],
  VIEWER: [],
};

/**
 * Client-side permissions are a UX affordance only. Phase 2 enforces the real
 * rules with PostgreSQL row level security; never treat this as security.
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly auth = inject(AuthService);

  readonly role = this.auth.activeRole;

  readonly canManagePlayers = computed(() => this.can('players.manage'));
  readonly canManageGames = computed(() => this.can('games.manage'));
  readonly canManageStats = computed(() => this.can('stats.manage'));
  readonly canManageSeasons = computed(() => this.can('seasons.manage'));
  readonly canManageTeam = computed(() => this.can('team.manage'));
  readonly canManageMembers = computed(() => this.can('members.manage'));

  can(permission: Permission): boolean {
    const role = this.auth.activeRole();
    return role !== null && ROLE_PERMISSIONS[role].includes(permission);
  }

  hasAnyRole(roles: readonly TeamRole[]): boolean {
    const role = this.auth.activeRole();
    return role !== null && roles.includes(role);
  }
}
