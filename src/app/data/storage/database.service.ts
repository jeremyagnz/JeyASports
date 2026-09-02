import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../core/config/environment';
import { AppError } from '../../core/errors/app-error';
import { buildSeedDatabase } from '../mock/seed-data';
import { COLLECTION_NAMES, CollectionName, Database, emptyDatabase } from './database';
import { LocalStorageService } from './local-storage.service';

const META_KEY = 'meta';

interface DatabaseMeta {
  readonly schemaVersion: number;
  readonly seededAt: string;
}

/**
 * Owns the in-memory dataset and its `localStorage` mirror.
 *
 * Only mock repositories talk to this service; facades and components never do.
 * A schema version mismatch triggers a reseed so evolving the models can never
 * leave corrupt data behind.
 */
@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private readonly storage = inject(LocalStorageService);
  private data: Database = emptyDatabase();
  private initialized = false;

  /** Bumped on every write so facades can react to external data resets. */
  readonly revision = signal(0);

  ensureInitialized(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    const meta = this.storage.read<DatabaseMeta | null>(META_KEY, null);
    if (!meta || meta.schemaVersion !== environment.schemaVersion) {
      this.seed();
      return;
    }
    this.data = COLLECTION_NAMES.reduce((accumulator, name) => {
      (accumulator[name] as unknown[]) = this.storage.read<unknown[]>(name, []);
      return accumulator;
    }, emptyDatabase());
  }

  /** Returns a defensive copy so callers cannot mutate the store in place. */
  select<K extends CollectionName>(name: K): Database[K] {
    this.ensureInitialized();
    return [...this.data[name]] as Database[K];
  }

  replace<K extends CollectionName>(name: K, rows: Database[K]): void {
    this.ensureInitialized();
    this.data[name] = rows;
    this.storage.write(name, rows);
    this.revision.update((value) => value + 1);
  }

  seed(): void {
    this.data = buildSeedDatabase();
    this.persistAll();
  }

  reset(): void {
    this.storage.clearNamespace();
    this.data = emptyDatabase();
    this.persistAll();
  }

  export(): string {
    this.ensureInitialized();
    return JSON.stringify(
      { schemaVersion: environment.schemaVersion, data: this.data },
      null,
      2,
    );
  }

  import(json: string): void {
    let parsed: { schemaVersion?: number; data?: Partial<Database> };
    try {
      parsed = JSON.parse(json);
    } catch (error) {
      throw new AppError('VALIDATION', 'The file is not valid JSON.', error);
    }
    if (parsed.schemaVersion !== environment.schemaVersion || !parsed.data) {
      throw AppError.validation(
        `Expected a backup with schema version ${environment.schemaVersion}.`,
      );
    }
    const next = emptyDatabase();
    COLLECTION_NAMES.forEach((name) => {
      const rows = parsed.data?.[name];
      (next[name] as unknown[]) = Array.isArray(rows) ? rows : [];
    });
    this.data = next;
    this.persistAll();
  }

  usedBytes(): number {
    return this.storage.usedBytes();
  }

  private persistAll(): void {
    this.storage.write<DatabaseMeta>(META_KEY, {
      schemaVersion: environment.schemaVersion,
      seededAt: new Date().toISOString(),
    });
    COLLECTION_NAMES.forEach((name) => this.storage.write(name, this.data[name]));
    this.initialized = true;
    this.revision.update((value) => value + 1);
  }
}
