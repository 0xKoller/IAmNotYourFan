import { useState } from 'preact/hooks';
import { NotSearching } from './components/NotSearching';
import { type State, DEFAULT_FILTER } from './model/state';

export function App() {
  const [state, setState] = useState<State>({ status: 'initial' });

  const handleStartScan = () => {
    // For now we just switch to a fake scanning state
    // Real scanning logic comes in Phase 2
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
  };

  if (state.status === 'initial') {
    return <NotSearching onStartScan={handleStartScan} state={state} />;
  }

  // Temporary placeholder while we build the full Scanning view
  return (
    <div class="iamnotyourfan" style={{ padding: '2rem', color: '#f7f1e8' }}>
      <h2>Scanning view coming in Phase 2</h2>
      <p>State is now: <strong>{state.status}</strong></p>
      <button onClick={() => setState({ status: 'initial' })}>
        Reset to Hero
      </button>
    </div>
  );
}
