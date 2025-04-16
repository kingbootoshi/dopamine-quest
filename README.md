# QuestXP 🧠⚡️

Minimalist productivity tracker that gamifies every task — **built for the dopamine‑hungry, ADHD brain.**

- **Zero friction:** press <kbd>⌥⌘K</kbd> anywhere → type task → hit ⏎.  
- **Instant reward:** confetti, sound & XP popup the moment you save.  
- **Visible progress:** level ring fills; level‑ups unlock new themes & loot.  
- **Review at a glance:** open the desktop app to see today’s “Quest Log”.  

---

## Why it works

| Step | What happens | Why it works for ADHD |
|------|--------------|-----------------------|
| **Capture** | Hit ⌥⌘K (or tap “+”) → Quick‑add dialog:<br>• Task title<br>• Impact slider (❶ trivial → ❺ game‑changer)<br>• Complexity slider (❶ easy → ❺ brutal) | Friction‑free, no project setup. Sliders make “how big?” a 1‑second decision. |
| **Reward** | On Save → 🎉 Confetti burst, sound, and XP popup (“+85 XP – Great impact!”) | Instant feedback = dopamine. |
| **Progress** | XP fills a **Level ring**; when full → level‑up animation, unlock **loot** (emojis, themes, avatar gear). | Visible progress & variable rewards keep interest. |
| **Review** | Daily “Quest Log” timeline + weekly **Boss Fight** (auto‑bundles biggest task). Beating the boss drops a **random reward chest**. | Regular novelty + bigger streak payout. |

---

## Feature highlights
* **Global hotkey** — works even when the main window is closed.  
* **Offline‑first JSON storage** — tasks live locally; swap to SQLite/cloud later.  
* **Typed IPC** — secure bridge between Renderer & Main.  
* **Winston logging** — multi‑level logs in `~/Library/Application Support/QuestXP/logs`.  
* **Modular codebase** — clean `src/main` vs `src/renderer` separation.

---

## Tech stack

| Layer | Tech |
|-------|------|
| Front‑end | Vite + TypeScript, vanilla DOM, Tailwind‑lite CSS |
| Desktop shell | Electron Forge 7 |
| State / Persistence | Local JSON (upgrade path → SQLite) |
| Logging | Winston (`combined.log`, `error.log`) |

---

## Getting started

```bash
pnpm install              # or npm / yarn
pnpm start                # hot‑reload dev build
LOG_LEVEL=debug pnpm start  # verbose logs
pnpm make                 # create signed .dmg / .exe
```

---

## Roadmap

- iCloud / Dropbox sync  
- Cosmetic gear shop (spend XP)  
- Menubar‑only mode  
- Mobile companion (React Native + SQLite sync)

---

Made with ❤️, adderall, and a need for **instant gratification**.  

PRs welcome!