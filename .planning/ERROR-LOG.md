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

## Categories

- **Config** — missing files, env vars, setup issues
- **UI** — visual bugs, layout, styling
- **DX** — developer experience, tooling, shell issues
- **Logic** — business logic bugs
- **Perf** — performance issues
- **Security** — auth, access control issues
- **Data** — schema, validation, content issues
