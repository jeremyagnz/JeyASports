import { Observable } from 'rxjs';
import {
  BaseEntity, CreateDto, Page, Query, TeamScopedEntity, UpdateDto,
} from '../../models';

/**
 * Base contract implemented by every repository.
 *
 * Everything returns an `Observable`, even in Phase 1, so switching to a real
 * network-backed implementation never changes a single call site.
 */
export interface ReadRepository<T extends BaseEntity> {
  list(query: Query<T>): Observable<readonly T[]>;
  page(query: Query<T>): Observable<Page<T>>;
  getById(id: string): Observable<T>;
}

export interface WriteRepository<T extends BaseEntity> {
  create(dto: CreateDto<T>): Observable<T>;
  update(id: string, patch: UpdateDto<T>): Observable<T>;
  remove(id: string): Observable<void>;
}

/**
 * Repositories for tenant data. `Query.teamId` is mandatory by type, which is
 * the compile-time counterpart of the Phase 2 row level security policies.
 */
export interface TeamScopedRepository<T extends TeamScopedEntity>
  extends ReadRepository<T>, WriteRepository<T> {}
