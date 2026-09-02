import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { AppError } from '../errors/app-error';
import { LocalStorageService } from '../../data/storage/local-storage.service';
import { Session, TeamMembership, TeamRole, User } from '../../data/models';
import {
  TEAM_MEMBERSHIP_REPOSITORY, USER_REPOSITORY,
} from '../../data/repositories/abstract/tokens';

const SESSION_KEY = 'session';

interface PersistedSession {
  readonly userId: string;
  readonly activeTeamId: string | null;
}

/**
 * Phase 1 authentication is simulated: any known demo e-mail signs in without a
 * password. The public API (signals + methods) is what Phase 2 will keep when
 * the internals move to Supabase Auth.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly users = inject(USER_REPOSITORY);
  private readonly memberships = inject(TEAM_MEMBERSHIP_REPOSITORY);
  private readonly storage = inject(LocalStorageService);

  private readonly currentUserState = signal<User | null>(null);
  private readonly membershipsState = signal<readonly TeamMembership[]>([]);
  private readonly activeTeamIdState = signal<string | null>(null);
  private readonly restoredState = signal(false);

  readonly currentUser = this.currentUserState.asReadonly();
  readonly userMemberships = this.membershipsState.asReadonly();
  readonly activeTeamId = this.activeTeamIdState.asReadonly();
  readonly restored = this.restoredState.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserState() !== null);

  readonly activeMembership = computed(() => {
    const teamId = this.activeTeamIdState();
    return this.membershipsState().find((membership) => membership.teamId === teamId) ?? null;
  });

  readonly activeRole = computed<TeamRole | null>(() => this.activeMembership()?.role ?? null);

  readonly session = computed<Session | null>(() => {
    const user = this.currentUserState();
    if (!user) {
      return null;
    }
    return {
      userId: user.id,
      activeTeamId: this.activeTeamIdState(),
      memberships: this.membershipsState(),
    };
  });

  /** Restores a persisted session on application start-up. */
  restore(): Observable<User | null> {
    const persisted = this.storage.read<PersistedSession | null>(SESSION_KEY, null);
    if (!persisted) {
      this.restoredState.set(true);
      return of(null);
    }
    return forkJoin({
      user: this.users.getById(persisted.userId),
      memberships: this.memberships.listByUser(persisted.userId),
    }).pipe(
      map(({ user, memberships }) => {
        this.applySession(user, memberships, persisted.activeTeamId);
        return user;
      }),
      tap({
        next: () => this.restoredState.set(true),
        error: () => {
          this.storage.remove(SESSION_KEY);
          this.restoredState.set(true);
        },
      }),
    );
  }

  login(email: string): Observable<User> {
    return this.users.findByEmail(email).pipe(
      switchMap((user) => {
        if (!user) {
          throw AppError.validation('No account matches that e-mail address.');
        }
        return this.memberships.listByUser(user.id).pipe(
          map((memberships) => {
            if (memberships.length === 0) {
              throw AppError.permission('This account does not belong to any team yet.');
            }
            this.applySession(user, memberships, memberships[0].teamId);
            return user;
          }),
        );
      }),
    );
  }

  logout(): void {
    this.currentUserState.set(null);
    this.membershipsState.set([]);
    this.activeTeamIdState.set(null);
    this.storage.remove(SESSION_KEY);
  }

  setActiveTeam(teamId: string): void {
    if (!this.membershipsState().some((membership) => membership.teamId === teamId)) {
      throw AppError.permission('You are not a member of that team.');
    }
    this.activeTeamIdState.set(teamId);
    this.persist();
  }

  private applySession(
    user: User,
    memberships: readonly TeamMembership[],
    preferredTeamId: string | null,
  ): void {
    const active = memberships.some((membership) => membership.teamId === preferredTeamId)
      ? preferredTeamId
      : (memberships[0]?.teamId ?? null);
    this.currentUserState.set(user);
    this.membershipsState.set(memberships);
    this.activeTeamIdState.set(active);
    this.persist();
  }

  private persist(): void {
    const user = this.currentUserState();
    if (!user) {
      return;
    }
    this.storage.write<PersistedSession>(SESSION_KEY, {
      userId: user.id,
      activeTeamId: this.activeTeamIdState(),
    });
  }
}
