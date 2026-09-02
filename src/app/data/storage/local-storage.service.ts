import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from '../../core/config/environment';
import { AppError } from '../../core/errors/app-error';

/**
 * The single place in the application allowed to touch `localStorage`.
 * Everything is namespaced and defensive: private mode and quota errors must
 * never crash the app.
 */
@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  private readonly document = inject(DOCUMENT);

  private get storage(): Storage | null {
    try {
      return this.document.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }

  key(name: string): string {
    return `${environment.storageNamespace}:v${environment.schemaVersion}:${name}`;
  }

  read<T>(name: string, fallback: T): T {
    const raw = this.storage?.getItem(this.key(name));
    if (raw === null || raw === undefined) {
      return fallback;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

    try {
      storage.setItem(this.key(name), JSON.stringify(value));
    } catch (error) {
      throw new AppError('STORAGE', 'El almacenamiento local está lleno o no está disponible.', error);
    }
  }

  remove(name: string): void {
    this.storage?.removeItem(this.key(name));
  }

  /** Removes every key owned by this application, across schema versions. */
  clearNamespace(): void {
    const storage = this.storage;
    if (!storage) {
      return;
    }
    const prefix = `${environment.storageNamespace}:`;
    const doomed: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith(prefix)) {
        doomed.push(key);
      }
    }
    doomed.forEach((key) => storage.removeItem(key));
  }

  /** Approximate size in bytes of the namespace, used by the data tools page. */
  usedBytes(): number {
    const storage = this.storage;
    if (!storage) {
      return 0;
    }
    const prefix = `${environment.storageNamespace}:`;
    let total = 0;
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith(prefix)) {
        total += key.length + (storage.getItem(key)?.length ?? 0);
      }
    }
    return total * 2;
  }
}
