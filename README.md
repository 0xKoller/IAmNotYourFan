# IAmNotYourFan

Find accounts you follow on X that don't follow you back — with a beautiful full UI experience.

## Quick Start (Real Profile)

This is currently the easiest and most reliable way to use it on your actual X account:

1. Clone or download this repo.

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build the console script:
   ```bash
   pnpm build:console && pnpm make:console-bundle
   ```

4. Go to your real following page:
   ```
   https://x.com/YOURUSERNAME/following
   ```

5. Open DevTools → Console and paste the entire contents of:
   ```
   dist/iamnotyourfan-full-console.js
   ```

### What happens

- A clean loader appears with a live counter.
- The script scrolls your **original** X following page in the background (this allows it to collect hundreds of users reliably).
- When it reaches the end (or you click Stop), it does a full clean takeover and opens the beautiful IAmNotYourFan interface with all your real data.

You can then use filters, ignore list, exports, etc. in the polished UI.

## Development

```bash
pnpm dev
```

Open http://localhost:5173 to see the full UI in preview mode (with fake data).

## Building

- `pnpm build` — normal production build
- `pnpm build:console` — builds the IIFE for console use
- `pnpm make:console-bundle` — combines JS + CSS into a single easy-to-paste file (`dist/iamnotyourfan-full-console.js`)

## Current Status

This version works very well for real profiles with large following lists (tested with 950+).

The full "copy-paste one script and get the complete experience" flow is now functional.

## Credits / Inspiration

Heavily inspired by the excellent [InstagramUnfollowers](https://github.com/davidarroyo1234/InstagramUnfollowers) tool by David Arroyo.

## License

MIT
