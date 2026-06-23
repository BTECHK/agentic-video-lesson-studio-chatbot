# Error & Issue Log

Local record of bugs, fixes, and corrections across the project. Purpose: avoid repeating mistakes and track patterns.

## Format

| # | Date | Phase | Category | Issue | Root Cause | Fix | Lesson |
|---|------|-------|----------|-------|------------|-----|--------|
| 1 | 2026-05-14 | 5 | Config | Dev server refused connection — `.env` file missing | `.env.example` exists but user must manually copy to `.env`; no setup script | Copied `.env.example` to `.env` | Add `npm run setup` or `postinstall` script that creates `.env` from `.env.example` if missing |
| 2 | 2026-05-14 | 5 | UI | Chat window has no visible separation from page background | Border color `rgba(28,28,28,0.08)` too subtle; no margin or border-radius on container | Increased border opacity, added margin, border-radius, stronger shadow | Design tokens for borders should be visible at a glance — test on actual bg color, not in isolation |
| 3 | 2026-05-14 | 5 | DX | PowerShell blocks `npm run dev` with execution policy error | Windows PowerShell script execution policy set to Restricted | Used Bash shell instead of PowerShell for npm commands | Test CLI commands in both shells on Windows; document shell requirements |
| 4 | 2026-05-23 | D/E | Data | TTS produced no audio on host — `audio/` dir empty despite "wrote …" logs | `sceneWavPath` used `path.join` (Windows `\`); the backslash path was passed into the **Linux** TTS container, which wrote a single literal-named file in `/app` (ephemeral, `--rm`) instead of the mounted volume | `sceneWavPath`/`sceneAlignPath` use `path.posix.join` | Any path crossing the host→Linux-container boundary must be POSIX, even on Windows. Added a test asserting forward slashes. |
| 5 | 2026-05-23 | D | Perf | `docker compose build tts` pulled multi-GB CUDA torch + RPC/500 daemon crashes | `kokoro`→`torch` resolves to the full CUDA build on Linux; no GPU in this sidecar | Install CPU-only torch first: `pip install torch --index-url download.pytorch.org/whl/cpu` before `requirements.txt` | Pin CPU torch for CPU-only ML sidecars; huge downloads also destabilize Docker Desktop on Windows |
| 6 | 2026-05-23 | D | DX | Per-scene container spawning hit exit 125 (`error waiting for container: unexpected EOF`) on scene 2; spaCy model re-downloaded every run | One `docker compose run` per scene → repeated container churn destabilizes Docker Desktop; `en_core_web_sm` not baked into image | Batch all scenes into ONE container run via a manifest (model loads once); bake `python -m spacy download en_core_web_sm` into the image | Prefer one batched container invocation over N spawns; bake model deps at build time, not runtime |
| 7 | 2026-05-24 | 8.5/G | DX | Playwright screenshots of new chatbot routes all failed (404 / element-not-found) though `next build` was clean | `playwright.config.ts` has `reuseExistingServer: true`; a **stale chatbot Docker container** held `localhost:3000` (port owned by `com.docker.backend`, un-killable via `Stop-Process`), so Playwright drove the OLD build | Ran the spec against a fresh `next dev -p 3100` via a throwaway config with `reuseExistingServer: false` | On Windows, confirm `:3000` isn't a stale Docker publish before trusting `reuseExistingServer`; use a fresh port for one-off UI verification |
| 8 | 2026-06-21 | QC/v2 | Perf | multi-lesson v2 re-render "took all night"; 1 lesson (`topic-1-lesson-3`) failed; result sat unreported ~10h | (a) lessons are long — the batch ≈ 70 min of 1080p video → ~2-3h serial render (not a hang); (b) full test suite + `gate:motion`/`gate:media` (ffmpeg+sharp) run **concurrently** with the render tripled per-lesson time (251s→802s) and crashed the batch; (c) ~85% RAM → `delayRender ... not cleared after 28000ms` killed one lesson; (d) completion watcher's 2h wall-clock timeout < the 2h48m job → expired partway through the batch, never signaled done | Re-render alone w/ `RENDER_CONCURRENCY` + `RENDER_FRAME_TIMEOUT_MS=120000` (added to `render-lesson.ts`); gate AFTER render, never during; key completion to `batch.done`/exit | Renders own the box — reserve it, gate after; never poll a long job by wall-clock; cap concurrency / free RAM on loaded machines. See learnings.md + `.planning/MOTION-CONTRACT.md` |

## Categories

- **Config** — missing files, env vars, setup issues
- **UI** — visual bugs, layout, styling
- **DX** — developer experience, tooling, shell issues
- **Logic** — business logic bugs
- **Perf** — performance issues
- **Security** — auth, access control issues
- **Data** — schema, validation, content issues
