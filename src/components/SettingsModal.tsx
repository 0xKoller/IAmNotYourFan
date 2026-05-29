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

  const updateNumber = (key: keyof Timings, value: string, fallback: number, min = 0) => {
    onTimingsChange({ ...timings, [key]: Math.max(min, parseInt(value, 10) || fallback) });
  };

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
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>Activity scan timings</h4>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            These control slow profile checks for the inactive-account scan.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
            <label>
              Min delay (ms)
              <input 
                type="number" 
                value={timings.minDelayMs}
                onChange={e => updateNumber('minDelayMs', e.currentTarget.value, 500)}
                style={{ width: '100%', padding: '0.4rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--line)', color: 'white', borderRadius: '6px' }}
              />
            </label>
            <label>
              Max delay (ms)
              <input 
                type="number" 
                value={timings.maxDelayMs}
                onChange={e => updateNumber('maxDelayMs', e.currentTarget.value, 2000)}
                style={{ width: '100%', padding: '0.4rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--line)', color: 'white', borderRadius: '6px' }}
              />
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>Unfollow batch timings</h4>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.45 }}>
            Random delays reduce burstiness, but cannot guarantee X will not throttle or restrict the account.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
            <label>
              Batch size
              <input
                type="number"
                min="1"
                value={timings.unfollowBatchSize}
                onChange={e => updateNumber('unfollowBatchSize', e.currentTarget.value, 10, 1)}
                style={{ width: '100%', padding: '0.4rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--line)', color: 'white', borderRadius: '6px' }}
              />
            </label>
            <label>
              Max per run
              <input
                type="number"
                min="1"
                value={timings.unfollowMaxPerRun}
                onChange={e => updateNumber('unfollowMaxPerRun', e.currentTarget.value, 50, 1)}
                style={{ width: '100%', padding: '0.4rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--line)', color: 'white', borderRadius: '6px' }}
              />
            </label>
            <label>
              Min user delay (ms)
              <input
                type="number"
                min="0"
                value={timings.unfollowMinDelayMs}
                onChange={e => updateNumber('unfollowMinDelayMs', e.currentTarget.value, 2000)}
                style={{ width: '100%', padding: '0.4rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--line)', color: 'white', borderRadius: '6px' }}
              />
            </label>
            <label>
              Max user delay (ms)
              <input
                type="number"
                min="0"
                value={timings.unfollowMaxDelayMs}
                onChange={e => updateNumber('unfollowMaxDelayMs', e.currentTarget.value, 10000)}
                style={{ width: '100%', padding: '0.4rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--line)', color: 'white', borderRadius: '6px' }}
              />
            </label>
            <label>
              Min batch delay (ms)
              <input
                type="number"
                min="0"
                value={timings.unfollowMinBatchDelayMs}
                onChange={e => updateNumber('unfollowMinBatchDelayMs', e.currentTarget.value, 5000)}
                style={{ width: '100%', padding: '0.4rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--line)', color: 'white', borderRadius: '6px' }}
              />
            </label>
            <label>
              Max batch delay (ms)
              <input
                type="number"
                min="0"
                value={timings.unfollowMaxBatchDelayMs}
                onChange={e => updateNumber('unfollowMaxBatchDelayMs', e.currentTarget.value, 45000)}
                style={{ width: '100%', padding: '0.4rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--line)', color: 'white', borderRadius: '6px' }}
              />
            </label>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#666', borderTop: '1px solid var(--line)', paddingTop: '1rem' }}>
          All actions run locally in your browser using your current X session.
        </div>
      </div>
    </div>
  );
}
