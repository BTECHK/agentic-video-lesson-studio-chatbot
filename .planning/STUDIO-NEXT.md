# Studio / Website-Authoring — Direction & Audit (2026-05-24)

Captured from the owner review + the 5-persona website audit. This is the roadmap for
turning the Studio from a **viewer** into an **authoring tool**, plus the decisions that gate it.

## Locked decisions

### Generation backend (the fork everything depends on)
- Build BOTH, behind one `GenerationProvider` interface, selected by env:
  - `claude-code` — local Claude Code session (no API key, uses existing auth). **DEFAULT for dev.**
  - `anthropic-api` — server-side Claude via API key. **Production default later.**
- Both impls MUST have: failure handling, exponential backoff, retry, and structured logging
  (reuse `src/lib/logger.ts`) so a failed/no-op generation is diagnosable — not silent.

### How the website reaches a Claude Code session (owner asked me to figure this out)
Recommended: **headless spawn via the Claude Agent SDK / `claude -p`.** The Next server, on a
generate request, spawns a headless Claude Code run in the repo dir and returns its result. This
sidesteps "which session?" — it starts one on demand with the machine's auth. Wrap with retry/
backoff/logging; abstract behind `GenerationProvider` so the API impl is a drop-in swap.
Alternative (if a supervised interactive session is wanted): a file-queue (`.generation-queue/`)
that a running session watches via a hook/`/loop` and writes results back to; website polls. More
moving parts; keep as a fallback.

### Studio IA (navigation)
Sub-sections: **Studio · Generate · Menu**, with the **lesson directory as a sidebar** on Menu.
Build order: **Generate (2) → Menu (3) → Studio editing (1).**

### Generate feature (the upload→generate vision)
Upload any subset of: outline, script, lesson plan, topic. Use one or all to generate the rest
(script → video/captions/outline; outline → everything; etc.). Front-end calls the
`GenerationProvider`. Placeholder/disabled cleanly when no backend is configured (honest gating).

### Editing & comments (Studio editing, build last of the three)
- Captions/script/scene-timing should become **editable** from the website (incl. caption timing /
  pauses), not view-only.
- Comments must **persist with metadata tags** (lesson, scene, track, author, time) into a
  **staging area** — a DB/file of pending changes. Each track (voiceover/script/etc.) gets a
  comments tab; the owner stages many targeted edits, then applies them (→ generation/regeneration).
- Today the regen trigger discards the comment text (`regen-trigger.ts` passes only lessonId);
  the staging→apply step must actually feed comment intent into the generation backend.

## Naming / model corrections (owner)
- "Script" track currently shows verbatim narration (== captions source). Rename to **Narration**,
  and SURFACE the **outline** (objectives/beat summaries from `outline.json`) — it's shown nowhere.
- Captions (second-by-second) are good; keep them.

## Audit (5 personas) — fixed now vs. confirmed gaps
Fixed this pass (verified live): `/api/access` 500→400 on bad JSON; Studio voiceover WAV now served
(was 404 while "fresh"); three "intro" clips → distinct beat labels; home "13 slides"→"9 scenes".

Confirmed gaps = the roadmap above (NOT phantom — known limitations):
- Chat runs the **mock** provider (echoes the question, claims "grounded", leaks "MockTool") — needs
  the real backend. Honesty fix or real provider before any stakeholder demo.
- Studio comments don't persist / don't reach the pipeline; Studio is view-only; no authoring/upload.
- Outline not surfaced; "Script" mislabeled.

Audit also confirmed the GOOD: Tool Repository/Comparison are real and strong; gated trigger buttons
are honest (503 + disabled UI, not phantom); sessions persist; real MP4 renders; access control sound.
