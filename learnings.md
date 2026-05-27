# Project Learnings — Sample Academy AI Content System

Self-learning log. Read at the start of every task; update after every task. When an entry has been confirmed multiple times or is older than 30 days, graduate it into a `wiki/concepts/` or `wiki/entities/` page and replace it here with a one-line reference. Keep this file lean (< 50KB).

## What Has Worked

_(empty — add confirmed approaches as they prove out)_

## What Has Failed

_(empty — record dead ends and their cause so they aren't retried)_

## Patterns and Preferences

- **Tech stack (2026-05-26).** Remotion v4 (React video rendering) · Next.js 16 App Router + TypeScript (web app `chatbot/`) · Anthropic Claude SDK (AI backend) · Zod 4 (validation/schemas) · Cheerio + robots-parser + p-limit (content ingestion) · Tailwind CSS 4 + CSS custom properties (styling) · Vitest (testing) · Docker (node:22-bookworm-slim) + FFmpeg (container). Brand tokens: Syne font, #EDE8E3 base, #8B2635 accent, 4px radius.
- **Architecture: lessons are codified data.** A lesson is fully version-controlled data; changing the data regenerates the affected script/animation/voiceover surgically via a 6-stage, content-hashed generation DAG (outline → script → plan → TTS → align → render). No re-recording. See [[codified-lesson-pipeline]]. The conceptual core is [[timing-inversion]] (audio length drives scene duration, not hand-authored frames).
- **Generation backend abstraction.** Web-driven generation goes through a `GenerationProvider` selected by `GENERATION_BACKEND`: `claude-code` (default, dev — spawns headless `claude -p`, no API key) or `anthropic-api` (production). The chatbot reaches the pipeline by **spawning root scripts** rather than cross-package imports. See [[studio-generate]].
- **Container-first, TDD-enforced.** Docker from day 1; the Stop-hook script (`.claude/hooks/stop-gate.py`, when enabled) + CI block a turn/push unless typecheck + lint + test pass on the changed slice. Build vertical slices (data → logic → UI) ending green with render/screenshot proof — never horizontal half-built layers.
- **Audit integrity (P0).** Never mark work complete without verifying features exist, connect, and have tests. Fact-check gate blocks unverifiable tool claims; renders fail loudly on violated invariants rather than shipping silently.
- **Knowledge stack is layered.** Three systems run together: `learnings.md` (fast, mutable working memory) → `wiki/` (curated, searchable, index-first knowledge that mature learnings graduate into) → GitNexus `.gitnexus/` (code-structure knowledge graph for impact analysis and navigation). Check the wiki first when a graduated learning would answer a question.

## Open Questions

- Which `learnings.md` entries will recur often enough (or age past 30 days) to warrant graduation into the wiki? Re-evaluate during routine lint passes.
