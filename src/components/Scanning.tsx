import { useState } from 'preact/hooks';
import type { State, XUser } from '../model/state';
import type { XUser as XUserType } from '../model/user';

interface ScanningProps {
  state: Extract<State, { status: 'scanning' }>;
  onUpdateState: (newState: Partial<Extract<State, { status: 'scanning' }>>) => void;
  onStop: () => void;
  onPauseToggle: () => void;
}

export function Scanning({ state, onUpdateState, onStop, onPauseToggle }: ScanningProps) {
  const [searchTerm, setSearchTerm] = useState(state.searchTerm);

  // Simple client-side filtered list (will be much richer later)
  const filteredUsers = state.users
    .filter(u => {
      const matchesSearch =
        !searchTerm ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = state.filter.showNonReciprocal ? !u.isMutual : true;

      return matchesSearch && matchesFilter;
    })
    .slice(0, 80); // temporary pagination cap for v1 of Phase 2

  const nonReciprocalCount = state.users.filter(u => !u.isMutual).length;

  return (
    <div class="iamnotyourfan" style={{
      display: 'grid',
      gridTemplateColumns: '260px 1fr',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #10100f 0%, #191714 52%, #111 100%)',
    }}>
      {/* Sidebar */}
      <div class="glass" style={{
        padding: '1.25rem',
        borderRight: '1px solid var(--line)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ color: '#e0a33a', fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 700 }}>
            Iamnotyourfan
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>
            Shallow Scan • {state.users.length} profiles found
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '4px' }}>PROGRESS</div>
          <div style={{
            height: '6px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${state.progress}%`,
              height: '100%',
              background: 'linear-gradient(to right, #e0a33a, #62d6d0)',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{ fontSize: '0.8rem', marginTop: '4px', color: '#e0a33a' }}>{state.progress}%</div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Non-reciprocal</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ef6a62' }}>{nonReciprocalCount}</div>
        </div>

        <button
          onClick={onPauseToggle}
          class="btn btn-secondary"
          style={{ width: '100%', marginBottom: '0.5rem' }}
        >
          {state.isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>

        <button onClick={onStop} class="btn btn-danger" style={{ width: '100%' }}>
          Stop Scan
        </button>

        <div style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#666' }}>
          Tip: The more you scroll before starting, the better the results.
        </div>
      </div>

      {/* Main content */}
      <div style={{ padding: '1.25rem 2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Search username or name..."
            value={searchTerm}
            onInput={(e) => {
              const val = (e.target as HTMLInputElement).value;
              setSearchTerm(val);
              onUpdateState({ searchTerm: val });
            }}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--line)',
              color: 'white',
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              fontSize: '0.95rem',
            }}
          />
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            {filteredUsers.length} shown
          </div>
        </div>

        {/* Results grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '0.75rem',
        }}>
          {filteredUsers.length === 0 && (
            <div style={{ color: 'var(--muted)', padding: '2rem 0' }}>
              No users match your filters yet.
            </div>
          )}

          {filteredUsers.map(user => (
            <div key={user.username} class="result-card glass" style={{ padding: '0.85rem', display: 'flex', gap: '0.75rem' }}>
              <div
                onClick={() => toggleIgnore(user, state, onUpdateState)}
                style={{ cursor: 'pointer', flexShrink: 0 }}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    width="48"
                    height="48"
                    style={{ borderRadius: '50%', border: '1px solid var(--line)' }}
                    alt=""
                  />
                ) : (
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#222',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    color: '#666',
                  }}>
                    {user.username[0]}
                  </div>
                )}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  {user.displayName || user.username}
                </div>
                <div style={{ color: '#62d6d0', fontSize: '0.8rem' }}>
                  @{user.username}
                </div>

                <div style={{ marginTop: '0.35rem', fontSize: '0.75rem' }}>
                  {user.isMutual ? (
                    <span style={{ color: '#8ccf7e' }}>Follows you</span>
                  ) : (
                    <span style={{ color: '#ef6a62', fontWeight: 600 }}>Does NOT follow you</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function toggleIgnore(
  user: XUserType,
  state: Extract<State, { status: 'scanning' }>,
  onUpdateState: (patch: any) => void
) {
  const isIgnored = state.ignoreList.some(u => u.username === user.username);

  const newIgnoreList = isIgnored
    ? state.ignoreList.filter(u => u.username !== user.username)
    : [...state.ignoreList, user];

  onUpdateState({ ignoreList: newIgnoreList });
}
