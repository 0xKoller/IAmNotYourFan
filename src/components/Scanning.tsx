import { useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { State } from '../model/state';
import type { XUser } from '../model/user';

interface ScanningProps {
  state: Extract<State, { status: 'scanning' }>;
  onUpdateState: (patch: Partial<Extract<State, { status: 'scanning' }>>) => void;
  onStartActivityScan: (inactivityMonths: number) => void;
  onPauseActivityScan: () => void;
  onResumeActivityScan: () => void;
  onReopenActivityHelper: () => void;
  onStopActivityScan: () => void;
  onClearActivityResults: () => void;
}

type SortMode = 'fans-first' | 'besties-first' | 'az' | 'za';

export function Scanning({
  state,
  onUpdateState,
  onStartActivityScan,
  onPauseActivityScan,
  onResumeActivityScan,
  onReopenActivityHelper,
  onStopActivityScan,
  onClearActivityResults,
}: ScanningProps) {
  const [searchTerm, setSearchTerm] = useState(state.searchTerm || '');
  const [filterType, setFilterType] = useState<'all' | 'non-reciprocal' | 'mutuals'>('all');
  const [activityFilter, setActivityFilter] = useState<'any' | 'inactive' | 'active' | 'unknown'>('any');
  const [sortMode, setSortMode] = useState<SortMode>('fans-first');
  const [inactivityMonths, setInactivityMonths] = useState('6');
  const [isActivityConfirmOpen, setIsActivityConfirmOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  let baseList: readonly XUser[] = state.users;

  // Apply filter type
  if (filterType === 'non-reciprocal') {
    baseList = baseList.filter(u => !u.isMutual);
  } else if (filterType === 'mutuals') {
    baseList = baseList.filter(u => u.isMutual);
  }

  // Apply "Only you are a fan" checkbox when in All tab
  if (filterType === 'all' && state.filter.onlyNonReciprocal) {
    baseList = baseList.filter(u => !u.isMutual);
  }

  if (activityFilter !== 'any') {
    baseList = baseList.filter(u => u.activityStatus === activityFilter);
  }

  const filtered = baseList.filter(u => {
    const q = searchTerm.toLowerCase();
    return (
      !searchTerm ||
      u.username.toLowerCase().includes(q) ||
      (u.displayName || '').toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === 'fans-first' && a.isMutual !== b.isMutual) return a.isMutual ? 1 : -1;
    if (sortMode === 'besties-first' && a.isMutual !== b.isMutual) return a.isMutual ? -1 : 1;
    const byUsername = a.username.localeCompare(b.username, undefined, { sensitivity: 'base' });
    return sortMode === 'za' ? -byUsername : byUsername;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const nonReciprocalTotal = state.users.filter(u => !u.isMutual).length;
  const mutualsTotal = state.users.filter(u => u.isMutual).length;
  const inactiveTotal = state.users.filter(u => u.activityStatus === 'inactive').length;
  const activeTotal = state.users.filter(u => u.activityStatus === 'active').length;
  const unknownTotal = state.users.filter(u => u.activityStatus === 'unknown').length;
  const checkedTotal = inactiveTotal + activeTotal + unknownTotal;
  const currentAccount = state.currentAccount;
  const inactivityMonthCount = Number(inactivityMonths);
  const canStartActivityScan = Number.isInteger(inactivityMonthCount) && inactivityMonthCount > 0;
  const currentActivityUser = state.activityScan?.currentUsername
    ? state.users.find(user => user.username === state.activityScan?.currentUsername)
    : undefined;
  const latestActivityUser = state.users
    .filter(user => user.activityStatus && user.activityCheckedAt)
    .sort((a, b) => new Date(b.activityCheckedAt!).getTime() - new Date(a.activityCheckedAt!).getTime())[0];

  const confirmActivityScan = () => {
    if (!canStartActivityScan) return;
    setIsActivityConfirmOpen(false);
    onStartActivityScan(inactivityMonthCount);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div class="serif" style={{ color: '#e0a33a', fontSize: '1.35rem', fontWeight: 700 }}>
            IAmNotYourFan
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <HeaderIconLink href="https://github.com/0xKoller/IAmNotYourFan" label="Open GitHub repository">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.45 11.45 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z" />
              </svg>
            </HeaderIconLink>
            <HeaderIconLink href="https://0xkoller.github.io/IAmNotYourFan/" label="Open project website">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
              </svg>
            </HeaderIconLink>
          </div>
        </div>
      </div>

      {/* Main layout with sidebar */}
      <div class="dashboard-layout" style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        paddingTop: '58px',
        minHeight: '100vh',
      }}>
        {/* Sidebar */}
        <div class="glass dashboard-sidebar" style={{
          padding: '1.5rem 1rem',
          borderRight: '1px solid var(--line)',
          position: 'sticky',
          top: '58px',
          height: 'calc(100vh - 58px)',
          overflowY: 'auto',
        }}>
          {currentAccount && (
            <button
              type="button"
              onClick={() => window.open(currentAccount.profileUrl, '_blank')}
              class="account-card"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.35rem',
                padding: '0.75rem',
                borderRadius: '12px',
                border: '1px solid var(--line)',
                background: 'rgba(255,255,255,0.055)',
                color: 'var(--text)',
                textAlign: 'left',
                cursor: 'pointer',
              }}
              aria-label={`Open @${currentAccount.username} profile`}
            >
              {currentAccount.avatarUrl ? (
                <img
                  src={currentAccount.avatarUrl}
                  width="44"
                  height="44"
                  alt=""
                  style={{ borderRadius: '50%', border: '1px solid var(--line)', flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: '1px solid var(--line)',
                  background: 'linear-gradient(135deg, rgba(224,163,58,0.28), rgba(98,214,208,0.18))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--amber)',
                  fontWeight: 800,
                  fontSize: '1rem',
                  flexShrink: 0,
                }}>
                  {currentAccount.username[0]?.toUpperCase()}
                </div>
              )}

              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '2px' }}>
                  SIGNED IN AS
                </div>
                {currentAccount.displayName && (
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentAccount.displayName}
                  </div>
                )}
                <div style={{ color: '#62d6d0', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  @{currentAccount.username}
                </div>
              </div>
            </button>
          )}

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
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '4px' }}>INACTIVE</div>
            <div style={{ fontSize: '2.1rem', fontWeight: 700, color: '#f2b84b', lineHeight: 1 }}>
              {inactiveTotal}
            </div>
            <div style={{ marginTop: '4px', fontSize: '0.74rem', color: 'var(--muted)' }}>
              {checkedTotal} checked · {unknownTotal} unknown
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'grid', gap: '0.5rem' }}>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Inactive after months</span>
              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="Enter months"
                value={inactivityMonths}
                onInput={(e) => setInactivityMonths((e.target as HTMLInputElement).value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--line)',
                  color: 'white',
                  padding: '0.55rem 0.7rem',
                  borderRadius: '8px',
                  fontSize: '0.86rem',
                }}
              />
            </label>
            <button
              onClick={() => canStartActivityScan && setIsActivityConfirmOpen(true)}
              disabled={!canStartActivityScan}
              class="btn btn-primary"
              style={{
                justifyContent: 'center',
                padding: '0.65rem 0.75rem',
                fontSize: '0.82rem',
                opacity: canStartActivityScan ? 1 : 0.5,
                cursor: canStartActivityScan ? 'pointer' : 'not-allowed',
              }}
            >
              Scan inactive
            </button>
            <button onClick={onClearActivityResults} class="btn btn-secondary" style={{ justifyContent: 'center', padding: '0.55rem 0.75rem', fontSize: '0.78rem' }}>
              Clear inactive results
            </button>
          </div>
        </div>

        {/* Main content area */}
        <div class="dashboard-main" style={{ padding: '1.25rem 2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
            <label style={{ display: 'grid', gap: '0.4rem', minWidth: '260px', flex: '1 1 280px' }}>
              <span style={{ color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 700 }}>Search users</span>
              <input
                type="text"
                placeholder="Username or display name"
                value={searchTerm}
                onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--line)',
                  color: 'white',
                  padding: '0.6rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                }}
              />
            </label>

            <div style={{ display: 'grid', gap: '0.4rem' }}>
              <div style={{ color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 700 }}>Relationship</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(['all', 'non-reciprocal', 'mutuals'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => { setFilterType(type); setCurrentPage(1); }}
                    class="btn"
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.85rem',
                      background: filterType === type ? 'var(--amber)' : 'rgba(255,255,255,0.06)',
                      color: filterType === type ? '#1c0d0b' : 'var(--text)',
                      border: '1px solid var(--line)'
                    }}
                  >
                    {type === 'all' ? `All (${state.users.length})` : type === 'non-reciprocal' ? `You are a fan (${nonReciprocalTotal})` : `Besties (${mutualsTotal})`}
                  </button>
                ))}
                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  minHeight: '36px',
                  padding: '0 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  background: 'rgba(255,255,255,0.04)',
                  color: filterType === 'all' ? 'var(--text)' : 'var(--muted)',
                  cursor: filterType === 'all' ? 'pointer' : 'not-allowed',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}>
                  <input
                    type="checkbox"
                    disabled={filterType !== 'all'}
                    checked={state.filter.onlyNonReciprocal}
                    onChange={(e) => onUpdateState({
                      filter: { ...state.filter, onlyNonReciprocal: (e.target as HTMLInputElement).checked }
                    })}
                  />
                  Only "you are a fan"
                </label>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '0.4rem' }}>
              <div style={{ color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 700 }}>Activity</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(['any', 'inactive', 'active', 'unknown'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => { setActivityFilter(type); setCurrentPage(1); }}
                    class="btn"
                    style={{
                      padding: '8px 12px',
                      fontSize: '0.8rem',
                      background: activityFilter === type ? '#62d6d0' : 'rgba(255,255,255,0.06)',
                      color: activityFilter === type ? '#071414' : 'var(--text)',
                      border: '1px solid var(--line)'
                    }}
                  >
                    {type === 'any' ? `Any (${state.users.length})` : type === 'inactive' ? `Inactive (${inactiveTotal})` : type === 'active' ? `Active (${activeTotal})` : `Unknown (${unknownTotal})`}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gap: '0.4rem' }}>
              <div style={{ color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 700 }}>Sort</div>
              <select
                value={sortMode}
                onChange={(e) => { setSortMode((e.target as HTMLSelectElement).value as SortMode); setCurrentPage(1); }}
                style={{
                  minHeight: '36px',
                  minWidth: '180px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--line)',
                  color: 'var(--text)',
                  borderRadius: '8px',
                  padding: '0 0.75rem',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <option value="fans-first">You are a fan → Besties</option>
                <option value="besties-first">Besties → You are a fan</option>
                <option value="az">A-Z</option>
                <option value="za">Z-A</option>
              </select>
            </div>
          </div>

          {state.activityScan && (
            <div class="glass" style={{
              marginBottom: '1rem',
              padding: '1.1rem',
              borderRadius: '14px',
              display: 'grid',
              gap: '0.9rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: 'var(--amber)', fontWeight: 700, fontSize: '0.95rem' }}>Quiet inactive account scan</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '3px' }}>
                    {state.activityScan.currentUsername ? 'Checking following profiles' : state.activityScan.message || 'Ready'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {state.activityScan.status === 'running' && (
                    <button onClick={onPauseActivityScan} class="btn btn-secondary" style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}>Pause</button>
                  )}
                  {state.activityScan.status === 'paused' && (
                    <button onClick={onResumeActivityScan} class="btn btn-primary" style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}>Resume</button>
                  )}
                  {state.activityScan.status === 'blocked' && (
                    <button onClick={onReopenActivityHelper} class="btn btn-primary" style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}>Reopen helper window</button>
                  )}
                  {state.activityScan.status !== 'done' && (
                    <button onClick={onStopActivityScan} class="btn btn-secondary" style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}>Stop</button>
                  )}
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.5rem',
                padding: '0.85rem 1rem',
                border: '1px solid rgba(98,214,208,0.22)',
                borderRadius: '12px',
                background: 'rgba(98,214,208,0.065)',
                flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flex: '1 1 260px', minWidth: 0 }}>
                  <span style={{ color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 700 }}>Checked</span>
                  <span style={{ color: 'var(--text)', fontSize: '1.35rem', fontWeight: 800, lineHeight: 1 }}>
                    {state.activityScan.checked.toLocaleString()} of {state.activityScan.total.toLocaleString()}
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>following profiles</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <CurrentScanUser user={currentActivityUser} username={state.activityScan.currentUsername} />
                  <LatestActivityResult user={latestActivityUser} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem' }}>
                <ActivityMetric label="Inactive" value={state.activityScan.inactive.toString()} tone="#f2b84b" />
                <ActivityMetric label="Active" value={state.activityScan.active.toString()} tone="#8ccf7e" />
                <ActivityMetric label="Unknown" value={state.activityScan.unknown.toString()} tone="#9aa0a6" />
                <ActivityMetric label="ETA" value={formatEta(state.activityScan.etaSeconds)} />
              </div>
            </div>
          )}

          {isActivityConfirmOpen && (
            <div style={{
              position: 'fixed',
              inset: 0,
              zIndex: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              background: 'rgba(0,0,0,0.62)',
              backdropFilter: 'blur(8px)',
            }}>
              <div class="glass" role="dialog" aria-modal="true" aria-labelledby="activity-confirm-title" style={{
                width: 'min(520px, 100%)',
                borderRadius: '18px',
                padding: '1.35rem',
                boxShadow: 'var(--shadow-2)',
              }}>
                <div id="activity-confirm-title" style={{ color: 'var(--amber)', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.55rem' }}>
                  Experimental inactive scan
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.55, display: 'grid', gap: '0.65rem' }}>
                  <p style={{ margin: 0 }}>
                    This feature checks profiles through X using your current browser session. Use it at your own risk: X can change internals, rate-limit requests, or return incomplete data.
                  </p>
                  <p style={{ margin: 0 }}>
                    IAmNotYourFan does not collect or send your credentials to our servers. Temporary X session headers used for this scan stay in your browser/localStorage so the code can make local requests, and you can audit the implementation in the public repo.
                  </p>
                  <p style={{ margin: 0, color: 'var(--text)' }}>
                    This will mark accounts inactive when their last visible API activity is older than <strong>{inactivityMonthCount}</strong> months.
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.7rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                  <button onClick={() => setIsActivityConfirmOpen(false)} class="btn btn-secondary" style={{ padding: '0.65rem 0.9rem', fontSize: '0.86rem' }}>
                    Cancel
                  </button>
                  <button onClick={confirmActivityScan} class="btn btn-primary" style={{ padding: '0.65rem 0.9rem', fontSize: '0.86rem' }}>
                    I understand, start scan
                  </button>
                </div>
              </div>
            </div>
          )}

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
              const openProfile = () => window.open(user.profileUrl, '_blank');

              return (
                <div
                  key={user.username}
                  class="result-card glass"
                  onClick={openProfile}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: '1 1 auto' }}>
                        {user.displayName || user.username}
                      </div>
                      {user.activityStatus && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          borderRadius: '999px',
                          border: '1px solid var(--line)',
                          padding: '2px 7px',
                          fontSize: '0.68rem',
                          color: activityColor(user),
                          background: 'rgba(255,255,255,0.05)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}>
                          {activityLabel(user)}
                        </span>
                      )}
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

function HeaderIconLink({ href, label, children }: { href: string; label: string; children: ComponentChildren }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      aria-label={label}
      title={label}
      class="header-icon-link"
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '999px',
        border: '1px solid var(--line)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--muted)',
        background: 'rgba(255,255,255,0.045)',
        textDecoration: 'none',
      }}
    >
      {children}
    </a>
  );
}

function CurrentScanUser({ user, username }: { user?: XUser; username?: string }) {
  const isLoading = !username;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: '210px' }}>
      {isLoading ? (
        <div class="scan-skeleton" style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0 }} />
      ) : user?.avatarUrl ? (
        <img
          src={user.avatarUrl}
          width="34"
          height="34"
          alt=""
          style={{ borderRadius: '50%', border: '1px solid var(--line)', flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          border: '1px solid var(--line)',
          background: '#222',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted)',
          fontSize: '0.8rem',
          fontWeight: 800,
          flexShrink: 0,
        }}>
          {username?.[0]?.toUpperCase()}
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ color: 'var(--muted)', fontSize: '0.68rem', fontWeight: 700 }}>CURRENTLY CHECKING</div>
        {isLoading ? (
          <div style={{ display: 'grid', gap: '4px', marginTop: '4px' }}>
            <div class="scan-skeleton" style={{ width: '132px', height: '10px', borderRadius: '999px' }} />
            <div class="scan-skeleton" style={{ width: '82px', height: '9px', borderRadius: '999px' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'baseline', minWidth: 0 }}>
            {user?.displayName && (
              <span style={{ color: 'var(--text)', fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                {user.displayName}
              </span>
            )}
            <span style={{ color: '#62d6d0', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>@{username}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function LatestActivityResult({ user }: { user?: XUser }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: '230px' }}>
      {!user ? (
        <div class="scan-skeleton" style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0 }} />
      ) : user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          width="34"
          height="34"
          alt=""
          style={{ borderRadius: '50%', border: '1px solid var(--line)', flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          border: '1px solid var(--line)',
          background: '#222',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted)',
          fontSize: '0.8rem',
          fontWeight: 800,
          flexShrink: 0,
        }}>
          {user.username[0]?.toUpperCase()}
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ color: 'var(--muted)', fontSize: '0.68rem', fontWeight: 700 }}>LATEST RESULT</div>
        {!user ? (
          <div style={{ display: 'grid', gap: '4px', marginTop: '4px' }}>
            <div class="scan-skeleton" style={{ width: '142px', height: '10px', borderRadius: '999px' }} />
            <div class="scan-skeleton" style={{ width: '108px', height: '9px', borderRadius: '999px' }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '2px' }}>
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', minWidth: 0 }}>
              <span style={{ color: activityColor(user), fontSize: '0.82rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                {user.activityStatus === 'inactive' ? 'Inactive' : user.activityStatus === 'active' ? 'Active' : 'Unknown'}
              </span>
              <span style={{ color: '#62d6d0', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>@{user.username}</span>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.74rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '190px' }}>
              Last activity: {formatActivityDate(user.lastActivityAt)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityMetric({ label, value, tone = 'var(--text)' }: { label: string; value: string; tone?: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.045)', border: '1px solid var(--line)', borderRadius: '10px', padding: '0.6rem 0.7rem' }}>
      <div style={{ color: 'var(--muted)', fontSize: '0.7rem', marginBottom: '2px' }}>{label}</div>
      <div style={{ color: tone, fontWeight: 700, fontSize: '0.95rem' }}>{value}</div>
    </div>
  );
}

function formatEta(seconds?: number) {
  if (!seconds) return '—';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 1) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}

function activityColor(user: XUser) {
  if (user.activityStatus === 'inactive') return '#f2b84b';
  if (user.activityStatus === 'active') return '#8ccf7e';
  return '#9aa0a6';
}

function activityLabel(user: XUser) {
  if (user.activityStatus === 'unknown') return 'Unknown activity';
  return `${user.activityStatus === 'inactive' ? 'Inactive' : 'Active'}: ${formatActivityDate(user.lastActivityAt)}`;
}

function formatActivityDate(value?: string) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : 'date unknown';
}
