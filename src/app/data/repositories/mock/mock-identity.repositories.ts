import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AppError } from '../../../core/errors/app-error';
import { createId } from '../../../shared/utils/id';
import { Team, TeamMembership, User } from '../../models';
import { DatabaseService } from '../../storage/database.service';
import {
  TeamMembershipRepository, TeamRepository, UserRepository,
} from '../abstract/entity-repositories';
import { simulate } from './mock-latency';

@Injectable()
export class MockUserRepository implements UserRepository {
  private readonly database = inject(DatabaseService);

  getById(id: string): Observable<User> {
    return simulate(() => {
      const user = this.database.select('users').find((row) => row.id === id);
      if (!user) {
        throw AppError.notFound('User', id);
      }
      return user;
    });
  }

  findByEmail(email: string): Observable<User | null> {
    const normalized = email.trim().toLowerCase();
    return simulate(
      () => this.database.select('users').find((row) => row.email.toLowerCase() === normalized) ?? null,
    );
  }

  list(): Observable<readonly User[]> {
    return simulate(() => this.database.select('users'));
  }
}

@Injectable()
export class MockTeamRepository implements TeamRepository {
  private readonly database = inject(DatabaseService);

  getById(id: string): Observable<Team> {
    return simulate(() => {
      const team = this.database.select('teams').find((row) => row.id === id);
      if (!team) {
        throw AppError.notFound('Team', id);
      }
      return team;
    });
  }

  listByIds(ids: readonly string[]): Observable<readonly Team[]> {
    return simulate(() => this.database.select('teams').filter((team) => ids.includes(team.id)));
  }

  update(id: string, patch: Partial<Omit<Team, 'id' | 'createdAt' | 'updatedAt'>>): Observable<Team> {
    return simulate(() => {
      const teams = this.database.select('teams');
      const index = teams.findIndex((team) => team.id === id);
      if (index === -1) {
        throw AppError.notFound('Team', id);
      }
      const updated: Team = { ...teams[index], ...patch, updatedAt: new Date().toISOString() };
      const next = [...teams];
      next[index] = updated;
      this.database.replace('teams', next);
      return updated;
    });
  }
}

@Injectable()
export class MockTeamMembershipRepository implements TeamMembershipRepository {
  private readonly database = inject(DatabaseService);

  listByUser(userId: string): Observable<readonly TeamMembership[]> {
    return simulate(() =>
      this.database.select('memberships').filter((membership) => membership.userId === userId),
    );
  }

  listByTeam(teamId: string): Observable<readonly TeamMembership[]> {
    return simulate(() =>
      this.database.select('memberships').filter((membership) => membership.teamId === teamId),
    );
  }

  create(dto: Omit<TeamMembership, 'id' | 'createdAt' | 'updatedAt'>): Observable<TeamMembership> {
    return simulate(() => {
      const now = new Date().toISOString();
      const membership: TeamMembership = {
        ...dto,
        id: createId('membership'),
        createdAt: now,
        updatedAt: now,
      };
      this.database.replace('memberships', [...this.database.select('memberships'), membership]);
      return membership;
    });
  }

  update(
    id: string,
    patch: Partial<Omit<TeamMembership, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Observable<TeamMembership> {
    return simulate(() => {
      const memberships = this.database.select('memberships');
      const index = memberships.findIndex((membership) => membership.id === id);
      if (index === -1) {
        throw AppError.notFound('Membership', id);
      }
      const updated: TeamMembership = {
        ...memberships[index],
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      const next = [...memberships];
      next[index] = updated;
      this.database.replace('memberships', next);
      return updated;
    });
  }

  remove(id: string): Observable<void> {
    return simulate(() => {
      const memberships = this.database.select('memberships');
      if (!memberships.some((membership) => membership.id === id)) {
        throw AppError.notFound('Membership', id);
      }
      this.database.replace(
        'memberships',
        memberships.filter((membership) => membership.id !== id),
      );
    });
  }
}
