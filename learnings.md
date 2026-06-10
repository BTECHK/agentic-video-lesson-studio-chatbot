# Project Learnings — Sample Academy AI Content System

Self-learning log. Read at the start of every task; update after every task. When an entry has been confirmed multiple times or is older than 30 days, graduate it into a `wiki/concepts/` or `wiki/entities/` page and replace it here with a one-line reference. Keep this file lean (< 50KB).

## What Has Worked

- **TDD red→green→prove loop (confirmed 2026-05-27).** For each code fix: write the test encoding the bug/edge case → run and CONFIRM it fails (red) → implement → run and CONFIRM green by reading the actual output, not the exit code. This caught real bugs (#59 fail-closed, #62 injection guard) and even caught a brittle order-dependent regex in my own test before it gave a false pass. Pair with `gitnexus impact <fn>` before editing + `detect-changes` before commit.
- **Lean board-driven batches (confirmed 2026-05-27).** GitHub Issues = source of truth; work 1–3 related issues per batch → mini-plan → TDD → prove → commit to master → close issue with an evidence comment (commands + output reviewed). Keeps progress visible + trackable; avoids big-bang.
- **Claude-as-judge gates over artifact checks (confirmed 2026-06-09).** Schema/render/audio checks pass "word soup" and even shipped a *wrong video* + typography defects. The 3-gate DoD (A fidelity · B teaching · C watch-the-MP4) with `gate:status` enforcement caught both. Judge = headless Claude Code (no key); Gemini only flags. **Caveat that bit us:** a frame-sampling visual review that checks content+brand but NOT *typography* waves through clipped glyphs / orphan punctuation / overlap → geometry needs its own DOM-measured gate (#73). Architecture/tooling rationale now in [[architecture-decisions]].
- **Systematic fix > in-place patch, proven on #72/#73 (confirmed 2026-06-09).** The typography defects were fixed by moving leading/spacing/safe-area onto shared scales in `brand/tokens.ts` (every scene primitive inherits them) AND adding an automated DOM-measured gate — not by patching QuoteCard alone. Result: the defect class can't recur on future videos. The pattern: when a bug is a *class*, fix the contract + add the sensor. Now [[layout-integrity-gate]].
- **DOM-measured gate via Remotion's real DOM (confirmed 2026-06-09).** Because Remotion renders real DOM in headless Chrome, a probe component (`LayoutProbe`) mounted behind an input prop can `getBoundingClientRect` every element at sampled frames and emit it over `onBrowserLog` — giving a deterministic geometry gate (no-clip/safe-area/overlap) without a vision model. Reusable pattern for any "did it render correctly" check.
- **Background agents inherit plan-mode write-lock (confirmed 2026-06-09).** Subagents dispatched during a plan-mode session can't write files even after the main thread is executing; they stage full file contents in their plan file (`# FILE n:` + fenced block) and the main thread extracts/verifies/commits. Keep the staging format machine-parseable. Prove-don't-trust: extract and re-run checks, never commit on agent say-so.
- **Standalone service decoupled from the Next.js app (confirmed 2026-06-09).** The student bot (`bot/`) vendors the small pure brain modules (retrieval, citation guard, persona) and shares only the `content/tools` *data*, rather than cross-importing `chatbot/`'s Next.js internals. A separate Cloud Run deployable is cleaner self-contained; the expensive/valuable part (curated data + retrieval/citation design) is what's reused. Now [[standalone-bot]].

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
