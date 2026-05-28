import { useEffect, useState } from 'preact/hooks';
import type { State } from '../model/state';
import type { XUser } from '../model/user';
import { loadIgnoreList, saveIgnoreList, toggleUserInIgnoreList } from '../utils/ignore-list';

interface ScanningProps {
  state: Extract<State, { status: 'scanning' }>;
  onUpdateState: (patch: Partial<Extract<State, { status: 'scanning' }>>) => void;
}

type Tab = 'non_ignored' | 'ignored';

export function Scanning({ state, onUpdateState }: ScanningProps) {
  const [activeTab, setActiveTab] = useState<Tab>('non_ignored');
  const [searchTerm, setSearchTerm] = useState(state.searchTerm || '');
  const [filterType, setFilterType] = useState<'all' | 'non-reciprocal' | 'mutuals'>('non-reciprocal');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

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
  let baseList = activeTab === 'non_ignored'
    ? state.users.filter(u => !isIgnored(u))
    : state.ignoreList;

  // Apply new filter type
  if (filterType === 'non-reciprocal') {
    baseList = baseList.filter(u => !u.isMutual);
  } else if (filterType === 'mutuals') {
    baseList = baseList.filter(u => u.isMutual);
  }

  const filtered = baseList.filter(u => {
    const q = searchTerm.toLowerCase();
    return (
      !searchTerm ||
      u.username.toLowerCase().includes(q) ||
      (u.displayName || '').toLowerCase().includes(q)
    );
  });

  // Sort A-Z by username (stable alphabetical order)
  const sorted = [...filtered].sort((a, b) =>
    a.username.localeCompare(b.username, undefined, { sensitivity: 'base' })
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const nonReciprocalTotal = state.users.filter(u => !u.isMutual).length;
  const mutualsTotal = state.users.filter(u => u.isMutual).length;
  const ignoredCount = state.ignoreList.length;

  const handleToggleIgnore = (user: XUser) => {
    const newList = toggleUserInIgnoreList(state.ignoreList, user);
    onUpdateState({ ignoreList: newList });
  };

  return (
    <div class="iamnotyourfan" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #10100f 0%, #191714 52%, #111 100%)',
    }}>
      {/* Top glassy Toolbar - branding only */}
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
        <div class="serif" style={{ color: '#e0a33a', fontSize: '1.35rem', fontWeight: 700 }}>
          IAmNotYourFan
        </div>
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
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '4px' }}>FOLLOWING</div>
            <div style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
              {state.users.length}
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '4px' }}>YOU ARE A FAN</div>
            <div style={{ fontSize: '2.1rem', fontWeight: 700, color: '#ef6a62', lineHeight: 1 }}>
              {nonReciprocalTotal}
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '4px' }}>BESTIES</div>
            <div style={{ fontSize: '2.1rem', fontWeight: 700, color: '#8ccf7e', lineHeight: 1 }}>
              {mutualsTotal}
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
            <span style={{ fontSize: '0.9rem' }}>Only "you are a fan"</span>
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

          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {(['all', 'non-reciprocal', 'mutuals'] as const).map(type => (
              <button
                key={type}
                onClick={() => { setFilterType(type); setCurrentPage(1); }}
                class="btn"
                style={{
                  padding: '6px 14px',
                  fontSize: '0.85rem',
                  background: filterType === type ? 'var(--amber)' : 'rgba(255,255,255,0.06)',
                  color: filterType === type ? '#1c0d0b' : 'var(--text)',
                  border: '1px solid var(--line)'
                }}
              >
                {type === 'all' ? 'All' : type === 'non-reciprocal' ? 'You are a fan' : 'Besties'}
              </button>
            ))}
          </div>

          {/* User Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '0.65rem',
          }}>
            {paginated.length === 0 && (
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

            {paginated.map(user => {
              const ignored = isIgnored(user);
              const openProfile = () => window.open(user.profileUrl, '_blank');

              return (
                <div
                  key={user.username}
                  class="result-card glass"
                  onClick={openProfile}
                  style={{
                    opacity: ignored && activeTab === 'non_ignored' ? 0.6 : 1,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    onClick={(e) => { e.stopPropagation(); handleToggleIgnore(user); }}
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
                        <span style={{ color: '#ef6a62', fontWeight: 600 }}>You are a fan</span>
                      ) : (
                        <span style={{ color: '#8ccf7e' }}>Bestie</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '1.5rem' }}>
              <button 
                onClick={() => setCurrentPage(Math.max(1, safePage - 1))} 
                disabled={safePage === 1}
                class="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
              >
                ← Prev
              </button>
              <span style={{ padding: '6px 12px', fontSize: '0.9rem', opacity: 0.7 }}>
                Page {safePage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))} 
                disabled={safePage === totalPages}
                class="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
