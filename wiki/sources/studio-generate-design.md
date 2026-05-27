---
type: source
title: "Studio Generate — Design (2026-05-24)"
tags: [architecture, design-spec, api, studio]
authors: [Technical lead, Claude]
url: ""
raw: raw/studio-generate-design.md
ingested: 2026-05-26
created: 2026-05-26
updated: 2026-05-26
sources: []
---

# Source: Studio Generate — Design

Summary of `raw/studio-generate-design.md` (dated 2026-05-24). Website-driven content generation so the owner can produce a lesson video **without a terminal or Claude Code** — the first feature in the locked build order (Generate → Menu → Studio editing).

## Approved scope (this slice)

- **Input → output:** an existing lesson's `outline.json` → a fact-checked `script.json`.
- **Landing:** Draft → review → Apply. Nothing overwrites committed content silently.
- **Depth:** Apply chains the full pipeline (script → plan → TTS → align → render → MP4).

## Flow

1. Owner opens **Generate** for a lesson, sees its outline, clicks **Generate script**.
2. Backend builds the script prompt (`buildScriptPrompt` + grounding) and runs the **GenerationProvider**.
3. Output validated against `ScriptSchema`, run through the **fact-check / grounding gate** (`factCheckScript`), written as a **draft** (`content/lessons/<id>/script.draft.json`) + fact-check report — NOT `script.json`.
4. Owner reviews the draft. **If flags exist, Apply is blocked.**
5. **Apply:** write `script.json` from the draft, then run the regeneration DAG (`regenerate <id>`) → plan → per-scene TTS → align → render → MP4.
6. Progress + final MP4 status shown.

## GenerationProvider (backend abstraction)

`scripts/generate-script-headless.ts` is the engine (reuses all pipeline logic, structured logging via `src/lib/logger.ts`). Providers selected by `GENERATION_BACKEND` env:
- **`claude-code`** (DEFAULT, dev): spawns `claude -p "<prompt>" --output-format json`, parses the `result` text as JSON. **No API key** — uses the machine's Claude Code auth. This is how the website "reaches a Claude Code session": spawns a headless one on demand.
- **`anthropic-api`** (production): Anthropic SDK with `ANTHROPIC_API_KEY`.
- **Resilience (required):** each provider call wrapped with retry + exponential backoff + structured logging. A run that can't produce schema-valid, fact-checked output exits non-zero with a logged reason — never silent.

## API surface (chatbot)

- `POST /api/generate {lessonId}` → spawns the headless engine, returns `{draft, factCheck}`. Gated: enabled when generation is available (claude CLI present or API key); honest 503 otherwise.
- `POST /api/generate/apply {lessonId}` → writes `script.json` from the draft, then runs `regenerate` to MP4. Gated to the pipeline host (Docker), like `/api/regen`.
- **Generate page** under Studio nav: outline, Generate button, draft + fact-check (flags block Apply), Apply + pipeline progress. Honest disabled states when a backend isn't available.

## Boundaries

Reuses root `buildScriptPrompt`, `buildGroundingContext`, `factCheckScript`, `ScriptSchema`, and the `regenerate` DAG. The chatbot **spawns root scripts** (same pattern as `/api/ingest`, `/api/regen`) rather than importing across packages. Drafts + reports are gitignored. Out of scope (later): Topic→new-lesson, full input matrix, Menu, Studio in-place editing + comment staging.

## Links

- Concept: [[studio-generate]]
- Concept: [[codified-lesson-pipeline]]
