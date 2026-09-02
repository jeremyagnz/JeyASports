import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, forkJoin, switchMap, throwError } from 'rxjs';
import { TeamContextService } from '../../core/context/team-context.service';
import { NotificationService } from '../../core/services/notification.service';
import { TeamMembership, TeamRole, User } from '../../data/models';
import {
  TEAM_MEMBERSHIP_REPOSITORY, USER_REPOSITORY,
} from '../../data/repositories/abstract/tokens';
import { DatabaseService } from '../../data/storage/database.service';

export interface TeamMember {
  readonly membership: TeamMembership;
  readonly user: User | null;
}

/** Member and data administration for the active team (OWNER only). */
@Injectable({ providedIn: 'root' })
export class AdministrationFacade {
  private readonly memberships = inject(TEAM_MEMBERSHIP_REPOSITORY);
  private readonly users = inject(USER_REPOSITORY);
  private readonly teamContext = inject(TeamContextService);
  private readonly notifications = inject(NotificationService);
  private readonly database = inject(DatabaseService);

  private readonly membersState = signal<readonly TeamMember[]>([]);
  private readonly loadingState = signal(false);

  readonly members = this.membersState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly storageKilobytes = computed(() => {
    this.database.revision();
    return Math.round(this.database.usedBytes() / 102.4) / 10;
  });

  constructor() {
    effect(() => {
      this.teamContext.activeTeamId();
      this.database.revision();
      this.load();
    });
  }

  updateRole(membershipId: string, role: TeamRole): Observable<TeamMembership> {
    return this.memberships.update(membershipId, { role });
  }

  removeMember(membershipId: string): Observable<void> {
    return this.memberships.remove(membershipId);
  }

  addMember(displayName: string, email: string, role: TeamRole): Observable<TeamMembership> {
    const teamId = this.teamContext.requireTeamId();
    return this.users.findByEmail(email).pipe(
      switchMap((existing) => existing
        ? this.memberships.create({
          userId: existing.id, teamId, role, status: 'ACTIVE', joinedAt: new Date().toISOString(),
        })
        : this.users.create({ displayName, email, avatarUrl: undefined }).pipe(
          switchMap((user) => this.memberships.create({
          userId: user.id,
          teamId,
          role,
          status: 'ACTIVE',
          joinedAt: new Date().toISOString(),
          })),
        )),
    );
  }

  exportJson(): string {
    return this.database.export();
  }

  importJson(json: string): void {
    this.database.import(json);
  }

  reseed(): void {
    this.database.reset();
  }

  notifySuccess(message: string): void {
    this.notifications.success(message);
  }

  notifyError(error: unknown): void {
    this.notifications.error(error);
  }

  private load(): void {
    const teamId = this.teamContext.activeTeamId();
    if (!teamId) {
      this.membersState.set([]);
      return;
    }
    this.loadingState.set(true);
    this.memberships.listByTeam(teamId).subscribe({
      next: (memberships) => {
        if (memberships.length === 0) {
          this.membersState.set([]);
          this.loadingState.set(false);
          return;
        }
        forkJoin(memberships.map((membership) => this.users.getById(membership.userId))).subscribe({
          next: (users) => {
            this.membersState.set(
              memberships.map((membership, index) => ({
                membership,
                user: users[index] ?? null,
              })),
            );
            this.loadingState.set(false);
          },
          error: (error: unknown) => this.fail(error),
        });
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  private fail(error: unknown): void {
    this.loadingState.set(false);
    this.notifications.error(error);
  }
}
