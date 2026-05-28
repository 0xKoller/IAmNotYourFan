import type { Timings } from '../model/state';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  timings: Timings;
  onTimingsChange: (newTimings: Timings) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  timings,
  onTimingsChange,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        class="glass"
        style={{
          width: '100%',
          maxWidth: '520px',
          borderRadius: '12px',
          padding: '1.75rem',
          color: 'var(--text)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 class="serif" style={{ margin: 0, color: '#e0a33a' }}>Settings</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>Safety Timings (future use)</h4>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            These will control delays when we add unfollow / deep scan actions.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
            <label>
              Min delay (ms)
              <input 
                type="number" 
                value={timings.minDelayMs}
                onChange={e => onTimingsChange({ ...timings, minDelayMs: parseInt(e.currentTarget.value) || 500 })}
                style={{ width: '100%', padding: '0.4rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--line)', color: 'white', borderRadius: '6px' }}
              />
            </label>
            <label>
              Max delay (ms)
              <input 
                type="number" 
                value={timings.maxDelayMs}
                onChange={e => onTimingsChange({ ...timings, maxDelayMs: parseInt(e.currentTarget.value) || 2000 })}
                style={{ width: '100%', padding: '0.4rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--line)', color: 'white', borderRadius: '6px' }}
              />
            </label>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#666', borderTop: '1px solid var(--line)', paddingTop: '1rem' }}>
          Full unfollow and inactivity scanning features coming soon.
        </div>
      </div>
    </div>
  );
}
