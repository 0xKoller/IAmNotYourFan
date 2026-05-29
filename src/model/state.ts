// Core application state for Iamnotyourfan
// Strongly inspired by InstagramUnfollowers state machine

import type { XUser } from './user';

export type Filter = {
  onlyNonReciprocal: boolean;
  showVerified: boolean;
};

export type Timings = {
  minDelayMs: number;
  maxDelayMs: number;
  maxProfilesPerRun: number;
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
  readonly isOverlay?: boolean;        // true when we're overlaying on the real X page during collection
  readonly activityScan?: ActivityScanState;
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

export type State =
  | { readonly status: 'initial' }
  | ScanningState
  // Future: | { status: 'unfollowing' | 'deep-scanning' ... }

export const DEFAULT_TIMINGS: Timings = {
  minDelayMs: 800,
  maxDelayMs: 1800,
  maxProfilesPerRun: 300,
};

export const DEFAULT_FILTER: Filter = {
  onlyNonReciprocal: false,
  showVerified: true,
};
