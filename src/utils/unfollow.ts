import type { Timings } from '../model/state';
import type { XUser } from '../model/user';
import { unfollowUserViaXApi } from './x-api';

export type UnfollowResult = Pick<XUser, 'username' | 'unfollowStatus' | 'unfollowedAt' | 'unfollowCheckedAt' | 'unfollowError'>;

export type UnfollowProgress = {
  status: 'running' | 'paused' | 'done';
  completed: number;
  failed: number;
  total: number;
  currentUsername?: string;
  batchIndex: number;
  totalBatches: number;
  nextDelayMs?: number;
  message?: string;
};

export type UnfollowController = {
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
};

type CreateUnfollowRunOptions = {
  users: readonly XUser[];
  timings: Timings;
  onResult: (result: UnfollowResult) => void;
  onProgress: (progress: UnfollowProgress) => void;
  onDone: () => void;
};

const STORAGE_KEY = 'iamnotyourfan.unfollowResults.v1';
const RESULT_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CONSECUTIVE_FAILURES = 3;

export function mergeSavedUnfollows(users: readonly XUser[]): XUser[] {
  const saved = readSavedUnfollowResults();
  return users.map(user => {
    const result = saved.get(user.username);
    return result ? applyUnfollowResult(user, result) : user;
  });
}

export function applyUnfollowResult(user: XUser, result: UnfollowResult): XUser {
  return {
    ...user,
    unfollowStatus: result.unfollowStatus,
    unfollowedAt: result.unfollowedAt,
    unfollowCheckedAt: result.unfollowCheckedAt,
    unfollowError: result.unfollowError,
  };
}

export function clearSavedUnfollowResults() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function unfollowOneUser(user: XUser): Promise<UnfollowResult> {
  const running: UnfollowResult = { username: user.username, unfollowStatus: 'running' };
  const response = await unfollowUserViaXApi(user.username);
  if (response.ok) {
    const result: UnfollowResult = {
      username: user.username,
      unfollowStatus: 'unfollowed',
      unfollowedAt: new Date().toISOString(),
      unfollowCheckedAt: new Date().toISOString(),
    };
    saveUnfollowResult(result);
    return result;
  }

  const result: UnfollowResult = {
    ...running,
    unfollowStatus: 'failed',
    unfollowCheckedAt: new Date().toISOString(),
    unfollowError: response.error || `X returned HTTP ${response.status || 'unknown'}`,
  };
  saveUnfollowResult(result);
  return result;
}

export function createUnfollowRun(options: CreateUnfollowRunOptions): UnfollowController {
  const queue = options.users
    .filter(user => user.unfollowStatus !== 'unfollowed')
    .slice(0, Math.max(1, options.timings.unfollowMaxPerRun));
  const batchSize = Math.max(1, options.timings.unfollowBatchSize);
  const totalBatches = Math.max(1, Math.ceil(queue.length / batchSize));
  let index = 0;
  let completed = 0;
  let failed = 0;
  let consecutiveFailures = 0;
  let isPaused = false;
  let isStopped = false;
  let timeoutId: number | undefined;

  const emit = (status: UnfollowProgress['status'], patch: Partial<UnfollowProgress> = {}) => {
    options.onProgress({
      status,
      completed,
      failed,
      total: queue.length,
      batchIndex: Math.min(totalBatches, Math.floor(index / batchSize) + 1),
      totalBatches,
      ...patch,
    });
  };

  const schedule = (delayMs: number) => {
    emit('running', { nextDelayMs: delayMs, message: `Waiting ${formatDelay(delayMs)} before the next unfollow.` });
    timeoutId = window.setTimeout(runNext, delayMs);
  };

  const pauseWithMessage = (message: string) => {
    isPaused = true;
    if (timeoutId) window.clearTimeout(timeoutId);
    emit('paused', { message });
  };

  const runNext = async () => {
    if (isStopped) return;
    if (isPaused) {
      emit('paused', { message: 'Unfollow run paused.' });
      return;
    }
    if (index >= queue.length) {
      emit('done', { message: 'Unfollow run finished.' });
      options.onDone();
      return;
    }

    const user = queue[index];
    emit('running', { currentUsername: user.username, message: `Unfollowing @${user.username}.` });
    options.onResult({ username: user.username, unfollowStatus: 'running' });

    const response = await unfollowUserViaXApi(user.username);
    if (isStopped) return;

    index += 1;
    if (response.ok) {
      completed += 1;
      consecutiveFailures = 0;
      const result: UnfollowResult = {
        username: user.username,
        unfollowStatus: 'unfollowed',
        unfollowedAt: new Date().toISOString(),
        unfollowCheckedAt: new Date().toISOString(),
      };
      saveUnfollowResult(result);
      options.onResult(result);
    } else {
      failed += 1;
      consecutiveFailures += 1;
      const result: UnfollowResult = {
        username: user.username,
        unfollowStatus: 'failed',
        unfollowCheckedAt: new Date().toISOString(),
        unfollowError: response.error || `X returned HTTP ${response.status || 'unknown'}`,
      };
      saveUnfollowResult(result);
      options.onResult(result);

      if (response.hardThrottle || consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        pauseWithMessage(response.hardThrottle
          ? 'X returned a throttle/restriction response. Paused for safety.'
          : 'Paused after 3 consecutive failures.');
        return;
      }
    }

    if (index >= queue.length) {
      emit('done', { message: 'Unfollow run finished.' });
      options.onDone();
      return;
    }

    const completedBatch = index % batchSize === 0;
    schedule(completedBatch ? randomBetween(options.timings.unfollowMinBatchDelayMs, options.timings.unfollowMaxBatchDelayMs) : randomBetween(options.timings.unfollowMinDelayMs, options.timings.unfollowMaxDelayMs));
  };

  return {
    start: () => {
      if (queue.length === 0) {
        emit('done', { message: 'No selected users are eligible to unfollow.' });
        options.onDone();
        return;
      }
      isPaused = false;
      emit('running', { message: 'Starting slow unfollow run.' });
      runNext();
    },
    pause: () => pauseWithMessage('Unfollow run paused.'),
    resume: () => {
      isPaused = false;
      runNext();
    },
    stop: () => {
      isStopped = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      emit('done', { message: 'Unfollow run stopped.' });
      options.onDone();
    },
  };
}

function readSavedUnfollowResults(): Map<string, UnfollowResult> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as UnfollowResult[];
    const now = Date.now();
    return new Map(parsed
      .filter(result => result.username && result.unfollowStatus && result.unfollowCheckedAt)
      .filter(result => now - new Date(result.unfollowCheckedAt!).getTime() <= RESULT_TTL_MS)
      .map(result => [result.username, result]));
  } catch {
    return new Map();
  }
}

function saveUnfollowResult(result: UnfollowResult) {
  const saved = readSavedUnfollowResults();
  saved.set(result.username, result);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(saved.values())));
}

function randomBetween(min: number, max: number) {
  const safeMin = Math.max(0, Math.min(min, max));
  const safeMax = Math.max(safeMin, max);
  return safeMin + Math.floor(Math.random() * (safeMax - safeMin + 1));
}

function formatDelay(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${Math.round(ms / 1000)}s`;
}
