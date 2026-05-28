# Testing Iamnotyourfan on your real profile (right now)

Because we don't have the final single-file console bundle yet, here is the easiest way to test the **real scanning** on your actual X account today.

## Quick Test Method (Recommended)

1. Go to your real profile:  
   `https://x.com/YOURUSERNAME/following`

2. Scroll down manually a bit first (or let the script do it).

3. Open DevTools → Console tab (`F12` or `Cmd+Option+J`).

4. Paste this entire block and press Enter:

```js
(async () => {
  console.log('%c[Iamnotyourfan] Starting real scan test on your profile...', 'color:#e0a33a');

  const { autoScrollFollowingList, collectVisibleUsers } = (window as any).Iamnotyourfan || {};

  if (!autoScrollFollowingList || !collectVisibleUsers) {
    console.error('Iamnotyourfan helpers not found. Make sure you are testing in an environment where the code was loaded.');
    return;
  }

  console.log('Auto-scrolling to load more profiles... (this can take 30-90 seconds)');

  await autoScrollFollowingList((p) => {
    console.log(`Scrolled... users found so far: ${p.usersFound}`);
  }, { maxScrolls: 60, waitBetweenScrolls: 550 });

  const users = collectVisibleUsers();
  const nonReciprocal = users.filter(u => !u.isMutual);

  console.log('%c=== SCAN COMPLETE ===', 'color:#62d6d0; font-weight:bold');
  console.log(`Total profiles collected: ${users.length}`);
  console.log(`Do NOT follow you back: ${nonReciprocal.length}`);

  // Show first 10 non-reciprocal as example
  console.table(
    nonReciprocal.slice(0, 10).map(u => ({
      '@username': u.username,
      name: u.displayName,
      follows_you: u.isMutual ? 'yes' : 'NO'
    }))
  );

  console.log('%cYou can access full results with: window.Iamnotyourfan.lastResults', 'color:#666');
  (window as any).Iamnotyourfan.lastResults = { all: users, nonReciprocal };
})();
```

5. Wait for it to finish (it will auto-scroll and collect).

6. Look at the console output. You should see real data from **your** following list.

---

## What this tests right now

- Real DOM selectors on your actual page
- Auto-scroll engine
- Mutual detection ("follows you" logic)
- How many profiles it can collect

This is the core data layer that powers the beautiful UI.

---

## Limitations of this quick test

- No beautiful UI yet (just console logs)
- No ignore list / exports in this test snippet
- The full experience (hero screen + rich cards + settings + takeover) will come when we build the single console bundle.

Would you like me to also create a version that tries to render the full UI on your real page right now (more experimental)?

Or are you happy testing the data collection first with the snippet above?

Just run the snippet on your real following page and tell me what you see (how many it found, any errors, etc.).
