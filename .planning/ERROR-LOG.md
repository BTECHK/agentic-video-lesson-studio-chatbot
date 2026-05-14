# Error & Issue Log

Local record of bugs, fixes, and corrections across the project. Purpose: avoid repeating mistakes and track patterns.

## Format

| # | Date | Phase | Category | Issue | Root Cause | Fix | Lesson |
|---|------|-------|----------|-------|------------|-----|--------|
| 1 | 2026-05-14 | 5 | Config | Dev server refused connection — `.env` file missing | `.env.example` exists but user must manually copy to `.env`; no setup script | Copied `.env.example` to `.env` | Add `npm run setup` or `postinstall` script that creates `.env` from `.env.example` if missing |
| 2 | 2026-05-14 | 5 | UI | Chat window has no visible separation from page background | Border color `rgba(28,28,28,0.08)` too subtle; no margin or border-radius on container | Increased border opacity, added margin, border-radius, stronger shadow | Design tokens for borders should be visible at a glance — test on actual bg color, not in isolation |
| 3 | 2026-05-14 | 5 | DX | PowerShell blocks `npm run dev` with execution policy error | Windows PowerShell script execution policy set to Restricted | Used Bash shell instead of PowerShell for npm commands | Test CLI commands in both shells on Windows; document shell requirements |

## Categories

- **Config** — missing files, env vars, setup issues
- **UI** — visual bugs, layout, styling
- **DX** — developer experience, tooling, shell issues
- **Logic** — business logic bugs
- **Perf** — performance issues
- **Security** — auth, access control issues
- **Data** — schema, validation, content issues
