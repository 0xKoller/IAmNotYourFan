import { useState, useEffect, useRef } from 'preact/hooks';
import { NotSearching } from './components/NotSearching';
import { Scanning } from './components/Scanning';
import { SettingsModal } from './components/SettingsModal';
import { type State, DEFAULT_FILTER, DEFAULT_TIMINGS } from './model/state';
import type { XUser } from './model/user';
import { collectVisibleUsers, isOnFollowingPage } from './utils/x-selectors';
import { autoScrollFollowingList } from './utils/auto-scroll';
import {
  applyActivityResult,
  clearSavedActivityResults,
  createActivityScan,
  mergeSavedActivity,
  type ActivityScanController,
} from './utils/activity-scan';

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
            users: mergeSavedActivity(initialUsers),
            selected: [],
            filter: DEFAULT_FILTER,
            searchTerm: '',
            page: 1,
            isPaused: false,
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
      const fakeUsers = mergeSavedActivity(generateFakeUsers(87));
      setState({
        status: 'scanning',
        progress: 100,
        users: fakeUsers,
        selected: [],
        filter: DEFAULT_FILTER,
        searchTerm: '',
        page: 1,
        isPaused: false,
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
    });

    try {
      console.log('%c[IAmNotYourFan] Starting real DOM scan on current page...', 'color:#e0a33a');
      
      // Real auto-scroll + collection with live updates
      await autoScrollFollowingList((progress) => {
        const currentUsers = mergeSavedActivity(collectVisibleUsers());
        updateScanningState({
          progress: Math.min(95, Math.round((progress.usersFound / 600) * 100)),
          users: currentUsers,
        });
      }, { maxScrolls: 120, waitBetweenScrolls: 580 });

      const finalUsers = mergeSavedActivity(collectVisibleUsers());
      updateScanningState({
        progress: 100,
        users: finalUsers,
      });
      
      console.log('%c[IAmNotYourFan] Real scan finished. Users found:', 'color:#62d6d0', finalUsers.length);
    } catch (err) {
      console.error('[IAmNotYourFan] Real scan failed:', err);
      alert('Scanning ran into an error. Check the console for details. You can try the test snippet from TESTING_REAL_PROFILE.md as a fallback.');
    }
  };

  // Used when we already have some users from pre-takeover snapshot
  const continueRealScanInBackground = async () => {
    try {
      await autoScrollFollowingList(() => {
        const currentUsers = mergeSavedActivity(collectVisibleUsers());
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

      const finalUsers = mergeSavedActivity(collectVisibleUsers());
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
    } catch (err) {
      console.error('[IAmNotYourFan] Background collection failed:', err);
    }
  };

  const startActivityScan = () => {
    if (state.status !== 'scanning') return;
    activityScanRef.current?.stop();
    const users = mergeSavedActivity(state.users);
    updateScanningState({ users });

    const controller = createActivityScan({
      users,
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
