import { useState } from 'preact/hooks';
import { NotSearching } from './components/NotSearching';
import { Scanning } from './components/Scanning';
import { type State, DEFAULT_FILTER, DEFAULT_TIMINGS } from './model/state';
import type { XUser } from './model/user';
import { collectVisibleUsers, isOnFollowingPage } from './utils/x-selectors';
import { autoScrollFollowingList } from './utils/auto-scroll';

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

  const updateScanningState = (patch: Partial<Extract<State, { status: 'scanning' }>>) => {
    if (state.status === 'scanning') {
      setState({ ...state, ...patch });
    }
  };

  const handleStartScan = async () => {
    const isPreview = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

    if (isPreview) {
      // Beautiful preview mode with fake data
      const fakeUsers = generateFakeUsers(87);
      setState({
        status: 'scanning',
        progress: 100,
        users: fakeUsers,
        ignoreList: [],
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
      ignoreList: [],
      selected: [],
      filter: DEFAULT_FILTER,
      searchTerm: '',
      page: 1,
      isPaused: false,
    });

    // Start auto-scroll + collection
    await autoScrollFollowingList((progress) => {
      if (state.status !== 'scanning') return;

      const currentUsers = collectVisibleUsers();
      updateScanningState({
        progress: Math.min(95, Math.round((progress.usersFound / 400) * 100)),
        users: currentUsers,
      });
    }, { maxScrolls: 80, waitBetweenScrolls: 550 });

    // Final collection
    const finalUsers = collectVisibleUsers();
    updateScanningState({
      progress: 100,
      users: finalUsers,
    });
  };

  const handleStop = () => {
    setState({ status: 'initial' });
  };

  const handlePauseToggle = () => {
    if (state.status === 'scanning') {
      updateScanningState({ isPaused: !state.isPaused });
    }
  };

  if (state.status === 'initial') {
    return <NotSearching onStartScan={handleStartScan} state={state} />;
  }

  if (state.status === 'scanning') {
    return (
      <Scanning
        state={state}
        onUpdateState={updateScanningState}
        onStop={handleStop}
        onPauseToggle={handlePauseToggle}
      />
    );
  }

  return null;
}
