// Core application state for Iamnotyourfan
// Strongly inspired by InstagramUnfollowers state machine

import type { CurrentAccount, XUser } from './user';

export type Filter = {
  onlyNonReciprocal: boolean;
  showVerified: boolean;
};

export type Timings = {
  minDelayMs: number;
  maxDelayMs: number;
  maxProfilesPerRun: number;
  unfollowBatchSize: number;
  unfollowMinDelayMs: number;
  unfollowMaxDelayMs: number;
  unfollowMinBatchDelayMs: number;
  unfollowMaxBatchDelayMs: number;
  unfollowMaxPerRun: number;
};

export type ScanningState = {
  readonly status: 'scanning';
  readonly progress: number;           // 0-100
  readonly users: readonly XUser[];
  readonly selected: readonly XUser[];
  readonly filter: Filter;
  readonly searchTerm: string;
  readonly page: number;
  readonly isPaused: boolean;
  readonly currentAccount?: CurrentAccount;
  readonly isOverlay?: boolean;        // true when we're overlaying on the real X page during collection
  readonly activityScan?: ActivityScanState;
  readonly unfollowRun?: UnfollowRunState;
};

export type ActivityScanState = {
  readonly status: 'idle' | 'running' | 'paused' | 'blocked' | 'done';
  readonly checked: number;
  readonly total: number;
  readonly active: number;
  readonly inactive: number;
  readonly unknown: number;
  readonly currentUsername?: string;
  readonly startedAt?: string;
  readonly etaSeconds?: number;
  readonly message?: string;
};

export type UnfollowRunState = {
  readonly status: 'idle' | 'running' | 'paused' | 'done';
  readonly completed: number;
  readonly failed: number;
  readonly total: number;
  readonly currentUsername?: string;
  readonly batchIndex: number;
  readonly totalBatches: number;
  readonly nextDelayMs?: number;
  readonly message?: string;
};

export type State =
  | { readonly status: 'initial' }
  | ScanningState
  // Future: | { status: 'unfollowing' | 'deep-scanning' ... }

export const DEFAULT_TIMINGS: Timings = {
  minDelayMs: 800,
  maxDelayMs: 1800,
  maxProfilesPerRun: 300,
  unfollowBatchSize: 10,
  unfollowMinDelayMs: 2000,
  unfollowMaxDelayMs: 10000,
  unfollowMinBatchDelayMs: 5000,
  unfollowMaxBatchDelayMs: 45000,
  unfollowMaxPerRun: 50,
};

export const DEFAULT_FILTER: Filter = {
  onlyNonReciprocal: false,
  showVerified: true,
};
