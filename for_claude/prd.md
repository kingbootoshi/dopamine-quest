## PRD: QuestXP Codebase Architecture Enhancement

**Version:** 1.0
**Status:** Proposed
**Date:** 2024-10-27
**Author:** AI Assistant (based on user request)

**1. Background**

The QuestXP application is growing, and its current structure, while functional, concentrates various main-process responsibilities directly within the `src/main` directory (`ai.ts`, `logger.ts`, `store.ts`, `profile.ts`, `ipc.ts`, `windows.ts`). As new features (like cloud sync, advanced AI interactions, database persistence) are added, this flat structure risks becoming difficult to navigate, maintain, and scale. Code related to distinct concerns (e.g., logging, AI, data persistence, core Electron services) should be more clearly delineated.

This refactoring aims to proactively organize the codebase into logical modules/layers, improving clarity, separation of concerns, and ease of future development for both human developers and AI agents interacting with the code.

**2. Goals**

*   **Improve Modularity:** Separate distinct application concerns (logging, AI, persistence, core services, features) into dedicated directories/modules.
*   **Enhance Scalability:** Create a structure that easily accommodates new features and services without cluttering existing modules.
*   **Increase Clarity:** Make the codebase easier to understand by organizing files based on their function and relationship.
*   **Simplify Maintenance:** Reduce cognitive load when modifying specific parts of the application by isolating concerns.
*   **Facilitate Contribution:** Make it easier for new developers (or AI) to locate relevant code and contribute effectively.

**3. Proposed Changes: New Directory Structure**

We will restructure the `src` directory as follows:

```
src/
├── core/              # Foundational services (main process)
│   ├── ipc/           # IPC setup and channel registration
│   │   └── index.ts   # (Content of current ipc.ts, possibly split later)
│   ├── logger/        # Logging service configuration
│   │   └── index.ts   # (Content of current logger.ts)
│   └── windows/       # BrowserWindow creation/management
│       └── index.ts   # (Content of current windows.ts)
├── features/          # Business logic modules (main process)
│   ├── ai/            # AI-related logic (XP calculation)
│   │   ├── chooseXp.ts # Core XP choosing logic (from ai.ts)
│   │   └── utils.ts   # (Optional: If helper functions emerge within AI)
│   │   └── index.ts   # Public API for the AI feature (exports chooseXp)
│   ├── persistence/   # Data storage layer
│   │   ├── profileStore.ts # Profile specific storage logic (from profile.ts)
│   │   ├── taskStore.ts   # Task specific storage logic (renamed from store.ts)
│   │   └── index.ts   # Public API for persistence (exports load/save functions)
│   └── ...            # Placeholder for future features (e.g., sync, notifications)
├── main/              # Main process entry point & app lifecycle ONLY
│   └── main.ts        # (Slimmed down: imports initializers from core/features)
├── renderer/          # Frontend code (remains largely the same for now)
│   ├── assets/
│   ├── components/
│   ├── utils/
│   └── index.css
│   └── renderer.ts
├── preload.ts         # Secure bridge between main and renderer
├── shared/            # Code/types shared between main & renderer
│   └── types/
│       └── domain.ts  # Shared interfaces (Task, Profile defined here)
└── types/             # Global/process-specific TS declarations
    ├── media.d.ts
    └── vite-env.d.ts
    └── forge.env.d.ts # (Assuming this belongs here, verify placement)

```

**Explanation of Changes:**

1.  **`src/core/` Directory:**
    *   Houses essential, cross-cutting services required for the application's operation but not tied to specific business features.
    *   `core/logger/index.ts`: Moves the Winston logger setup here.
    *   `core/windows/index.ts`: Moves `BrowserWindow` creation and management logic here.
    *   `core/ipc/index.ts`: Moves the IPC channel registration logic here. It acts as the central hub for defining how main and renderer communicate, orchestrating calls *into* the `features`.

2.  **`src/features/` Directory:**
    *   Contains modules dedicated to specific application features or domains. Each sub-directory represents a distinct feature.
    *   `features/ai/`: Isolates all AI-related functionality.
        *   `chooseXp.ts`: Contains the primary logic for interacting with the AI service to determine XP.
        *   `index.ts`: Exports the public functions of the AI module (e.g., `chooseXp`).
    *   `features/persistence/`: Consolidates data storage concerns.
        *   `taskStore.ts`: Renamed from `store.ts`, focuses *only* on task persistence.
        *   `profileStore.ts`: Renamed from `profile.ts`, focuses *only* on profile persistence.
        *   `index.ts`: Exports the public functions for loading/saving data (e.g., `loadTasks`, `saveTask`, `loadProfile`, `saveProfile`).

3.  **`src/main/main.ts` (Slimmed Down):**
    *   Remains the primary Electron entry point.
    *   Its main responsibility will be to initialize the app, import and call setup functions from `core` modules (like `registerIpc` from `core/ipc`, `createMainWindow` from `core/windows`), and handle top-level app lifecycle events (`app.on(...)`). It should contain minimal application logic itself.

4.  **`src/shared/` Directory:**
    *   Introduced for code or types intended to be used by *both* the main process and the renderer process *without* going through IPC/preload (or defining types that are passed via IPC).
    *   `shared/types/domain.ts`: This is the new home for shared data structures like the `Task` and `Profile` interfaces, ensuring a single source of truth. Files in `features/persistence` and potentially `features/ai` will import these types. `preload.ts` will also use these types for defining the exposed API.

5.  **File Renames:**
    *   `src/main/store.ts` -> `src/features/persistence/taskStore.ts`
    *   `src/main/profile.ts` -> `src/features/persistence/profileStore.ts`

6.  **Imports:** All `import` statements across the codebase must be updated to reflect the new file locations.

**4. Implementation Plan**

1.  **Create New Directories:** Create the `src/core`, `src/features`, `src/shared`, and their respective subdirectories (`logger`, `windows`, `ipc`, `ai`, `persistence`, `types`).
2.  **Move Files:** Move the content of existing files (`logger.ts`, `windows.ts`, `ipc.ts`, `ai.ts`, `store.ts`, `profile.ts`) into their new locations and rename where specified (`taskStore.ts`, `profileStore.ts`). Create `index.ts` files within feature/core modules to act as entry points/exporters.
3.  **Relocate Shared Types:** Define the `Task` and `Profile` interfaces in `src/shared/types/domain.ts`. Remove their definitions from their original locations (`store.ts`, `profile.ts`).
4.  **Update Imports:** Systematically go through all files (`.ts`) and update `import` paths to point to the new locations. Pay close attention to imports in `main.ts`, `preload.ts`, and within the newly created modules. Ensure types are imported from `shared/types/domain.ts` where appropriate.
5.  **Refactor `main.ts`:** Ensure `main.ts` primarily orchestrates initialization by calling functions imported from the `core` and potentially `features` modules.
6.  **Refactor Feature/Core `index.ts`:** Ensure these files correctly export the necessary functions/constants from their respective modules.
7.  **Update Configuration (If Necessary):** Double-check build configurations (`forge.config.ts`, `vite.*.config.ts`, `tsconfig.json`) to ensure entry points and paths are still correctly configured, especially regarding `main.ts` and `preload.ts`. (This structure likely *won't* require config changes as the main entry points remain, but verification is good).
8.  **Testing:** Perform thorough testing:
    *   Run `pnpm lint` to catch any syntax/import errors.
    *   Run `pnpm start` and verify application startup.
    *   Test core functionalities: adding tasks (quick add + main window), profile saving/loading, level calculation, streak calculation, IPC communication, logging output.
    *   Check log file creation in the correct directory (`userData/logs`).
    *   Verify AI calls are still working.

**5. Impact**

*   **Code Changes:** Significant movement of files and updates to import statements across the `src` directory.
*   **Merge Conflicts:** High potential for merge conflicts if other feature development is happening concurrently. It's recommended to pause other major feature work during this refactoring or coordinate carefully.
*   **Testing:** Requires comprehensive testing to ensure no regressions were introduced.

**6. Open Questions / Future Considerations**

*   **Renderer Structure:** This PRD focuses on the `main` process. Should the `renderer` directory also be structured by feature once it grows? (Defer for now).
*   **IPC Granularity:** Should `core/ipc/index.ts` be split further by feature (e.g., `core/ipc/tasks.ts`, `core/ipc/profile.ts`) if the number of channels grows significantly? (Defer for now).
*   **AI Feature Granularity:** As AI features expand (e.g., task categorization, summary generation), should `features/ai/` be further subdivided? (Yes, this structure supports that).
*   **Error Handling:** Standardize error handling patterns across features. (Future enhancement).
*   **Dependency Injection:** Consider introducing dependency injection for services later if complexity increases significantly. (Future enhancement).

**7. Success Metrics**

*   The codebase structure matches the proposed layout.
*   All existing functionality works correctly after the refactoring.
*   Code reviews for new features become easier due to clearer separation of concerns.
*   Onboarding new contributors (human or AI) is faster as code location is more predictable.
*   Reduced instances of unrelated code needing changes when modifying a specific feature.

---