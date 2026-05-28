import { useEffect, useState } from 'preact/hooks';
import type { State } from '../model/state';
import type { XUser } from '../model/user';
import { loadIgnoreList, saveIgnoreList, toggleUserInIgnoreList } from '../utils/ignore-list';
import { copyHandlesToClipboard, exportToJSON, exportToCSV } from '../utils/exports';

interface ScanningProps {
  state: Extract<State, { status: 'scanning' }>;
  onUpdateState: (patch: Partial<Extract<State, { status: 'scanning' }>>) => void;
  onStop: () => void;
  onPauseToggle: () => void;
}

type Tab = 'non_ignored' | 'ignored';

export function Scanning({ state, onUpdateState, onStop, onPauseToggle }: ScanningProps) {
  const [activeTab, setActiveTab] = useState<Tab>('non_ignored');
  const [searchTerm, setSearchTerm] = useState(state.searchTerm || '');

  // Load persistent ignore list on mount
  useEffect(() => {
    const saved = loadIgnoreList();
    if (saved.length > 0 && state.ignoreList.length === 0) {
      onUpdateState({ ignoreList: saved });
    }
  }, []);

  // Keep localStorage in sync
  useEffect(() => {
    saveIgnoreList(state.ignoreList);
  }, [state.ignoreList]);

  const isIgnored = (user: XUser) =>
    state.ignoreList.some(u => u.username === user.username);

  // Main list depending on tab
  const baseList = activeTab === 'non_ignored'
    ? state.users.filter(u => !isIgnored(u))
    : state.ignoreList;

  const filtered = baseList.filter(u => {
    const q = searchTerm.toLowerCase();
    return (
      !searchTerm ||
      u.username.toLowerCase().includes(q) ||
      (u.displayName || '').toLowerCase().includes(q)
    );
  });

  const nonReciprocalTotal = state.users.filter(u => !u.isMutual).length;
  const ignoredCount = state.ignoreList.length;

  const isOverlayMode = !!(state as any).isOverlay;

  const handleToggleIgnore = (user: XUser) => {
    const newList = toggleUserInIgnoreList(state.ignoreList, user);
    onUpdateState({ ignoreList: newList });
  };

  const handleExport = (type: 'copy' | 'json' | 'csv') => {
    const data = filtered;
    if (data.length === 0) return;

    if (type === 'copy') copyHandlesToClipboard(data);
    if (type === 'json') exportToJSON(data);
    if (type === 'csv') exportToCSV(data);
  };

  return (
    <div class="iamnotyourfan" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #10100f 0%, #191714 52%, #111 100%)',
    }}>
      {/* Top glassy Toolbar - very close to InstagramUnfollowers style */}
      <div class="glass" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '58px',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.25rem',
        borderBottom: '1px solid var(--line)',
        backdropFilter: 'blur(14px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <div class="serif" style={{ color: '#e0a33a', fontSize: '1.35rem', fontWeight: 700 }}>
            Iamnotyourfan
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            {state.progress < 100 ? 'Scanning...' : 'Scan complete'} • {state.users.length} profiles
          </div>
        </div>

        {/* Progress bar in toolbar */}
        <div style={{ width: '160px', marginRight: '1.5rem' }}>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px' }}>
            <div style={{
              width: `${state.progress}%`,
              height: '100%',
              background: 'linear-gradient(to right, #e0a33a, #62d6d0)',
              transition: 'width 0.3s ease',
              borderRadius: '999px',
            }} />
          </div>
        </div>

        {/* Export buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem' }}>
          <button class="btn btn-secondary" onClick={() => handleExport('copy')} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            Copy handles
          </button>
          <button class="btn btn-secondary" onClick={() => handleExport('json')} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            JSON
          </button>
          <button class="btn btn-secondary" onClick={() => handleExport('csv')} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            CSV
          </button>
        </div>

        <button onClick={onPauseToggle} class="btn btn-secondary" style={{ marginRight: '0.5rem' }}>
          {state.isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>

        <button onClick={onStop} class="btn btn-danger" style={{ marginRight: '0.5rem' }}>
          Stop
        </button>

        {isOverlayMode && (
          <button 
            onClick={() => (window as any).__iamnotyourfanFinishCollection?.()} 
            class="btn btn-primary"
            style={{ marginRight: '0.5rem', background: '#e0a33a', color: '#1c0d0b' }}
          >
            Finish Collection &amp; Go to Clean View
          </button>
        )}

        <button 
          onClick={() => (window as any).__openIamnotyourfanSettings?.()} 
          class="btn btn-secondary" 
          title="Settings"
          style={{ padding: '0.5rem 0.75rem' }}
        >
          ⚙
        </button>
      </div>

      {/* Main layout with sidebar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        paddingTop: '58px',
        minHeight: '100vh',
      }}>
        {/* Sidebar */}
        <div class="glass" style={{
          padding: '1.5rem 1rem',
          borderRight: '1px solid var(--line)',
          position: 'sticky',
          top: '58px',
          height: 'calc(100vh - 58px)',
          overflowY: 'auto',
        }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '4px' }}>NON-RECIPROCAL</div>
            <div style={{ fontSize: '2.1rem', fontWeight: 700, color: '#ef6a62', lineHeight: 1 }}>
              {nonReciprocalTotal}
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '4px' }}>IGNORED</div>
            <div style={{ fontSize: '2.1rem', fontWeight: 700, color: '#62d6d0', lineHeight: 1 }}>
              {ignoredCount}
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>FILTERS</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={state.filter.showNonReciprocal}
              onChange={(e) => onUpdateState({
                filter: { ...state.filter, showNonReciprocal: (e.target as HTMLInputElement).checked }
              })}
            />
            <span style={{ fontSize: '0.9rem' }}>Only non-reciprocal</span>
          </label>

          <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#666' }}>
            Click avatars to add/remove from ignore list.
          </div>
        </div>

        {/* Main content area */}
        <div style={{ padding: '1.25rem 2rem' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--line)', marginBottom: '1rem' }}>
            <button
              onClick={() => setActiveTab('non_ignored')}
              style={{
                padding: '0.75rem 0',
                fontWeight: activeTab === 'non_ignored' ? 700 : 400,
                color: activeTab === 'non_ignored' ? '#e0a33a' : 'var(--muted)',
                borderBottom: activeTab === 'non_ignored' ? '3px solid #e0a33a' : 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.95rem',
              }}
            >
              Non-Ignored ({state.users.filter(u => !isIgnored(u)).length})
            </button>
            <button
              onClick={() => setActiveTab('ignored')}
              style={{
                padding: '0.75rem 0',
                fontWeight: activeTab === 'ignored' ? 700 : 400,
                color: activeTab === 'ignored' ? '#e0a33a' : 'var(--muted)',
                borderBottom: activeTab === 'ignored' ? '3px solid #e0a33a' : 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.95rem',
              }}
            >
              Ignored ({ignoredCount})
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by username or name..."
            value={searchTerm}
            onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
            style={{
              width: '100%',
              maxWidth: '420px',
              marginBottom: '1rem',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--line)',
              color: 'white',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontSize: '0.95rem',
            }}
          />

          {/* User Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '0.65rem',
          }}>
            {filtered.length === 0 && (
              <div style={{ color: 'var(--muted)', padding: '2rem 0' }}>
                No users in this view.
                <br /><br />
                {(location.hostname.includes('x.com') || location.hostname.includes('twitter.com')) && (
                  <button 
                    onClick={() => (window as any).__forceRealScan?.()} 
                    class="btn btn-primary"
                    style={{ fontSize: '0.9rem' }}
                  >
                    Force Start Real Scan on this page
                  </button>
                )}
              </div>
            )}

            {filtered.map(user => {
              const ignored = isIgnored(user);
              return (
                <div
                  key={user.username}
                  class="result-card glass"
                  style={{
                    opacity: ignored && activeTab === 'non_ignored' ? 0.6 : 1,
                  }}
                >
                  <div
                    onClick={() => handleToggleIgnore(user)}
                    style={{ cursor: 'pointer' }}
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} width="46" height="46" alt="" />
                    ) : (
                      <div style={{
                        width: '46px', height: '46px', borderRadius: '50%',
                        background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', color: '#666'
                      }}>
                        {user.username[0]}
                      </div>
                    )}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {user.displayName || user.username}
                    </div>
                    <div style={{ color: '#62d6d0', fontSize: '0.78rem' }}>
                      @{user.username}
                    </div>

                    <div style={{ marginTop: '4px', fontSize: '0.75rem' }}>
                      {!user.isMutual ? (
                        <span style={{ color: '#ef6a62', fontWeight: 600 }}>Does not follow you</span>
                      ) : (
                        <span style={{ color: '#8ccf7e' }}>Follows you</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
