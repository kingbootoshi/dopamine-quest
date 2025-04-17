# QuestXP – Architecture

```
src/
├── core/              # Foundational services (main process)
│   ├── ipc/           # IPC setup and channel registration
│   │   └── index.ts   # Central hub for IPC communication
│   ├── logger/        # Logging service configuration
│   │   └── index.ts   # Winston logger setup
│   └── windows/       # BrowserWindow creation/management
│       └── index.ts   # Window creation and lifecycle
├── features/          # Business logic modules (main process)
│   ├── ai/            # AI-related logic (XP calculation)
│   │   ├── chooseXp.ts # Core XP choosing logic
│   │   └── index.ts   # Public API for the AI feature
│   └── persistence/   # Data storage layer
│       ├── profileStore.ts # Profile specific storage
│       ├── taskStore.ts   # Task specific storage
│       └── index.ts   # Public API for persistence
├── main/              # Main process entry point & app lifecycle
│   └── main.ts        # App initialization and orchestration
├── preload.ts         # Secure bridge between main and renderer
├── renderer/          # Front-end (DOM context)
│   ├── utils/         # Pure functions (XP, streak calculators)
│   ├── components/    # Tiny render helpers returning HTML
│   ├── assets/        # Static files (sfx, images)
│   └── ...            # index.css, etc.
├── shared/            # Code/types shared between main & renderer
│   └── types/         # Shared type definitions
│       └── domain.ts  # Shared domain interfaces (Task, Profile)
└── types/             # Global/process-specific TS declarations
```

The **main** process is organized into logical layers:
1. **core**: Essential infrastructure services (ipc, logging, window management)
2. **features**: Business logic modules separated by domain (ai, persistence)
3. **shared**: Types and utilities used by both main and renderer processes

Renderer only talks to main via **typed IPC** exposed in `preload.ts`.

### Key Principles

| Principle | Implementation |
|-----------|----------------|
| *Modularity* | Code is organized by domain and responsibility. |
| *Separation of Concerns* | Core services, business logic, and UI are clearly separated. |
| *Typed boundaries* | Domain types (`Task`, `Profile`) shared between layers. |
| *Scalable-by-folder* | New features are added as modules in the appropriate directory structure. |
| *Observability* | Winston logs in `$userData/logs`, verbose console in dev. |

### Communication Flow

1. Renderer uses `window.api` (exposed in preload) to make IPC calls
2. Core IPC layer routes requests to appropriate feature modules
3. Feature modules process requests and may interact with other features
4. Results flow back through IPC to the renderer

This architecture provides a clear organization that scales well as the application grows. New features can be added as modules in the appropriate directory without disrupting existing functionality.

This doc is designed for humans **and** LLM agents: folder names and module boundaries are explicit and stable.