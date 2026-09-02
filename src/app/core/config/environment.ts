/**
 * Phase 1 runs entirely on mock data. The `dataSource` flag is the seam that
 * lets Phase 2 switch repositories to Supabase one feature at a time.
 */
export interface AppEnvironment {
  readonly appName: string;
  readonly dataSource: 'mock' | 'supabase';
  readonly schemaVersion: number;
  readonly storageNamespace: string;
  /** Simulated network latency range, in milliseconds. */
  readonly mockLatencyMs: readonly [number, number];
  /** Probability (0-1) of a simulated repository failure, for testing error states. */
  readonly mockFailureRate: number;
}

export const environment: AppEnvironment = {
  appName: 'JeyA Sports',
  dataSource: 'mock',
  schemaVersion: 1,
  storageNamespace: 'jeyasports',
  mockLatencyMs: [80, 220],
  mockFailureRate: 0,
};
