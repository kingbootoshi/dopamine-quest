# Logging Guide

We use [**Winston**](https://github.com/winstonjs/winston).

## Levels

| Level | When |
|-------|------|
| `error` | Something crashed or failed. |
| `warn`  | Suspicious but recovered. |
| `info`  | High‑level lifecycle (app ready, task saved). |
| `debug` | Verbose internal details (window events, IPC). |

### Change Level

`LOG_LEVEL=debug pnpm start`

### Files

Logs live in **`$userData/logs/`**:

* `combined.log` – everything ≥ current level  
* `error.log` – errors only  

Console always prints, colorized, while developing.