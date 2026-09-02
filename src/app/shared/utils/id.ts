/** Generates a client-side identifier. Phase 2 will let PostgreSQL issue UUIDs. */
export function createId(prefix: string): string {
  const globalCrypto = globalThis.crypto;
  const unique =
    typeof globalCrypto?.randomUUID === 'function'
      ? globalCrypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${unique}`;
}
