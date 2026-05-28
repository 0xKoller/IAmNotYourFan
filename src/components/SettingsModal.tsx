import { useState } from 'preact/hooks';
import type { Timings } from '../model/state';
import type { XUser } from '../model/user';
import { exportToJSON } from '../utils/exports';
import { saveIgnoreList } from '../utils/ignore-list';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  timings: Timings;
  onTimingsChange: (newTimings: Timings) => void;
  ignoreList: readonly XUser[];
  onIgnoreListChange: (newList: XUser[]) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  timings,
  onTimingsChange,
  ignoreList,
  onIgnoreListChange,
}: SettingsModalProps) {
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportIgnoreList = () => {
    if (ignoreList.length === 0) return;
    exportToJSON([...ignoreList], `iamnotyourfan-ignore-list-${new Date().toISOString().slice(0,10)}.json`);
  };

  const handleImportIgnoreList = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!Array.isArray(data)) throw new Error('Invalid format');

        const validUsers = data.filter((u: any) => 
          typeof u.username === 'string' && typeof u.profileUrl === 'string'
        );

        // Merge strategy like IG tool
        const existingUsernames = new Set(ignoreList.map(u => u.username));
        const newOnes = validUsers.filter((u: XUser) => !existingUsernames.has(u.username));
        
        const merged = [...ignoreList, ...newOnes];
        onIgnoreListChange(merged);
        saveIgnoreList(merged);
        setImportError(null);
      } catch (err) {
        setImportError('Failed to import. Make sure it is a valid JSON export from Iamnotyourfan.');
      }
    };
    reader.readAsText(file);
    input.value = ''; // reset
  };

  const handleClearIgnoreList = () => {
    if (confirm('Clear your entire ignore list? This cannot be undone.')) {
      onIgnoreListChange([]);
      saveIgnoreList([]);
    }
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

        <div>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>Ignore List ({ignoreList.length})</h4>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <button class="btn btn-secondary" onClick={handleExportIgnoreList} disabled={ignoreList.length === 0}>
              Export JSON
            </button>
            
            <label class="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
              Import JSON
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportIgnoreList}
                style={{ display: 'none' }} 
              />
            </label>

            <button class="btn btn-danger" onClick={handleClearIgnoreList} disabled={ignoreList.length === 0}>
              Clear All
            </button>
          </div>

          {importError && (
            <div style={{ color: '#ef6a62', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{importError}</div>
          )}

          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
            Your ignore list is saved locally in this browser.
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#666', borderTop: '1px solid var(--line)', paddingTop: '1rem' }}>
          Full unfollow and inactivity scanning features coming soon.
        </div>
      </div>
    </div>
  );
}
