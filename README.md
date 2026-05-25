# Sample Academy — AI Content System

A content production and maintenance system for **Sample Academy**, an AI education platform for working professionals. The system produces animated video lessons, keeps course content current as AI tools evolve, and provides learner support — all with minimal human intervention.

**The north star:** Run the asynchronous side of the course with minimal human intervention. The system does the work; humans approve the diff.


> **Status (2026-05-25):** Most recent work lives on the `feat/codified-lesson-pipeline` branch (not yet merged to master) — the full lesson pipeline, 9 animated scene types, the Studio editor, and chatbot enhancements. Two things need attention: (1) tool content is **~15 months stale** and being refreshed from web-verified sources — see the freshness report; (2) the **chatbot currently fails** even with a valid API key (P0 — #27, #30). Curriculum first-pass for Instructor's review: `.planning/curriculum/` (#31).

---

## Project Plan

The system has three scopes from the [original brief](project-brief.md): **(1)** a content repository that tracks what AI tools can do, **(2)** a curriculum and lesson generation pipeline that turns that content into animated video lessons using Instructor's teaching philosophy, and **(3)** a support system where students can ask an AI teaching assistant questions grounded in actual course content.

### Summary

| Deliverable | Scope | Status | What's Done | What's Needed |
|-------------|-------|--------|-------------|---------------|
| **Content repository** (12 AI tools, 11 capabilities) | 1 | Done | Structured JSON profiles for all 12 tools with Zod validation, source attribution, versioning. Content nodes map to video scenes for surgical re-rendering. | — |
| **Content ingestion pipeline** (automated freshness) | 1 | Done | Web scraper for vendor docs/changelogs with robots.txt compliance, diff engine, per-vendor git branches, auto-PR workflow. 4 modes: manual poll, specific search, scheduled poll, full refresh. | — |
| **Ingestion control panel** (web UI) | 1 | Done (on branch) | `/ingestion` panel: per-vendor freshness (green/yellow/red), schedule + last/next run, gated manual refresh. | Merge to master; ad hoc topic search still deferred |
| **Rendering pipeline** (Docker + Remotion) | 2 | Done | Containerized Remotion + headless Chrome pipeline. Post-render validation (resolution, fps, blank frames). Screenshot verification. Deterministic rendering. | — |
| **Scene components** (Remotion) | 2 | Done (on branch) | 9 data-driven lesson scenes in `src/compositions/lesson-scenes/` (cover, quote-card, preview-band, journey-map, tool-card-reveal, capability-table, feature-grid, recap-grid, assignment-list) + dispatcher. Visually verified. | Merge to master; real tool logos in `public/` |
| **Module 1 animated video** | 2 | Rendered (on branch) | Narrated MP4 shipped: `out/module-1.mp4` (1080p, ~205s, H.264+AAC + word-synced captions) from the codified pipeline. Note: this is the engineer's condensed strawman, **not Instructor's real Topic 1**. | Instructor reviews curriculum first-pass (#31), then re-author from the real Topic 1 |
| **Lesson generation pipeline** | 2 | Built (on branch) | Full codified chain: outline.json → fact-checked script → lesson.json → silent MP4 → local TTS → forced alignment → narrated MP4. Per-scene regeneration DAG. | Curriculum first-pass drafted (`.planning/curriculum/`, #31); awaiting Instructor sign-off to author real lessons; Teachable upload path still missing (#28) |
| **Stakeholder demo animation** | 2 | Not Started | — | Engineering: 30-60s polished Remotion composition. Blocked on scene components (above). |
| **Chatbot web app** (Tutor) | 3 | Built — but FAILING (P0) | Next.js app with chat UI, Claude SDK backend, access gate, system prompt, session management. **Currently errors on every request** even with a valid key — deprecated model + swallowed errors. | Fix #27 / #30 (root-cause audit done) |
| **Content grounding (RAG)** | 3 | Done | Content repo wired into chat via RAG. Tutor answers from curated tool data with source citations, not generic LLM knowledge. | — |
| **Content library + comparison** | 3 | Done | Browsable tool repository (tile/list views, priority + capability filtering). Side-by-side comparison with benchmarks, capability matrix, editorial picks. Tool detail pages. | — |
| **Landing page** | 3 | Done | Hero section, Module 1 preview, feature cards, brand system applied. | **Instructor:** confirm or revise hero copy and module topic titles |
| **Office hours mode** | 3 | Done (on branch) | TA/Office-Hours toggle + relaxed system prompt, threaded through providers + chat route. | Merge to master |
| **Session persistence** | 3 | Done (on branch) | Injectable SessionStorage + file-backed default; `chatbot-data` volume. | Merge to master |
| **Platform walkthrough video** | — | Done | 60-second Remotion composition rendered to MP4 (4 scenes: title, chat demo, content viewer, comparison). Available locally at `output/video/platform-walkthrough.mp4`. | — |

### Progress at a Glance

- **Built (mostly on `feat/codified-lesson-pipeline`, pending merge):** content repo, ingestion pipeline + control panel, rendering pipeline, **lesson generation pipeline** (full codified chain → narrated MP4), **9 scene components**, RAG grounding, content library + comparison, office hours, session persistence, Studio editor, walkthrough video.
- **Needs attention:** chatbot failing (P0 #27/#30); tool content stale, refresh pending (#25); tool taxonomy products-vs-surfaces (#26); Teachable upload path missing (#28); landing-page scope decision (#28).
- **Awaiting Instructor:** review of the curriculum first-pass (#31) → then author real Topic 1+ lessons. Their source materials are now **delivered**.

---

## What's Needed from Instructor

These items were the blockers for the lesson generation pipeline. **As of 2026-05-25 Instructor has delivered all source materials** — what's needed now is a review of the first-pass drafts (#31) and a few decisions.

| Item | Status | What's needed now |
|------|--------|-------------------|
| **Teaching philosophy** | ✅ Delivered (distilled into `content/teaching/STYLE.md`) | Confirm the distillation captures it |
| **Course outline / curriculum structure** | ✅ Delivered (`sample-course-outline.docx`) | Review the extracted course map |
| **Frameworks** | ✅ Delivered | — |
| **Personas** | ✅ Delivered | Confirm example targeting |
| **Workshop transcripts** | ✅ Delivered (in `content/teaching/transcripts/`) | — |
| **Decisions** | ⏳ Pending | Terminology (Topic vs Module), animation-vs-demo split, Topic 1 re-author, scene types, capability list — see #31 |
| **Tutor voice direction** | ⏳ Pending | Formal vs warm-conversational (currently warm-neutral) |

---

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Animation | Remotion v4 (React-based video rendering) |
| Web App | Next.js 16 (App Router), TypeScript |
| AI Backend | Anthropic Claude SDK |
| Ingestion | Cheerio, robots-parser, p-limit, JSON Lines |
| Validation | Zod 4 |
| Styling | Tailwind CSS 4 + CSS custom properties |
| Testing | Vitest |
| Container | Docker (node:22-bookworm-slim), FFmpeg |
| Brand | Syne font, #EDE8E3 base, #8B2635 accent, 4px radius |

## Running Locally

```bash
# Chatbot (web app)
cd chatbot && npm install && npm run dev
# Open http://localhost:3000

# Animation pipeline (Docker)
docker compose up

# Content ingestion
npm run ingest -- --mode=poll --vendor=anthropic
```

Chat requires `chatbot/.env.local` with `ANTHROPIC_API_KEY=your-key-here`.

---

