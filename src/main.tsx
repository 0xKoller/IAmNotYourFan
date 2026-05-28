import { render } from 'preact'
import './styles/index.scss'
import { App } from './app.tsx'
import { collectVisibleUsers, isOnFollowingPage } from './utils/x-selectors'
import { autoScrollFollowingList } from './utils/auto-scroll'

// Detect console / production paste mode (either on real X or built with --mode console)
const isConsoleMode = 
  (typeof import.meta.env.CONSOLE_MODE !== 'undefined' && import.meta.env.CONSOLE_MODE === 'true') ||
  (typeof window !== 'undefined' && 
   (window.location.hostname.includes('x.com') || window.location.hostname.includes('twitter.com')));

if (isConsoleMode) {
  const onRealX = (window.location.hostname.includes('x.com') || window.location.hostname.includes('twitter.com'));
  const onFollowing = isOnFollowingPage();

  if (onRealX && onFollowing) {
    // === NEW SIMPLIFIED FLOW FOR REAL X ===
    // 1. Keep original X page visible
    // 2. Show a minimal centered loader with live counter
    // 3. Scroll the original X page aggressively in the background
    // 4. When done (or user stops), do full clean takeover with all data

    console.log('%c[Iamnotyourfan] Real X + Following page detected — using loader + background collection mode', 'color:#e0a33a');

    // Create simple full-screen loader
    const loader = document.createElement('div');
    loader.id = 'iamnotyourfan-loader';
    loader.style.cssText = `
      position: fixed; inset: 0; z-index: 999999;
      background: rgba(17,17,17,0.96); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      color: #f7f1e8; font-family: system-ui, -apple-system, sans-serif;
    `;
    loader.innerHTML = `
      <div style="text-align: center; max-width: 420px; padding: 2rem;">
        <div style="font-family: Georgia, serif; font-size: 2.8rem; color: #e0a33a; margin-bottom: 0.5rem;">
          Iamnotyourfan
        </div>
        <div style="font-size: 1.1rem; margin-bottom: 1.5rem; opacity: 0.85;">
          Scanning your following list...
        </div>
        
        <div id="iamnotyourfan-count" style="
          font-size: 3.2rem; font-weight: 700; color: #e0a33a; margin-bottom: 0.25rem;
        ">0</div>
        <div style="font-size: 0.95rem; opacity: 0.7; margin-bottom: 2rem;">profiles collected</div>

        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="iamnotyourfan-pause" style="
            background: #f7931a; color: white; border: none; padding: 10px 20px;
            border-radius: 8px; font-size: 0.95rem; cursor: pointer;
          ">Pause</button>
          
          <button id="iamnotyourfan-stop" style="
            background: #e0245e; color: white; border: none; padding: 10px 20px;
            border-radius: 8px; font-size: 0.95rem; cursor: pointer; font-weight: 600;
          ">Stop & View Results</button>
        </div>
        
        <div style="margin-top: 1.5rem; font-size: 0.8rem; opacity: 0.6;">
          We are scrolling your original following page in the background.
        </div>
      </div>
    `;
    document.body.appendChild(loader);

    const countEl = loader.querySelector('#iamnotyourfan-count') as HTMLElement;
    const pauseBtn = loader.querySelector('#iamnotyourfan-pause') as HTMLButtonElement;
    const stopBtn = loader.querySelector('#iamnotyourfan-stop') as HTMLButtonElement;

    let collected = new Map<string, any>();
    let isPaused = false;
    let isDone = false;

    const updateCounter = () => {
      if (countEl) countEl.textContent = collected.size.toString();
    };

    // Start aggressive collection on the real X page
    const startCollection = async () => {
      try {
        await autoScrollFollowingList(() => {
          if (isDone || isPaused) return;

          const current = collectVisibleUsers();
          let added = 0;
          current.forEach(u => {
            if (!collected.has(u.username)) {
              collected.set(u.username, u);
              added++;
            }
          });

          if (added > 0) {
            updateCounter();
            (window as any).__IAMNOTYOURFAN_COLLECTED_USERS = Array.from(collected.values());
          }
        }, {
          maxScrolls: 200,
          waitBetweenScrolls: 480,
        });

        if (!isDone) {
          finishAndTakeover();
        }
      } catch (err) {
        console.error('[Iamnotyourfan] Collection error', err);
        if (!isDone) finishAndTakeover();
      }
    };

    const finishAndTakeover = () => {
      if (isDone) return;
      isDone = true;

      const finalUsers = Array.from(collected.values());
      console.log(`[Iamnotyourfan] Collection finished. Total users: ${finalUsers.length}`);

      // Remove loader
      loader.remove();

      // Full clean takeover
      document.body.innerHTML = '<div id="iamnotyourfan-root"></div>';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      document.documentElement.style.background = '#111';

      const root = document.getElementById('iamnotyourfan-root')!;
      (window as any).__IAMNOTYOURFAN_INITIAL_USERS = finalUsers;

      render(<App />, root);
      document.title = 'Iamnotyourfan • X Non-Followers';
    };

    pauseBtn.onclick = () => {
      isPaused = !isPaused;
      pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
    };

    stopBtn.onclick = () => {
      isDone = true;
      finishAndTakeover();
    };

    // Start collection
    console.log('[Iamnotyourfan] Starting background collection on original X page...');
    startCollection();

  } else {
    // Normal full takeover (not on following or not real X)
    document.documentElement.style.background = '#111';
    document.body.innerHTML = '<div id="iamnotyourfan-root"></div>';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.fontFamily = 'system-ui, -apple-system, sans-serif';

    const root = document.getElementById('iamnotyourfan-root')!;
    render(<App />, root);
    document.title = 'Iamnotyourfan • X Non-Followers';
  }

} else {
  // Normal Vite dev / preview mode
  render(<App />, document.getElementById('app')!);
}
