import { render } from 'preact'
import './styles/index.scss'
import { App } from './app.tsx'

// Detect if we're running as a pasted console script on X (full takeover mode)
const isConsoleMode = 
  typeof window !== 'undefined' && 
  (window.location.hostname.includes('x.com') || window.location.hostname.includes('twitter.com'));

if (isConsoleMode) {
  // Full body takeover - exactly like InstagramUnfollowers experience
  document.documentElement.style.background = '#111';
  document.body.innerHTML = '<div id="iamnotyourfan-root"></div>';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  
  const root = document.getElementById('iamnotyourfan-root')!;
  render(<App />, root);
  
  // Optional: set a nice title
  document.title = 'Iamnotyourfan • X Non-Followers';
} else {
  // Normal Vite dev / preview mode
  render(<App />, document.getElementById('app')!);
}
