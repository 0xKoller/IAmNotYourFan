// Core application state for Iamnotyourfan
// Strongly inspired by InstagramUnfollowers state machine

export type User = {
  username: string;
  displayName: string;
  avatarUrl?: string;
  profileUrl: string;
  isMutual: boolean;
  isVerified?: boolean;
};

export type Filter = {
  showNonReciprocal: boolean;
  showVerified: boolean;
};

export type IgnoreList = readonly User[];

export type Timings = {
  minDelayMs: number;
  maxDelayMs: number;
  maxProfilesPerRun: number;
};

export type ScanningState = {
  readonly status: 'scanning';
  readonly progress: number;           // 0-100
  readonly users: readonly User[];
  readonly ignoreList: IgnoreList;
  readonly selected: readonly User[];
  readonly filter: Filter;
  readonly searchTerm: string;
  readonly page: number;
  readonly isPaused: boolean;
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
