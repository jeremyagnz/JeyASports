/**
 * Cross-cutting contracts shared by every domain model.
 *
 * Every persisted entity carries an `id` and ISO timestamps so the shape maps
 * one-to-one onto a PostgreSQL table in Phase 2.
 */
export interface BaseEntity {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Entities that belong to a single team (the future RLS boundary). */
export interface TeamScopedEntity extends BaseEntity {
  readonly teamId: string;
}

export type SortDirection = 'asc' | 'desc';

export interface SortSpec<T> {
  readonly field: keyof T & string;
  readonly direction: SortDirection;
}

export interface PageSpec {
  readonly index: number;
  readonly size: number;
}

/**
 * Explicit query contract. Keeping filtering/sorting/pagination declarative
 * (instead of doing it in the component) is what allows the mock repositories
 * to be swapped for Supabase queries without touching the UI.
 */
export interface Query<T> {
  readonly teamId: string;
  readonly filters?: Partial<Record<keyof T & string, unknown>>;
  readonly search?: string;
  readonly sort?: SortSpec<T>;
  readonly page?: PageSpec;
}

export interface Page<T> {
  readonly items: readonly T[];
  readonly total: number;
}

/** Payload used to create an entity: identity and audit fields are generated. */
export type CreateDto<T extends BaseEntity> = Omit<T, keyof BaseEntity>;

/** Payload used to patch an entity. */
export type UpdateDto<T extends BaseEntity> = Partial<Omit<T, keyof BaseEntity>>;
