# Control Site — Per-Page Thought Process & Data Provenance

The internal console (the Next.js app under `chatbot/src/app/`) is the team-facing
control station for the content pipeline. This doc is the **data-provenance + synthesis**
layer: for each page, where its data actually comes from and how it's combined.

For each page's **Purpose / Controls / scope**, see `.planning/CONSOLE-SPEC.md` (the
contract); for the Studio/Generate decision trail, see `.planning/STUDIO-NEXT.md`. This
doc deliberately does not repeat those — it answers "what is this page showing, and is
it real?"

## Pattern (applies to every page)

Server components load data at request time (most are `dynamic = 'force-dynamic'`),
calling `chatbot/src/lib/*` helpers that read the **filesystem as the source of truth**
— there is no database. Hydrated data is passed to client components for rendering.
Two env flags gate any write/trigger action: `REGEN_TRIGGER_ENABLED` (Studio Apply /
Generate) and `INGEST_TRIGGER_ENABLED` (Ingestion refresh); off ⇒ honest 503, edits stay
staged, nothing diverges.

Canonical data locations:
- **Lessons** — `content/lessons/<id>/` (`lesson.json`, `outline.json`, `script.draft.json`,
  `audio/scene-*.wav`, `review/*.md`, staged `.comments.json` / `.edits.json`).
- **Tools** — `content/tools/*.json` (capabilities, pricing tiers, version history, limitations).
- **Sources** — `content/sources/*.json` (vendor source attribution / URLs).
- **Ingestion logs** — `logs/ingest/*.jsonl` (per-vendor run history + freshness).

## Per-page provenance

### `/` — Home / hub
- **Data:** `lesson-directory.ts → getLessonDirectory()`, which reads each lesson's
  `lesson.json` (timeline), `script.draft.json` (existence), `out/<id>.mp4` (render
  existence), and `review/*.md` (gate state).
- **Combined:** aggregates across all lessons into at-a-glance counts (total, videos
  rendered, drafts pending, stale scenes). Hub links are hardcoded.
- **Caveat:** live filesystem truth, recomputed per request.

### `/studio` — watch + note
- **Data:** `lesson-timeline.ts → getLessonTimeline(id)` (scenes, narration, captions,
  timings; `.wav` existence ⇒ "voice stale"), `comments-store.ts → loadComments(id)`,
  `edits-store.ts → loadEdits(id)`.
- **Combined:** a four-track timeline (animation / voiceover / script / captions) with
  staged comments + edits attached; passes the `REGEN_TRIGGER_ENABLED` flag.
- **Caveat:** review happens **async via the Drive bundle**, not here — the in-app video
  pane (#46) was cancelled and scene reorder (#43) removed.

### `/studio/generate` — draft a script
- **Data:** `generate-source.ts → getOutlineSummary(id)` reads `outline.json` (title,
  audience, sections + beat counts) and checks `script.draft.json`.
- **Combined:** outline summary + draft-exists flag; passes `REGEN_TRIGGER_ENABLED`.
  Generation itself runs via `/api/generate` (claude-code backend by default), not in the page.

### `/studio/menu` — Lesson Library
- **Data:** same `getLessonDirectory()` chain as Home.
- **Combined:** per-lesson row — id, title, classification, scenes, duration, stale count,
  `hasDraft` / `hasVideo`, and the A·B·C·L·T gate states; computes "publishable" (all green).

### `/content` — Tool Repository
- **Data:** `content.ts → getAllTools()` (reads `content/tools/*.json`) joined with
  `ingestion-panel.ts → getIngestionPanelData()` (reads `logs/ingest/*.jsonl` + `ingest.config.json`).
- **Combined:** each tool's vendor is normalized to the ingest config key (lowercase,
  space→dash) to overlay a freshness level (fresh / aging / stale) from the latest run.
- **Caveat:** empty if `content/tools/` is absent; freshness is as-of the latest log.

### `/content/compare` — Tool Comparison
- **Data:** `content.ts → getAllTools()` only (capabilities, pricing, version history).
- **Combined:** comparison table + benchmarks computed client-side; the "Sources" line is
  derived from tool metadata (`content/sources/*.json` attribution). Static — no freshness overlay.

### `/ingestion` — data freshness
- **Data:** `ingestion-panel.ts → getIngestionPanelData()` — parses `logs/ingest/*.jsonl`
  events against `ingest.config.json` (enabled vendors, schedule).
- **Combined:** per-vendor last-run + success/skipped + freshness, plus next scheduled run
  (last + period); passes `INGEST_TRIGGER_ENABLED` for the gated manual refresh.

### `/chat` — Ask Tutor
- **Data:** client component; no server-side load. `AccessGate` selects access mode, then
  `ChatInterface` calls `/api/chat`. Persona from `system-prompt.ts` (audience per
  `docs/AUDIENCE.md`); tool grounding fenced as untrusted data.
- **Caveat:** ephemeral (not persisted); a mock provider is used without a real LLM key.

### `/marketing` — public teaser
- **Data:** none — `MODULE_TOPICS` + `FEATURES` are hardcoded in the page. Public-facing,
  **not** part of the internal control station; links bridge to `/chat`, `/content`, `/content/compare`.

## Notes for future sessions

- The console reads live filesystem state — to reproduce what a page shows, inspect the
  cited `content/…` / `logs/…` files, not a database.
- Write actions are host-gated; on a non-pipeline machine the UI is read-only by design.
- Keep this doc paired with `CONSOLE-SPEC.md` (purpose/scope) and `STUDIO-NEXT.md` (decisions).
