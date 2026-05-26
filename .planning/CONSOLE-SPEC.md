# Internal Console — Spec / Contract

**Issue:** #40 · **Epic:** #39 · **Drafted:** 2026-05-26 (for Instructor + agent red-line)

## What this is

The **internal content-operations control station** for the Sample Academy team. It's where we **produce, review, and maintain** animated video lessons before they go to Teachable, and where we keep the AI-tool repository current. It is **not** the student site and **not** the marketing site (those are separate surfaces — the marketing page lives at `/marketing`).

**Primary user:** the team. Must be usable by **Instructor (non-technical)**. The bar: every visible control either does what this spec says, or it is removed/backlogged. No dead buttons.

## Cross-cutting decisions (locked 2026-05-26)

- **Docker-first** — portable across Windows, macOS and future cloud. Fragile Python (TTS) stays in Docker.
- **Git carries source + notes; Drive carries video.** MP4s are gitignored (too big for git). A git-ignored, Google-Drive-synced media folder shares video between machines. Notes/comments live in git so **Claude Code can read and apply them**. (#45)
- **Self-contained lesson bundles** — video + script + timings + captions + a **version-stamped manifest** so the player can flag "video is stale vs script" instead of silently drifting. (#45)
- **Structural edits happen via Claude Code**, from captured notes — the console **captures notes**, it does not reorder/restructure in-UI. (#43)
- **Rebuild loop deferred** (#47). This pass = make existing pages coherent + functional.

---

## Shell — left sidebar

- **Purpose:** navigation + identity ("Internal Console").
- **Controls:** Home; **Lesson Planning** (Studio, Generate, Lesson Library); **Repository** (Tool Repository, Tool Comparison); **Operations** (Ask Tutor, Ingestion); footer "Marketing site ↗" → `/marketing`.
- **In scope:** grouped nav, active-state. **Out:** auth gating (later).

## Home — `/`

- **Purpose:** orient the team; one-click into each hub; at-a-glance status.
- **Controls:** hub cards (each → its page). **Should add (audit, #41):** lightweight status — e.g. # lessons, how many stale, last render — so the home is a real dashboard, not just links.
- **Out:** marketing/hero copy (that's `/marketing`).

## Studio — `/studio`

- **Purpose:** **watch a rendered lesson and leave notes** that flow back to source (→ Claude Code applies them). The core review surface.
- **Controls & target behavior:**
  - Lesson picker (dropdown) → loads that lesson. ✓ works.
  - Timeline: Animation / Voiceover / Narration tracks on a shared time axis; ruler + playhead; zoom. ✓ works.
  - Click a clip → inspector (scene detail + narration). ✓ works.
  - **Video pane (MISSING — #46):** a player synced to the playhead. The whole point of Studio is to watch; today there is no video. Reads the lesson bundle (#45).
  - **Inline notes/comments per scene + timestamp (keep, make primary):** persist to git, feed Claude Code. ✓ comments persist.
  - **Apply → rebuild (FIX — #42):** currently shows "Network error"; should show the real gated message, and be enabled on the host. (Rebuild itself = #47, deferred.)
  - **Scene reorder ←earlier / later→ (REMOVE — #43):** no visual effect, confusing; structure handled via Claude Code.
- **In scope:** watch + note. **Out:** in-UI restructuring; rendering controls (deferred).

## Generate — `/studio/generate`

- **Purpose:** draft a fact-checked script from a lesson's outline, review it, then (later) apply to rebuild.
- **Controls & target behavior:**
  - Outline summary (read-only). ✓
  - **Generate / Regenerate script** → runs headless Claude, returns a fact-checked draft. ✓ but **dies if you navigate away (#44)** — must become a background job that survives navigation + resumes.
  - **Cancel** → aborts a running generation. ✓ (added; only shows mid-run).
  - **Apply → rebuild video** → gated (#47/#42). Show honest state.
- **Out:** timestamps in the draft (timestamps are audio-derived → Studio only).

## Lesson Library — `/studio/menu`

- **Purpose:** directory of all lessons + at-a-glance status.
- **Controls & target behavior:**
  - Row per lesson: title, scenes, duration, draft/stale/video flags.
  - **"🎬 video" must be clickable → play (FIX — #46):** today it's dead text.
  - "Open timeline" → Studio. ✓ "Generate" → Generate. ✓
- **In scope:** list + open + play.

## Tool Repository — `/content`

- **Purpose:** browse the 12 AI tools (capabilities, limitations, official sources).
- **Controls:** tile/list views, priority + capability filters, tool detail pages. ✓ works.
- **Feeds from:** the feature/functionality research (#48).

## Tool Comparison — `/content/compare`

- **Purpose:** side-by-side specs + benchmarks with attribution.
- **Controls:** tool multi-select; comparison table (model/context/price + Arena/Quality/Speed); Sources footnote. ✓ works (refreshed #35).
- **Feeds from:** #48.

## Ingestion — `/ingestion`

- **Purpose:** per-vendor freshness (green/yellow/red), schedule + last/next run, gated manual refresh.
- **Controls:** freshness panel ✓; **manual refresh** (gated to host) — apply same honest-gating fix as Apply (#42 pattern). Ad-hoc topic search: backlogged.

## Ask Tutor — `/chat`

- **Purpose:** internal Q&A grounded in course content (also the student-facing assistant later).
- **Controls:** access gate, chat, TA/Office-Hours toggle. ✓ works (P0 fixed).

## Marketing — `/marketing` (out of console scope)

- Preserved separate surface; eventually its own public site. Linked from sidebar footer only.

---

## Audit checklist (drives #41)

| Surface | Works | Fix | Add | Remove |
|---|---|---|---|---|
| Studio | timeline, inspector, comments | Apply message (#42) | video pane (#46) | reorder (#43) |
| Generate | generate, cancel | survive-nav (#44), Apply msg (#42) | — | — |
| Lesson Library | list, open | clickable video (#46) | — | — |
| Ingestion | freshness | gated-refresh message (#42) | — | — |
| Home | hub links | — | status dashboard (#41) | — |
| Repository / Compare / Chat | ✓ | — | — | — |

**Open question for Instructor/owner:** is the **video pane in Studio (#46)** in-scope for this "make it work" pass, or backlogged until the media/bundle model (#45) lands? It's core to Studio's purpose, but depends on the bundle + Drive sync being set up first.
