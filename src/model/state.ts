// Core application state for Iamnotyourfan
// Strongly inspired by InstagramUnfollowers state machine

import type { XUser } from './user';

export type Filter = {
  showNonReciprocal: boolean;
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
  showNonReciprocal: true,
  showVerified: true,
};
