import { useState } from 'preact/hooks'
import './styles/index.scss'

export function App() {
  const [count, setCount] = useState(0)

  return (
    <div class="iamnotyourfan" style={{ padding: '2rem', fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h1 class="serif" style={{ fontSize: '3rem', color: 'var(--amber)', marginBottom: '0.5rem' }}>
          Iamnotyourfan
        </h1>
        <p class="text-muted" style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
          Find the accounts you follow that don’t follow you back on X.
        </p>

        <div class="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
          <p style={{ marginBottom: '1rem' }}>
            Design system loaded successfully.<br />
            Amber, Cyan, Rose accents + glassmorphism are active.
          </p>

          <button
            class="btn btn-primary"
            onClick={() => setCount((c) => c + 1)}
          >
            Test interaction — clicked {count} times
          </button>
        </div>

        <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
          Phase 0 complete. Next: full hero screen + body takeover logic.
        </div>
      </div>
    </div>
  )
}
