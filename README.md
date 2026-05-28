<div align="center">

# 🖤 IAmNotYourFan

### Find the accounts you follow on X that don't follow you back — in a beautiful, full-screen UI.

[![License: MIT](https://img.shields.io/badge/License-MIT-e0a33a.svg?style=flat-square)](#-license)
[![Preact](https://img.shields.io/badge/Preact-10-673AB8?style=flat-square&logo=preact&logoColor=white)](https://preactjs.com/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![No tracking](https://img.shields.io/badge/Data-100%25%20local-62d6d0?style=flat-square)](#-privacy)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-8ccf7e?style=flat-square)](#-contributing)

<sub>Paste one script into your browser console — get a polished dashboard of who's <strong>not</strong> a bestie.</sub>

</div>

---

## ✨ What it does

`IAmNotYourFan` scrolls through your X **Following** list, figures out who follows you back, and drops you into a clean, glassy dashboard.

| | |
|---|---|
| 🪞 **You are a fan** | Accounts you follow that *don't* follow you back |
| 💞 **Besties** | Mutuals — you follow each other |
| 📊 **Live stats** | Following total, fans, and besties at a glance |
| 🔎 **Search & filter** | Instantly narrow by handle/name, toggle All / You are a fan / Besties |
| 🖱️ **Clickable cards** | Jump straight to any profile in a new tab |
| 🔒 **Local only** | Runs entirely in your browser — nothing is uploaded |

---

## 🚀 Quick Start (your real profile)

The most reliable way to run it on your actual X account:

```bash
# 1. Install
pnpm install

# 2. Build the single pasteable console script
pnpm build:console && pnpm make:console-bundle
```

3. Open your following page:
   ```
   https://x.com/YOURUSERNAME/following
   ```
4. Open **DevTools → Console**, then paste the entire contents of:
   ```
   dist/iamnotyourfan-full-console.js
   ```

### What happens next

1. 🌀 A loader appears with a **live counter**.
2. 📜 The script scrolls your original Following page in the background to reliably collect *hundreds* of accounts.
3. 🎬 When it finishes, it does a clean full-page takeover and opens the **IAmNotYourFan** dashboard with all your real data.

> ✅ Tested on real accounts with **950+** following.

---

## 🛠️ Development

```bash
pnpm dev          # full UI in preview mode (fake data) → http://localhost:5173
pnpm dev:landing  # landing page in dev mode
```

## 📦 Build scripts

| Command | What it does |
|---|---|
| `pnpm build` | Standard production build |
| `pnpm build:console` | Builds the IIFE bundle for console use |
| `pnpm make:console-bundle` | Combines JS + CSS into one pasteable file → `dist/iamnotyourfan-full-console.js` |
| `pnpm preview` | Preview the production build |

---

## 🧱 Tech stack

- ⚛️ **Preact** — tiny, fast React-compatible UI
- ⚡ **Vite** — dev server & build tooling
- 🟦 **TypeScript** — typed end to end
- 🎨 **Sass** — styling

---

## 🔐 Privacy

Everything runs locally in your browser. No servers, no accounts, no analytics — your following list never leaves your machine.

---

## 🤝 Contributing

Issues and PRs are welcome. X changes its DOM often, so selector fixes in `src/utils/x-selectors.ts` are especially appreciated.

---

## 🙏 Credits

Heavily inspired by the excellent [InstagramUnfollowers](https://github.com/davidarroyo1234/InstagramUnfollowers) by David Arroyo.

## 📄 License

[MIT](LICENSE) © [0xKoller](https://x.com/0xKoller)
