import { render } from 'preact'
import './styles/index.scss'
import { App } from './app.tsx'
import { collectVisibleUsers, getCurrentAccount, isOnFollowingPage } from './utils/x-selectors'
import { autoScrollFollowingList } from './utils/auto-scroll'
import { installXApiRequestRecorder, snapshotXScriptUrls } from './utils/x-api'

// Detect console / production paste mode (either on real X or built with --mode console)
const isConsoleMode = 
  (typeof import.meta.env.CONSOLE_MODE !== 'undefined' && import.meta.env.CONSOLE_MODE === 'true') ||
  (typeof window !== 'undefined' && 
   (window.location.hostname.includes('x.com') || window.location.hostname.includes('twitter.com')));

if (isConsoleMode) {
  installXApiRequestRecorder();
  snapshotXScriptUrls();

  const onRealX = (window.location.hostname.includes('x.com') || window.location.hostname.includes('twitter.com'));
  const onFollowing = isOnFollowingPage();

  if (onRealX && onFollowing) {
    // === NEW SIMPLIFIED FLOW FOR REAL X ===
    // 1. Keep original X page visible
    // 2. Show a minimal centered loader with live counter
    // 3. Scroll the original X page aggressively in the background
    // 4. When done (or user stops), do full clean takeover with all data

    console.log('%c[IAmNotYourFan] Real X + Following page detected — using loader + background collection mode', 'color:#e0a33a');
    (window as any).__IAMNOTYOURFAN_CURRENT_ACCOUNT = getCurrentAccount();

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
      <div style="text-align: center; max-width: 460px; padding: 2.5rem 2rem; background: rgba(30,29,26,0.95); border-radius: 16px; border: 1px solid rgba(247,241,232,0.1);">
        <div style="font-family: Georgia, serif; font-size: 2.6rem; color: #e0a33a; margin-bottom: 0.25rem;">
          IAmNotYourFan
        </div>
        <div style="font-size: 1rem; margin-bottom: 1.25rem; opacity: 0.75;">
          Collecting your real following list
        </div>
        
        <div id="iamnotyourfan-count" style="
          font-size: 3.8rem; font-weight: 700; color: #e0a33a; line-height: 1; margin-bottom: 0.1rem;
        ">0</div>
        <div style="font-size: 0.9rem; opacity: 0.65; margin-bottom: 1.25rem;">profiles collected</div>

        <!-- Progress Bar -->
        <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 999px; margin-bottom: 1.5rem; overflow: hidden;">
          <div id="iamnotyourfan-progress" style="
            width: 0%; height: 100%; 
            background: linear-gradient(to right, #e0a33a, #62d6d0);
            transition: width 0.3s ease;
            border-radius: 999px;
          "></div>
        </div>

        <div style="display: flex; gap: 10px; justify-content: center;">
          <button id="iamnotyourfan-pause" style="
            background: #f7931a; color: white; border: none; padding: 9px 18px;
            border-radius: 8px; font-size: 0.9rem; cursor: pointer; font-weight: 500;
          ">Pause</button>
          
          <button id="iamnotyourfan-stop" style="
            background: #e0245e; color: white; border: none; padding: 9px 18px;
            border-radius: 8px; font-size: 0.9rem; cursor: pointer; font-weight: 600;
          ">Stop & View Results</button>
        </div>
        
        <div style="margin-top: 1.25rem; font-size: 0.75rem; opacity: 0.55;">
          Stay on this window until collection completes. We’re scrolling your original following page in the background.
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

      // Visual progress bar (fills gradually as we collect more)
      const progressBar = loader.querySelector('#iamnotyourfan-progress') as HTMLElement;
      if (progressBar) {
        const pct = Math.min(100, Math.floor((collected.size / 800) * 100));
        progressBar.style.width = `${pct}%`;
      }
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
        console.error('[IAmNotYourFan] Collection error', err);
        if (!isDone) finishAndTakeover();
      }
    };

    const finishAndTakeover = () => {
      if (isDone) return;
      isDone = true;

      const finalUsers = Array.from(collected.values());
      const currentAccount = (window as any).__IAMNOTYOURFAN_CURRENT_ACCOUNT || getCurrentAccount();
      console.log(`[IAmNotYourFan] Collection finished. Total users: ${finalUsers.length}`);

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
      (window as any).__IAMNOTYOURFAN_CURRENT_ACCOUNT = currentAccount;

      render(<App />, root);
      document.title = 'IAmNotYourFan • X Non-Followers';
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
    console.log('[IAmNotYourFan] Starting background collection on original X page...');
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
    document.title = 'IAmNotYourFan • X Non-Followers';
  }

} else {
  // Normal Vite dev / preview mode
  render(<App />, document.getElementById('app')!);
}
