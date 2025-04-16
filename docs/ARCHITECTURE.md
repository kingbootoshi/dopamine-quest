# QuestXP – Architecture

`src/
├─ main/           # Main‑process code (Node context)
│  ├─ main.ts      # Bootstraps app, shortcuts, logging
│  ├─ windows.ts   # All BrowserWindow creation
│  ├─ ipc.ts       # IPC channels
│  ├─ store.ts     # Persistence layer (JSON today, DB tomorrow)
│  └─ logger.ts    # Winston instance, shared in main/
├─ preload.ts      # Secure bridge → exposes `window.api`
├─ renderer/       # Front‑end (DOM context)
│  ├─ utils/       # Pure functions (XP, streak calculators)
│  ├─ components/  # Tiny render helpers returning HTML
│  ├─ assets/      # Static files (sfx, images)
│  └─ …            # index.css, etc.
└─ types/          # Custom TS declarations

The **main** layer never touches front‑end modules.  
Renderer only talks to main via **typed IPC** exposed in `preload.ts`.

### Key Principles
| Principle | Implementation |
|-----------|----------------|
| *Minimal, single‑purpose* | Only one feature: log tasks & reward XP. No creeping scope. |
| *Scalable‑by‑folder* | When we add DB or cloud sync, create a new file (e.g., `src/main/db.ts`) not spaghetti changes. |
| *Typed boundaries* | Store contracts (`interface Task`) shared between layers. |
| *Observability* | Winston logs in `$userData/logs`, verbose console in dev. |

This doc is designed for humans **and** LLM agents: folder names and module boundaries are explicit and stable.