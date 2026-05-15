# Sample Academy — AI Content System

A content production and maintenance system for **Sample Academy**, an AI education platform for working professionals. The system produces animated video lessons, keeps course content current as AI tools evolve, and provides learner support — all with minimal human intervention.

**The north star:** Run the asynchronous side of the course with minimal human intervention. The system does the work; humans approve the diff.


---

## Three Scopes

Everything in this system maps to one of three scopes from the original brief:

### Scope 1 — Content Repository (the foundation)
A structured knowledge base of 12 AI tools and their capabilities, kept current through automated ingestion from vendor docs. This repository is the single source of truth for tool facts.

### Scope 2 — Curriculum & Lesson Generation
Generates animated video lessons from the content repository + Instructor's teaching philosophy. No pre-recorded lectures — the system generates Remotion-based animated videos (1080p MP4) that can be surgically updated when tools change, without rebuilding entire lessons.

### Scope 3 — Support System
An AI teaching assistant ("Tutor") and office hours mode so learners get hands-on support grounded in course content, not generic LLM knowledge.

---

## What's Built

### Rendering Pipeline (Phase 1)
Containerized Remotion + Docker pipeline that renders animated compositions to MP4. Includes headless Chrome, post-render validation (file size, resolution, fps, blank frames), screenshot verification, and deterministic rendering.

### Content Repository (Phase 3)
Structured JSON data for all 12 AI tools across 11 capability categories, validated with Zod schemas. Every factual claim has official source attribution. Content nodes map to video scenes so changes identify exactly which scenes need re-rendering. Includes lesson content schema, scene type dispatcher, and animation architecture prep.

**12 tools tracked:** ChatGPT, Claude, Claude Code, Codex, Comet, Cowork, DeepSeek, Gemini, Grok, Manus, Perplexity, Qwen

**11 capabilities covered:** Writing & Chat, Research, File Analysis, Document Creation, Image Generation, Prototyping, Personalization, Persistent Context, Agents, Connectors, Dictation

### Content Ingestion Pipeline (Phase 4)
Automated web scraping system that pulls updates from vendor docs, changelogs, and support pages. Includes robots.txt compliance, CSS extraction, diff engine comparing scraped data against existing tool JSON, per-vendor git branches with auto-PR workflow, and 4 ingestion modes (manual poll, specific search, scheduled poll, full refresh).

### Chatbot Web App (Phases 5–7)
Next.js 16 web application with four main sections:

**Landing Page** — Hero section, Module 1 topic preview, feature cards

![Landing Page](docs/screenshots/01-landing-full.png)

**Ask Tutor (AI Teaching Assistant)** — Claude-powered assistant grounded in the content repository via RAG. Answers reference curated tool data with source citations, not generic LLM knowledge. Access-gated with demo mode.

![Tutor](docs/screenshots/02-chat-gate.png)

**Content Library** — Browsable repository of all 12 tools with tile/list views, priority filtering (Essential/Supplementary), and multi-select capability filtering.

![Content Library](docs/screenshots/03-content-library.png)

**Tool Comparison** — Side-by-side benchmarks (Arena ELO, quality index, speed, pricing, context window), capability matrix, and editorial "best for X" recommendations.

![Compare Tools](docs/screenshots/04-compare.png)

**Tool Detail Pages** — Full capability breakdown per tool with expandable details and source references.

![Tool Detail](docs/screenshots/05-tool-detail.png)

---

## Roadmap & Status

| # | Phase | Status | What It Delivers |
|---|-------|--------|-----------------|
| 1 | Rendering Environment | Done | Docker + Remotion + Chrome pipeline, screenshot verification, post-render validation |
| 2 | Module 1 Animation | Blocked (Instructor) | Polished stakeholder-demo animated video with spring-physics motion |
| 3 | Content Repository & Schemas | Done | 12-tool knowledge base, Zod validation, scene mapping, lesson schema |
| 4 | Content Ingestion & Freshness | Done | Web scraping, diff engine, auto-PR workflow, 4 ingestion modes |
| 5 | TA Chatbot (Scaffold) | Done | Next.js app, chat UI, LLM provider, access control, system prompt |
| 6 | Content Viewer V2 | Done | Comparison page, benchmark data, editorial picks, multi-select filters |
| 7 | Chatbot Content Grounding | Done | RAG pipeline wiring content repo into chat, citation verification |
| 7.1 | Home Page + Walkthrough | Done | Landing page, platform walkthrough video, GitHub push |
| 8 | Chatbot Enhancements | Not started | Office Hours mode, session persistence (SQLite) |
| 8.5 | Ingestion Control Panel | Not started | Web UI for data freshness, manual refresh, ad hoc search, schedules |
| 9 | Scene Components | Not started | Top scene types as Remotion React components from design system |
| 10 | Stakeholder Demo Animation | Not started | 30-60s product walkthrough Remotion video for stakeholder meetings |
| 11 | Lesson Pipeline | Blocked (Instructor) | Teaching philosophy encoding, content-to-lesson generation, Teachable export |

**Completed:** Phases 1, 3, 4, 5, 6, 7, 7.1 (7 of 11 phases)

**Ready to build (unblocked):** Phases 8, 8.5, 9

**Blocked on Instructor:** Phases 2, 10 (needs scene components first), 11

---

## What's Needed

### Engineering (no blockers)

| Phase | What | Why |
|-------|------|-----|
| 8 | Office Hours chat mode + SQLite session persistence | Students need exploratory Q&A beyond strict TA mode; sessions should survive restarts |
| 8.5 | Ingestion control panel (web UI) | Visual freshness indicators, manual refresh triggers, schedule monitoring |
| 9 | Scene components (Remotion) | Top 3-4 of the 14 defined scene types as React components with spring-physics animation |
| 10 | Stakeholder demo animation | 30-60s polished walkthrough showing chatbot + content repo for stakeholder meetings |

### From Instructor

| What | Why | Blocks |
|------|-----|--------|
| Final Module 1 lesson scripts | Landing page shows placeholder topic titles; animation needs real content | Phase 2, Phase 11 |
| Teaching philosophy document | How Instructor scaffolds, sequences, and explains — the system needs this encoded as rules to generate lessons in the Instructor's voice | Phase 11 |
| Curriculum structure | Lesson ordering, module breakdown, what goes in each section | Phase 11 |
| Tool priority confirmation | Are the 12 tools and Essential/Supplementary tiers still accurate? | Content accuracy |
| Landing page copy review | Hero reads "Learn to work with AI assistants" — confirm or revise | Phase 7.1 |
| Tutor voice direction | Formal-professional or warm-conversational? Currently warm-neutral | Chat quality |

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Animation | Remotion v4 (React-based video) |
| Web App | Next.js 16 (App Router), TypeScript |
| AI Backend | Anthropic Claude SDK |
| Ingestion | Cheerio, robots-parser, p-limit, JSON Lines |
| Validation | Zod 4 |
| Styling | Tailwind CSS 4 + CSS custom properties |
| Testing | Vitest |
| Container | Docker (node:22-bookworm-slim), FFmpeg |
| Brand | Syne font, #EDE8E3 base, #8B2635 accent, 4px radius |

## Project Structure

```
chatbot/                    # Next.js web application (Tutor + content viewer)
  src/app/                  # Routes: landing, chat, content, compare
  src/components/           # 15 React components
  src/lib/                  # Content loading, types, utilities

content/                    # AI tool knowledge base
  tools/                    # 12 tool profiles (JSON)
  sources/                  # Official source references

src/                        # Animation + ingestion pipeline
  components/               # Remotion scene components
  lib/                      # Content loaders, validators
  test/                     # Test suites

scripts/                    # Ingestion CLI, render scripts
docker/                     # Dockerfile configs
docs/screenshots/           # Platform screenshots
.planning/                  # Roadmap, phase plans, research
```

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

