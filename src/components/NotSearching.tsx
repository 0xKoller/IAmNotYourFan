import { type State } from '../model/state';

interface NotSearchingProps {
  onStartScan: () => void;
  state: State;
}

export function NotSearching({ onStartScan }: NotSearchingProps) {
  return (
    <div class="iamnotyourfan" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #10100f 0%, #191714 52%, #111 100%)',
      padding: '2rem',
    }}>
      <div style={{ maxWidth: '680px', textAlign: 'center' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(224,163,58,0.1)',
            color: '#e0a33a',
            padding: '0.35rem 1rem',
            borderRadius: '999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            letterSpacing: '0.5px',
          }}>
            X / TWITTER EDITION
          </div>
        </div>

        <h1 class="serif" style={{
          fontSize: 'clamp(2.8rem, 7vw, 4.8rem)',
          lineHeight: 0.95,
          margin: 0,
          color: '#e0a33a',
        }}>
          IAmNotYourFan
        </h1>

        <p style={{
          fontSize: '1.25rem',
          color: '#ada79d',
          margin: '1rem 0 2.5rem',
          maxWidth: '520px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          Find every account you follow that doesn’t follow you back.
        </p>

        <button
          onClick={onStartScan}
          class="btn btn-primary"
          style={{ fontSize: '1.1rem', padding: '1rem 3rem' }}
        >
          Start Shallow Scan
        </button>

        <div style={{ marginTop: '3rem', fontSize: '0.85rem', color: '#666' }}>
          Must be on <code style={{ background: '#222', padding: '1px 5px' }}>x.com/yourname/following</code><br />
          Scroll a little first for best results.
        </div>
      </div>
    </div>
  );
}
