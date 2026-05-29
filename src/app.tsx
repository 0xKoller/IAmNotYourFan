import { useState, useEffect, useRef } from 'preact/hooks';
import { NotSearching } from './components/NotSearching';
import { Scanning } from './components/Scanning';
import { SettingsModal } from './components/SettingsModal';
import { type State, DEFAULT_FILTER, DEFAULT_TIMINGS } from './model/state';
import type { CurrentAccount, XUser } from './model/user';
import { collectVisibleUsers, getCurrentAccount, isOnFollowingPage } from './utils/x-selectors';
import { autoScrollFollowingList } from './utils/auto-scroll';
import {
  applyActivityResult,
  clearSavedActivityResults,
  createActivityScan,
  mergeSavedActivity,
  type ActivityScanController,
} from './utils/activity-scan';
import {
  applyUnfollowResult,
  clearSavedUnfollowResults,
  createUnfollowRun,
  mergeSavedUnfollows,
  unfollowOneUser,
  type UnfollowController,
  type UnfollowResult,
} from './utils/unfollow';

// Development helper — generates realistic fake users
function generateFakeUsers(count: number): XUser[] {
  const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Quinn'];
  const lastNames = ['Rivera', 'Kim', 'Patel', 'Chen', 'Santos', 'Nguyen', 'Okoro', 'Schmidt'];

  return Array.from({ length: count }, (_, i) => {
    const username = `user${1000 + i}`;
    const isMutual = Math.random() > 0.65;
    return {
      username,
      displayName: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
      avatarUrl: `https://i.pravatar.cc/48?u=${username}`,
      profileUrl: `https://x.com/${username}`,
      isMutual,
      isVerified: Math.random() > 0.85,
    };
  });
}

export function App() {
  const [state, setState] = useState<State>({ status: 'initial' });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [timings, setTimings] = useState(DEFAULT_TIMINGS);
  const activityScanRef = useRef<ActivityScanController | null>(null);
  const unfollowRunRef = useRef<UnfollowController | null>(null);

  const readCurrentAccount = (): CurrentAccount | undefined => {
    return (window as any).__IAMNOTYOURFAN_CURRENT_ACCOUNT || getCurrentAccount();
  };

  const updateScanningState = (patch: Partial<Extract<State, { status: 'scanning' }>>) => {
    setState(current => current.status === 'scanning' ? { ...current, ...patch } : current);
  };

  const updateUsersWithActivityResult = (result: Parameters<typeof applyActivityResult>[1]) => {
    setState(current => {
      if (current.status !== 'scanning') return current;
      return {
        ...current,
        users: current.users.map(user =>
          user.username === result.username ? applyActivityResult(user, result) : user
        ),
      };
    });
  };

  const withSavedLocalResults = (users: readonly XUser[]) => mergeSavedUnfollows(mergeSavedActivity(users));

  const updateUsersWithUnfollowResult = (result: UnfollowResult) => {
    setState(current => {
      if (current.status !== 'scanning') return current;
      return {
        ...current,
        users: current.users.map(user =>
          user.username === result.username ? applyUnfollowResult(user, result) : user
        ),
        selected: result.unfollowStatus === 'unfollowed'
          ? current.selected.filter(user => user.username !== result.username)
          : current.selected,
      };
    });
  };

  // Expose settings opener for the gear button in Scanning toolbar
  useEffect(() => {
    (window as any).__openIamnotyourfanSettings = () => setIsSettingsOpen(true);
    return () => {
      delete (window as any).__openIamnotyourfanSettings;
    };
  }, []);

  // Expose a force real scan for the UI fallback button
  useEffect(() => {
    (window as any).__forceRealScan = () => {
      if (state.status === 'scanning') {
        handleStartScan();
      }
    };
    return () => {
      delete (window as any).__forceRealScan;
    };
  }, [state.status]);

  // Auto-start real scan when running as console script on real X
  useEffect(() => {
    const isRealConsole = 
      (typeof import.meta.env.CONSOLE_MODE !== 'undefined' && import.meta.env.CONSOLE_MODE === 'true') ||
      (location.hostname.includes('x.com') || location.hostname.includes('twitter.com'));

    const isOverlay = !!(window as any).__IAMNOTYOURFAN_IS_OVERLAY;

    if (isRealConsole && state.status === 'initial') {
      const initialUsers = (window as any).__IAMNOTYOURFAN_INITIAL_USERS || [];

      // Small delay so the takeover/overlay finishes rendering
      const timer = setTimeout(() => {
        if (isOnFollowingPage()) {
          const baseState = {
            status: 'scanning' as const,
            progress: initialUsers.length > 0 ? Math.min(40, Math.round((initialUsers.length / 300) * 100)) : 0,
            users: withSavedLocalResults(initialUsers),
            selected: [],
            filter: DEFAULT_FILTER,
            searchTerm: '',
            page: 1,
            isPaused: false,
            currentAccount: readCurrentAccount(),
            isOverlay,
          };

          setState(baseState);

          // Continue harvesting only while the original X DOM still exists.
          // In the normal console flow main.ts already completed collection,
          // then replaced the page with this dashboard; scanning again there
          // would read the dashboard DOM and overwrite the real following list.
          if (isOverlay) {
            continueRealScanInBackground();
          } else if (initialUsers.length === 0) {
            handleStartScan();
          }
        }
      }, 450);

      return () => clearTimeout(timer);
    }
  }, []); // run once on mount

  const handleStartScan = async () => {
    const isConsoleBuild = typeof import.meta.env.CONSOLE_MODE !== 'undefined' && import.meta.env.CONSOLE_MODE === 'true';
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

    // Never use fake data when running as a real console script (pasted on x.com)
    if (isLocalhost && !isConsoleBuild) {
      const fakeUsers = withSavedLocalResults(generateFakeUsers(87));
      setState({
        status: 'scanning',
        progress: 100,
        users: fakeUsers,
        selected: [],
        filter: DEFAULT_FILTER,
        searchTerm: '',
        page: 1,
        isPaused: false,
        currentAccount: {
          username: 'you',
          displayName: 'Demo account',
          avatarUrl: 'https://i.pravatar.cc/48?u=you',
          profileUrl: 'https://x.com/you',
        },
      });
      return;
    }

    // Real X mode
    if (!isOnFollowingPage()) {
      alert('Please go to your Following page first (x.com/yourname/following) and try again.');
      return;
    }

    setState({
      status: 'scanning',
      progress: 0,
      users: [],
      selected: [],
      filter: DEFAULT_FILTER,
      searchTerm: '',
      page: 1,
      isPaused: false,
      currentAccount: readCurrentAccount(),
    });

    try {
      // Real auto-scroll + collection with live updates
      await autoScrollFollowingList((progress) => {
        const currentUsers = withSavedLocalResults(collectVisibleUsers());
        updateScanningState({
          progress: Math.min(95, Math.round((progress.usersFound / 600) * 100)),
          users: currentUsers,
        });
      }, { maxScrolls: 120, waitBetweenScrolls: 580 });

      const finalUsers = withSavedLocalResults(collectVisibleUsers());
      updateScanningState({
        progress: 100,
        users: finalUsers,
      });
    } catch {
      alert('Scanning ran into an error. Please refresh the Following page and try again.');
    }
  };

  // Used when we already have some users from pre-takeover snapshot
  const continueRealScanInBackground = async () => {
    try {
      await autoScrollFollowingList(() => {
        const currentUsers = withSavedLocalResults(collectVisibleUsers());
        setState(current => {
          if (current.status !== 'scanning') return current;
          const existing = new Map(current.users.map((u: XUser) => [u.username, u]));
          currentUsers.forEach((u: XUser) => existing.set(u.username, u));
          return {
            ...current,
            progress: Math.min(95, Math.round((existing.size / 600) * 100)),
            users: Array.from(existing.values()) as XUser[],
          };
        });
      }, { maxScrolls: 100, waitBetweenScrolls: 580 });

      const finalUsers = withSavedLocalResults(collectVisibleUsers());
      setState(current => {
        if (current.status !== 'scanning') return current;
        const existing = new Map(current.users.map((u: XUser) => [u.username, u]));
        finalUsers.forEach((u: XUser) => existing.set(u.username, u));
        return {
          ...current,
          progress: 100,
          users: Array.from(existing.values()) as XUser[],
        };
      });
    } catch {
      // Ignore background collection failures; the dashboard keeps the users already collected.
    }
  };

  const startActivityScan = (inactivityMonths: number) => {
    if (state.status !== 'scanning') return;
    activityScanRef.current?.stop();
    const users = withSavedLocalResults(state.users);
    updateScanningState({ users });

    const controller = createActivityScan({
      users,
      inactivityMonths,
      onResult: updateUsersWithActivityResult,
      onProgress: (progress) => {
        updateScanningState({
          activityScan: {
            status: progress.status,
            checked: progress.checked,
            total: progress.total,
            active: progress.active,
            inactive: progress.inactive,
            unknown: progress.unknown,
            currentUsername: progress.currentUsername,
            startedAt: progress.startedAt,
            etaSeconds: progress.etaSeconds,
            message: progress.message,
          },
        });
      },
      onDone: () => {
        setState(current => {
          if (current.status !== 'scanning') return current;
          const scan = current.activityScan;
          return {
            ...current,
            activityScan: scan ? { ...scan, status: 'done', currentUsername: undefined, etaSeconds: undefined } : scan,
          };
        });
      },
    });

    activityScanRef.current = controller;
    controller.start();
  };

  const pauseActivityScan = () => activityScanRef.current?.pause();
  const resumeActivityScan = () => activityScanRef.current?.resume();
  const reopenActivityHelper = () => activityScanRef.current?.reopen();
  const stopActivityScan = () => activityScanRef.current?.stop();
  const unfollowSingle = async (user: XUser) => {
    updateUsersWithUnfollowResult({ username: user.username, unfollowStatus: 'running' });
    updateUsersWithUnfollowResult(await unfollowOneUser(user));
  };
  const startMassUnfollow = (users: readonly XUser[]) => {
    unfollowRunRef.current?.stop();
    const controller = createUnfollowRun({
      users,
      timings,
      onResult: updateUsersWithUnfollowResult,
      onProgress: (progress) => {
        updateScanningState({
          unfollowRun: {
            status: progress.status,
            completed: progress.completed,
            failed: progress.failed,
            total: progress.total,
            currentUsername: progress.currentUsername,
            batchIndex: progress.batchIndex,
            totalBatches: progress.totalBatches,
            nextDelayMs: progress.nextDelayMs,
            message: progress.message,
          },
        });
      },
      onDone: () => {
        setState(current => {
          if (current.status !== 'scanning') return current;
          const run = current.unfollowRun;
          return {
            ...current,
            unfollowRun: run ? { ...run, status: 'done', currentUsername: undefined, nextDelayMs: undefined } : run,
          };
        });
      },
    });
    unfollowRunRef.current = controller;
    controller.start();
  };
  const pauseUnfollowRun = () => unfollowRunRef.current?.pause();
  const resumeUnfollowRun = () => unfollowRunRef.current?.resume();
  const stopUnfollowRun = () => unfollowRunRef.current?.stop();
  const clearActivityResults = () => {
    clearSavedActivityResults();
    activityScanRef.current?.stop();
    activityScanRef.current = null;
    setState(current => {
      if (current.status !== 'scanning') return current;
      return {
        ...current,
        users: current.users.map(user => ({
          ...user,
          activityStatus: undefined,
          lastActivityAt: undefined,
          activityCheckedAt: undefined,
          activityReason: undefined,
        })),
        activityScan: undefined,
      };
    });
  };
  const clearUnfollowResults = () => {
    clearSavedUnfollowResults();
    unfollowRunRef.current?.stop();
    unfollowRunRef.current = null;
    setState(current => {
      if (current.status !== 'scanning') return current;
      return {
        ...current,
        users: current.users.map(user => ({
          ...user,
          unfollowStatus: undefined,
          unfollowedAt: undefined,
          unfollowCheckedAt: undefined,
          unfollowError: undefined,
        })),
        selected: [],
        unfollowRun: undefined,
      };
    });
  };

  if (state.status === 'initial') {
    return <NotSearching onStartScan={handleStartScan} state={state} />;
  }

  if (state.status === 'scanning') {
    return (
      <>
        <Scanning
          state={state}
          onUpdateState={updateScanningState}
          onStartActivityScan={startActivityScan}
          onPauseActivityScan={pauseActivityScan}
          onResumeActivityScan={resumeActivityScan}
          onReopenActivityHelper={reopenActivityHelper}
          onStopActivityScan={stopActivityScan}
          onClearActivityResults={clearActivityResults}
          onUnfollowSingle={unfollowSingle}
          onStartMassUnfollow={startMassUnfollow}
          onPauseUnfollowRun={pauseUnfollowRun}
          onResumeUnfollowRun={resumeUnfollowRun}
          onStopUnfollowRun={stopUnfollowRun}
          onClearUnfollowResults={clearUnfollowResults}
          timings={timings}
        />
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          timings={timings}
          onTimingsChange={setTimings}
        />
      </>
    );
  }

  return null;
}
