import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AppError } from '../../../core/errors/app-error';
import { createId } from '../../../shared/utils/id';
import { CreateDto, Page, Query, TeamScopedEntity, UpdateDto } from '../../models';
import { CollectionName, Database } from '../../storage/database';
import { DatabaseService } from '../../storage/database.service';
import { TeamScopedRepository } from '../abstract/repository';
import { simulate } from './mock-latency';

/**
 * Generic in-memory + `localStorage` implementation of the tenant repository
 * contract. Every read is filtered by `teamId` first, mirroring what row level
 * security will enforce server-side in Phase 2.
 */
export abstract class MockCollectionRepository<T extends TeamScopedEntity>
  implements TeamScopedRepository<T>
{
  protected readonly database = inject(DatabaseService);

  protected constructor(
    private readonly collection: CollectionName,
    private readonly idPrefix: string,
    private readonly searchFields: readonly (keyof T & string)[] = [],
  ) {}

  list(query: Query<T>): Observable<readonly T[]> {
    return simulate(() => this.applyQuery(query).items);
  }

  page(query: Query<T>): Observable<Page<T>> {
    return simulate(() => this.applyQuery(query));
  }

  getById(id: string): Observable<T> {
    return simulate(() => {
      const found = this.rows().find((row) => row.id === id);
      if (!found) {
        throw AppError.notFound(this.collection, id);
      }
      return found;
    });
  }

  create(dto: CreateDto<T>): Observable<T> {
    return simulate(() => {
      const now = new Date().toISOString();
      const entity = {
        ...dto,
        id: createId(this.idPrefix),
        createdAt: now,
        updatedAt: now,
      } as unknown as T;
      this.save([...this.rows(), entity]);
      return entity;
    });
  }

  update(id: string, patch: UpdateDto<T>): Observable<T> {
    return simulate(() => {
      const rows = this.rows();
      const index = rows.findIndex((row) => row.id === id);
      if (index === -1) {
        throw AppError.notFound(this.collection, id);
      }
      const updated = { ...rows[index], ...patch, updatedAt: new Date().toISOString() } as T;
      const next = [...rows];
      next[index] = updated;
      this.save(next);
      return updated;
    });
  }

  remove(id: string): Observable<void> {
    return simulate(() => {
      const rows = this.rows();
      if (!rows.some((row) => row.id === id)) {
        throw AppError.notFound(this.collection, id);
      }
      this.save(rows.filter((row) => row.id !== id));
    });
  }

  protected rows(): T[] {
    return this.database.select(this.collection) as unknown as T[];
  }

  protected save(rows: readonly T[]): void {
    this.database.replace(this.collection, rows as unknown as Database[CollectionName]);
  }

  protected applyQuery(query: Query<T>): Page<T> {
    let items = this.rows().filter((row) => row.teamId === query.teamId);

    const filters = query.filters ?? {};
    Object.entries(filters).forEach(([field, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      items = items.filter((row) => (row as Record<string, unknown>)[field] === value);
    });

    const search = query.search?.trim().toLowerCase();
    if (search && this.searchFields.length > 0) {
      items = items.filter((row) =>
        this.searchFields.some((field) =>
          String((row as Record<string, unknown>)[field] ?? '').toLowerCase().includes(search),
        ),
      );
    }

    if (query.sort) {
      const { field, direction } = query.sort;
      const factor = direction === 'asc' ? 1 : -1;
      items = [...items].sort((a, b) => {
        const left = (a as Record<string, unknown>)[field];
        const right = (b as Record<string, unknown>)[field];
        if (typeof left === 'number' && typeof right === 'number') {
          return (left - right) * factor;
        }
        return String(left ?? '').localeCompare(String(right ?? '')) * factor;
      });
    }

    const total = items.length;
    if (query.page) {
      const start = query.page.index * query.page.size;
      items = items.slice(start, start + query.page.size);
    }
    return { items, total };
  }
}
