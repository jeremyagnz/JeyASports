import { Injectable, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { Team } from '../../data/models';
import { TEAM_REPOSITORY } from '../../data/repositories/abstract/tokens';
import { DatabaseService } from '../../data/storage/database.service';
import { AuthService } from '../auth/auth.service';

/**
 * Holds the active tenant. Every repository query in the application derives
 * its `teamId` from here, which is what makes multi-team isolation testable
 * long before row level security exists.
 */
@Injectable({ providedIn: 'root' })
export class TeamContextService {
  private readonly auth = inject(AuthService);
  private readonly teams = inject(TEAM_REPOSITORY);
  private readonly database = inject(DatabaseService);

  readonly activeTeamId = this.auth.activeTeamId;
  readonly role = this.auth.activeRole;

  /** Teams the signed-in user belongs to, resolved from their memberships. */
  readonly availableTeams = toSignal(
    toObservable(
      computed(() => ({
        revision: this.database.revision(),
        memberships: this.auth.userMemberships(),
      })),
    ).pipe(
      switchMap(({ memberships }) =>
        memberships.length === 0
          ? of<readonly Team[]>([])
          : this.teams.listByIds(memberships.map((membership) => membership.teamId)),
      ),
    ),
    { initialValue: [] as readonly Team[] },
  );

  readonly activeTeam = computed(
    () => this.availableTeams().find((team) => team.id === this.activeTeamId()) ?? null,
  );

  readonly hasMultipleTeams = computed(() => this.availableTeams().length > 1);

  /** Convenience accessor for facades; throws when used outside a tenant. */
  requireTeamId(): string {
    const teamId = this.activeTeamId();
    if (!teamId) {
      throw new Error('No active team selected.');
    }
    return teamId;
  }

  switchTeam(teamId: string): void {
    this.auth.setActiveTeam(teamId);
  }
}
