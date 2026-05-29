<div align="center">

# IAmNotYourFan

### Find X/Twitter accounts you follow that do not follow you back, then review, export, or unfollow them from a local dashboard.

[![License: MIT](https://img.shields.io/badge/License-MIT-e0a33a.svg?style=flat-square)](#license)
[![Preact](https://img.shields.io/badge/Preact-10-673AB8?style=flat-square&logo=preact&logoColor=white)](https://preactjs.com/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Local first](https://img.shields.io/badge/Data-local%20first-62d6d0?style=flat-square)](#privacy-and-safety)
[![Latest release](https://img.shields.io/github/v/release/0xKoller/IAmNotYourFan?style=flat-square&color=e0a33a)](https://github.com/0xKoller/IAmNotYourFan/releases)

[Project Page](https://0xkoller.github.io/IAmNotYourFan/) · [Latest Release](https://github.com/0xKoller/IAmNotYourFan/releases/latest) · [Report an Issue](https://github.com/0xKoller/IAmNotYourFan/issues)

</div>

---

## What Is It?

`IAmNotYourFan` is a local, paste-in-console tool for X/Twitter following cleanup.

It scans your **Following** page, detects who follows you back, and opens a full-screen dashboard where you can search, filter, sort, check inactive accounts, and optionally unfollow accounts one by one or in slow randomized batches.

Useful for:

- Finding non-followers on X/Twitter.
- Cleaning up accounts you follow that do not follow back.
- Reviewing mutuals vs non-reciprocal follows.
- Auditing inactive accounts before deciding who to unfollow.
- Running everything locally without uploading your following list anywhere.

---

## Features

| Feature | What it does |
|---|---|
| You are a fan | Shows accounts you follow that do not follow you back. |
| Besties | Shows mutual follows. |
| Search, filter, sort | Narrow by username, display name, relationship, activity, or sort order. |
| Inactive scan | Checks recent visible activity using your current X browser session. |
| Single unfollow | Unfollow directly from a result card with a confirmation click. |
| Mass unfollow | Select accounts and unfollow them in randomized batches. |
| Safety controls | Pause, resume, stop, max-per-run cap, random per-user and per-batch delays. |
| Local persistence | Keeps scan/unfollow status locally for 24 hours to avoid accidental repeats. |
| Export | Export discovered non-followers as JSON or CSV. |
| Local first | No backend, no analytics, no account login, no uploaded following list. |

---

## Project Page

Open the public project page here:

https://0xkoller.github.io/IAmNotYourFan/

The page explains what the tool does and links back to this repository and releases.

---

## Quick Start

Build the pasteable console script locally:

```bash
pnpm install
pnpm build:console
pnpm make:console-bundle
```

Then run it on your real X account:

1. Open your X following page: `https://x.com/YOURUSERNAME/following`.
2. Open DevTools, then the Console tab.
3. Paste the full contents of `dist/iamnotyourfan-full-console.js`.
4. Wait while the script scrolls and collects your following list.
5. Review the dashboard.

Tested on real accounts with `950+` following.

---

## How Unfollow Works

Unfollow actions run from your browser using your current authenticated X session.

Single unfollow:

- Click `Unfollow` on a card.
- Click again to confirm.
- The card stays visible with an `Unfollowed` badge.

Mass unfollow:

- Click cards to select accounts.
- Start `Mass unfollow selected`.
- The run processes selected users in batches.
- Defaults are conservative-ish: `10` per batch, `2-10s` between users, `5-45s` between batches, `50` max per run.
- You can pause, resume, stop, or edit timing settings.

Important: randomized delays reduce burstiness, but they cannot guarantee that X will not throttle, restrict, or lock your account. Use unfollow actions at your own risk.

---

## Privacy And Safety

Everything runs locally in your browser.

- No server.
- No analytics.
- No external account login.
- No uploaded following list.
- X session cookies and headers stay in your browser.

Because this relies on X/Twitter web internals, the app can break when X changes its DOM, API routes, operation IDs, rate limits, or account safety systems.

---

## Development

```bash
pnpm dev           # dashboard in local preview mode with fake data
pnpm dev:landing   # landing page in dev mode
pnpm build         # production web build
pnpm build:console # console-mode build
pnpm make:console-bundle
```

Main files:

- `src/components/Scanning.tsx` - dashboard UI.
- `src/utils/x-selectors.ts` - X DOM collection selectors.
- `src/utils/x-api.ts` - local X API helpers.
- `src/utils/unfollow.ts` - single and batch unfollow controller.
- `src/utils/activity-scan.ts` - inactive account scanning.

---

## Tech Stack

- Preact
- Vite
- TypeScript
- Sass

---

## Keywords

X unfollow tool, Twitter unfollow tool, X non followers, Twitter non followers, find who does not follow back, unfollow non followers, mass unfollow X, mass unfollow Twitter, following cleanup, local browser tool.

---

## Contributing

Issues and PRs are welcome. X changes often, so fixes for selectors, API discovery, throttling behavior, and UI regressions are especially useful.

---

## Credits

Inspired by [InstagramUnfollowers](https://github.com/davidarroyo1234/InstagramUnfollowers) by David Arroyo.

## License

[MIT](LICENSE) © [0xKoller](https://x.com/0xKoller)
