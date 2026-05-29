import type { XUser } from '../model/user';
import { checkActivityViaXApi } from './x-api';

export type ActivityResult = Pick<XUser,
  'username' | 'activityStatus' | 'lastActivityAt' | 'activityCheckedAt' | 'activityReason'
> & { inactivityMonths?: number };

export type ActivityProgress = {
  status: 'running' | 'paused' | 'blocked' | 'done';
  checked: number;
  total: number;
  active: number;
  inactive: number;
  unknown: number;
  currentUsername?: string;
  startedAt: string;
  etaSeconds?: number;
  message?: string;
};

export type ActivityScanController = {
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reopen: () => void;
  clearSaved: () => void;
};

type CreateActivityScanOptions = {
  users: readonly XUser[];
  inactivityMonths: number;
  onResult: (result: ActivityResult) => void;
  onProgress: (progress: ActivityProgress) => void;
  onDone: () => void;
};

const STORAGE_KEY = 'iamnotyourfan.activityResults.v1';
const RESULT_TTL_MS = 24 * 60 * 60 * 1000;
const MIN_PROFILE_DELAY_MS = 4500;
const MAX_PROFILE_DELAY_MS = 9000;
const AVERAGE_PROFILE_DELAY_MS = (MIN_PROFILE_DELAY_MS + MAX_PROFILE_DELAY_MS) / 2;
const RETRY_DELAY_MS = 2500;

export function mergeSavedActivity(users: readonly XUser[]): XUser[] {
  const saved = readSavedResults();
  return users.map(user => {
    const result = saved.get(user.username);
    return result ? applyActivityResult(user, result) : user;
  });
}

export function applyActivityResult(user: XUser, result: ActivityResult): XUser {
  return {
    ...user,
    activityStatus: result.activityStatus,
    lastActivityAt: result.lastActivityAt,
    activityCheckedAt: result.activityCheckedAt,
    activityReason: result.activityReason,
  };
}

export function clearSavedActivityResults() {
  localStorage.removeItem(STORAGE_KEY);
}

export function createActivityScan(options: CreateActivityScanOptions): ActivityScanController {
  const startedAt = new Date().toISOString();
  const users = orderUsers(options.users);
  const saved = readSavedResults(options.inactivityMonths);
  const queue = users.filter(user => !saved.has(user.username));
  const counts = countResults(users, saved);
  let checked = users.length - queue.length;
  let currentIndex = 0;
  let isPaused = false;
  let isStopped = false;

  const emit = (status: ActivityProgress['status'], currentUsername?: string, message?: string) => {
    const remaining = Math.max(0, queue.length - currentIndex);
    options.onProgress({
      status,
      checked,
      total: users.length,
      active: counts.active,
      inactive: counts.inactive,
      unknown: counts.unknown,
      currentUsername,
      startedAt,
      etaSeconds: status === 'running' ? Math.round((remaining * AVERAGE_PROFILE_DELAY_MS) / 1000) : undefined,
      message,
    });
  };

  const scanNext = async () => {
    if (isStopped) return;
    if (isPaused) {
      emit('paused');
      return;
    }
    if (currentIndex >= queue.length) {
      emit('done');
      options.onDone();
      return;
    }

    const user = queue[currentIndex];
    emit('running', user.username);
    const result = await checkProfileActivity(user, options.inactivityMonths);
    if (isStopped) return;

    currentIndex += 1;
    checked += 1;
    if (result.activityStatus === 'active') counts.active += 1;
    if (result.activityStatus === 'inactive') counts.inactive += 1;
    if (result.activityStatus === 'unknown') counts.unknown += 1;
    saveActivityResult(result);
    options.onResult(result);
    emit('running');
    window.setTimeout(scanNext, getNextProfileDelayMs());
  };

  const start = () => {
    isPaused = false;
    emit('running', undefined, 'Quiet API scan running slowly with your X session cookies.');
    scanNext();
  };

  return {
    start,
    pause: () => {
      isPaused = true;
      emit('paused');
    },
    resume: () => {
      isPaused = false;
      scanNext();
    },
    stop: () => {
      isStopped = true;
      emit('done');
      options.onDone();
    },
    reopen: () => {
      isPaused = false;
      scanNext();
    },
    clearSaved: clearSavedActivityResults,
  };
}

function orderUsers(users: readonly XUser[]): XUser[] {
  return [...users].sort((a, b) => {
    if (a.isMutual !== b.isMutual) return a.isMutual ? 1 : -1;
    return a.username.localeCompare(b.username, undefined, { sensitivity: 'base' });
  });
}

function readSavedResults(inactivityMonths?: number): Map<string, ActivityResult> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as ActivityResult[];
    const now = Date.now();
    return new Map(parsed
      .filter(result => result.username && result.activityCheckedAt)
      .filter(result => now - new Date(result.activityCheckedAt!).getTime() <= RESULT_TTL_MS)
      .filter(result => inactivityMonths === undefined || result.inactivityMonths === inactivityMonths)
      .map(result => [result.username, result]));
  } catch {
    return new Map();
  }
}

function saveActivityResult(result: ActivityResult) {
  const saved = readSavedResults();
  saved.set(result.username, result);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(saved.values())));
}

function countResults(users: readonly XUser[], saved: Map<string, ActivityResult>) {
  const counts = { active: 0, inactive: 0, unknown: 0 };
  users.forEach(user => {
    const status = saved.get(user.username)?.activityStatus || user.activityStatus;
    if (status === 'active') counts.active += 1;
    if (status === 'inactive') counts.inactive += 1;
    if (status === 'unknown') counts.unknown += 1;
  });
  return counts;
}

async function checkProfileActivity(user: XUser, inactivityMonths: number): Promise<ActivityResult> {
  let result = await checkActivityViaXApi(user.username, inactivityMonths);
  if (result) return result;
  await wait(RETRY_DELAY_MS);
  result = await checkActivityViaXApi(user.username, inactivityMonths);
  return result || unknownResult(user.username, 'Quiet X API scan is unavailable for this account right now');
}

function unknownResult(username: string, activityReason: string): ActivityResult {
  return {
    username,
    activityStatus: 'unknown',
    activityCheckedAt: new Date().toISOString(),
    activityReason,
  };
}

function wait(ms: number) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function getNextProfileDelayMs() {
  return MIN_PROFILE_DELAY_MS + Math.floor(Math.random() * (MAX_PROFILE_DELAY_MS - MIN_PROFILE_DELAY_MS));
}
