---
type: concept
title: "Studio Generate"
tags: [architecture, api, studio]
created: 2026-05-26
updated: 2026-05-26
sources: [studio-generate-design]
---

# Studio Generate

Website-driven content generation: the owner produces a lesson video **without a terminal or Claude Code**. First feature in the locked build order (Generate → Menu → Studio editing). The web front door to the [[codified-lesson-pipeline]].

## Draft → review → Apply

Generation never overwrites committed content silently. `outline.json` → fact-checked `script.json` **draft** (`script.draft.json` + fact-check report). The owner reviews; **if fact-check flags exist, Apply is blocked.** Apply writes `script.json` and runs the `regenerate` DAG (plan → TTS → align → render → MP4).

## GenerationProvider

`scripts/generate-script-headless.ts` is the engine, selected by `GENERATION_BACKEND`:
- **`claude-code`** (default, dev) — spawns `claude -p "<prompt>" --output-format json`; **no API key**, uses the machine's Claude Code auth. The website "reaches" Claude Code by spawning a headless session on demand.
- **`anthropic-api`** (production) — Anthropic SDK with `ANTHROPIC_API_KEY`.
- Every provider call is wrapped with retry + exponential backoff + structured logging; a run that can't produce schema-valid, fact-checked output exits non-zero with a logged reason (never silent).

## API surface

- `POST /api/generate {lessonId}` → `{draft, factCheck}`; honest 503 when no backend available.
- `POST /api/generate/apply {lessonId}` → writes `script.json`, runs `regenerate` to MP4; gated to the Docker pipeline host.

## Boundaries

Reuses root `buildScriptPrompt`, `buildGroundingContext`, `factCheckScript`, `ScriptSchema`, the `regenerate` DAG. The chatbot **spawns root scripts** (like `/api/ingest`, `/api/regen`) rather than importing across packages. Drafts + reports are gitignored.

## Sources

- [[studio-generate-design]]
