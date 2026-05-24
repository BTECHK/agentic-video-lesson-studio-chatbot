# Studio Generate — Design (2026-05-24)

Website-driven content generation so the owner can produce a lesson video WITHOUT a
terminal or Claude Code. First feature in the locked build order (Generate → Menu →
Studio editing). Decisions from the owner review are in `.planning/STUDIO-NEXT.md`.

## Approved scope (this slice)
- **Input → output:** an existing lesson's `outline.json` → a fact-checked `script.json`.
- **Landing:** Draft → review → Apply (nothing overwrites committed content silently).
- **Depth:** Apply chains the full pipeline (script → plan → TTS → align → render → MP4).

## Flow
1. Owner opens **Generate** for a lesson, sees its outline, clicks **Generate script**.
2. Backend builds the script prompt (existing `buildScriptPrompt` + grounding) and runs the
   **GenerationProvider** to produce `script.json` content.
3. The result is validated against `ScriptSchema` and run through the existing
   **fact-check / grounding gate** (`factCheckScript`). Output is written as a **draft**
   (`content/lessons/<id>/script.draft.json`) plus a fact-check report — NOT `script.json`.
4. Owner reviews the draft (blocks + fact-check notes/flags). If flags exist, Apply is blocked.
5. **Apply:** write `script.json` from the draft, then run the regeneration DAG
   (`regenerate <id>`) which rebuilds plan → per-scene TTS → align → render → MP4.
6. Progress + final MP4 status shown.

## GenerationProvider (the backend abstraction)
`scripts/generate-script-headless.ts` (root, reuses all pipeline logic) is the engine:
- Builds the prompt, runs the provider, parses output → `ScriptSchema`, fact-checks, writes
  the draft + report. Uses `src/lib/logger.ts` (structured logging).
- **Providers**, selected by `GENERATION_BACKEND` env:
  - `claude-code` (DEFAULT, dev): spawn `claude -p "<prompt>" --output-format json`, parse the
    `result` text as JSON. No API key — uses the machine's Claude Code auth. This is how the
    website "reaches a Claude Code session": it spawns a headless one on demand (no session
    discovery needed).
  - `anthropic-api` (production): call the Anthropic SDK with `ANTHROPIC_API_KEY`.
- **Resilience (required):** each provider call wrapped with retry + exponential backoff +
  structured logging, so a failed/empty generation is diagnosable, never silent. A run that
  can't produce schema-valid, fact-checked output exits non-zero with a logged reason.

## Chatbot surface
- `/api/generate` (POST `{lessonId}`) → spawns the headless engine, returns `{draft, factCheck}`.
  Gated: enabled when generation is available (claude CLI present or API key); honest 503 otherwise.
- `/api/generate/apply` (POST `{lessonId}`) → writes `script.json` from the draft, then runs
  `regenerate` to MP4. Gated to the pipeline host (Docker), like `/api/regen`.
- **Generate page** under the Studio nav: shows the lesson's outline, Generate button, the draft
  + fact-check result (flags block Apply), Apply button + pipeline progress. Brand tokens, honest
  disabled states when a backend isn't available.

## Reuse / boundaries
- Reuses root `buildScriptPrompt`, `buildGroundingContext`, `factCheckScript`, `ScriptSchema`,
  and the `regenerate` DAG. The chatbot **spawns root scripts** (same pattern as `/api/ingest`,
  `/api/regen`) rather than importing across packages.
- Drafts + reports are gitignored (`script.draft.json`, `*.factcheck.json`).

## Testing
- TDD the pure/seam logic: provider selection, output parsing (claude JSON → script), retry/backoff
  wrapper, draft+report writing, fact-check gating. Mock the spawn in unit tests.
- Real verification: actually run the `claude-code` backend against module-1's outline and confirm
  it yields a schema-valid, fact-checked script (the key risk). Chatbot route/UI verified via build
  + a Playwright pass on :3100.

## Out of scope (later slices)
Topic→new-lesson, full input matrix, Menu (lesson directory), Studio in-place editing + comment
staging. Tracked in `.planning/STUDIO-NEXT.md`.
