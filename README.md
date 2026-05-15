# Sample Academy — AI Content System

A content production and maintenance system for **Sample Academy**, an AI education platform for working professionals. The system produces animated video lessons, keeps course content current as AI tools evolve, and provides learner support — all with minimal human intervention.

**The north star:** Run the asynchronous side of the course with minimal human intervention. The system does the work; humans approve the diff.


---

## Project Plan

The system has three scopes from the [original brief](project-brief.md): **(1)** a content repository that tracks what AI tools can do, **(2)** a curriculum and lesson generation pipeline that turns that content into animated video lessons using Instructor's teaching philosophy, and **(3)** a support system where students can ask an AI teaching assistant questions grounded in actual course content.

### Summary

| Deliverable | Scope | Status | What's Done | What's Needed |
|-------------|-------|--------|-------------|---------------|
| **Content repository** (12 AI tools, 11 capabilities) | 1 | Done | Structured JSON profiles for all 12 tools with Zod validation, source attribution, versioning. Content nodes map to video scenes for surgical re-rendering. | — |
| **Content ingestion pipeline** (automated freshness) | 1 | Done | Web scraper for vendor docs/changelogs with robots.txt compliance, diff engine, per-vendor git branches, auto-PR workflow. 4 modes: manual poll, specific search, scheduled poll, full refresh. | — |
| **Ingestion control panel** (web UI) | 1 | Not Started | — | Engineering: build web UI for per-tool freshness indicators, manual refresh triggers, ad hoc search, schedule monitoring |
| **Rendering pipeline** (Docker + Remotion) | 2 | Done | Containerized Remotion + headless Chrome pipeline. Post-render validation (resolution, fps, blank frames). Screenshot verification. Deterministic rendering. | — |
| **Scene components** (Remotion) | 2 | Not Started | 14 scene types designed and schema'd (from Claude Design session). Scene dispatcher + JSON content loader built. | Engineering: implement top 3-4 scene types as React components with spring-physics animation |
| **Module 1 animated video** (stakeholder demo) | 2 | Blocked | Design system fully locked (Syne, warm linen palette, motion contract). Storyboard metadata schema ready. | **Instructor:** final Module 1 lesson scripts and topic content |
| **Lesson generation pipeline** | 2 | Blocked | Content-to-scene mapping built. Zod lesson schema defined. Scene dispatcher routes JSON to Remotion components. | **Instructor:** teaching philosophy document (scaffolding, sequencing, explanation approach), curriculum structure, lesson ordering. Engineering: wire content repo → philosophy rules → lesson JSON → scene components → MP4 → Teachable export |
| **Stakeholder demo animation** | 2 | Not Started | — | Engineering: 30-60s polished Remotion composition. Blocked on scene components (above). |
| **Chatbot web app** (Tutor) | 3 | Done | Next.js 16 app with chat UI, Claude SDK backend, access gate (demo + student modes), system prompt, session management. | — |
| **Content grounding (RAG)** | 3 | Done | Content repo wired into chat via RAG. Tutor answers from curated tool data with source citations, not generic LLM knowledge. | — |
| **Content library + comparison** | 3 | Done | Browsable tool repository (tile/list views, priority + capability filtering). Side-by-side comparison with benchmarks, capability matrix, editorial picks. Tool detail pages. | — |
| **Landing page** | 3 | Done | Hero section, Module 1 preview, feature cards, brand system applied. | **Instructor:** confirm or revise hero copy and module topic titles |
| **Office hours mode** | 3 | Not Started | — | Engineering: separate system prompt for exploratory questions, UI toggle between TA and Office Hours modes |
| **Session persistence** | 3 | Not Started | — | Engineering: SQLite storage so chat history survives server restarts |
| **Platform walkthrough video** | — | Done | 60-second Remotion composition rendered to MP4 (4 scenes: title, chat demo, content viewer, comparison). Available locally at `output/video/platform-walkthrough.mp4`. | — |

### Progress at a Glance

- **Done:** 8 of 14 deliverables (content repo, ingestion pipeline, rendering pipeline, chatbot, RAG grounding, content library + comparison, landing page, walkthrough video)
- **Not started (unblocked):** 4 deliverables (ingestion control panel, scene components, office hours, session persistence)
- **Blocked on Instructor:** 2 deliverables (Module 1 animation, lesson generation pipeline)

---

## What's Needed from Instructor

These are the items only Instructor can provide — they block the lesson generation pipeline (Scope 2), which is the core differentiator of the system.

| Item | What It Is | What It Unblocks |
|------|-----------|-----------------|
| **Teaching philosophy document** | How you scaffold, sequence, and explain. What you emphasize, what you skip, your opinions on which tool to reach for. The system encodes this as rules to generate lessons in your voice. | Lesson generation pipeline — the system can't "sound like Instructor" without this |
| **Final Module 1 lesson scripts** | Confirmed topic titles, lesson text, narrative flow for Module 1 | Module 1 animated video, landing page content |
| **Curriculum structure** | Lesson ordering, module breakdown, what content goes where | Full lesson generation across all modules |
| **Tool priority review** | Confirm the 12 tools and their Essential/Supplementary tiers are still accurate | Content accuracy across the whole system |
| **Tutor voice direction** | Should the AI teaching assistant sound formal-professional or warm-conversational? Currently warm-neutral | Chat quality and consistency |

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

