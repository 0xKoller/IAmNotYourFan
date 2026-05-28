import { render } from 'preact'
import './styles/index.scss'
import { App } from './app.tsx'

// For now we render normally during development.
// In console mode we will do full body takeover (see Phase 1).
render(<App />, document.getElementById('app')!)
