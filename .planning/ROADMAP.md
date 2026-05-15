# Roadmap: Sample Academy AI Content System

## Overview

This roadmap delivers Sample Academy's AI content system in eleven phases. Phases 1, 3, 4, 5 established the foundation: rendering pipeline, content repository, ingestion automation, and chatbot scaffold. Phase 2 (animation) remains deferred until Instructor provides final lesson scripts.

**2026-05-15 gap audit** revealed significant missing features across all scopes — the chatbot lacks RAG grounding, no comparison feature exists, zero scene components are implemented. Phases 6–11 close these gaps:

- **Phases 6–10** (Wave 1+2): Unblocked work — content viewer polish, chatbot RAG, chatbot enhancements, scene components, stakeholder demo animation
- **Phase 11** (Wave 3): Blocked on Instructor — lesson pipeline, teaching philosophy, Teachable export

**Cross-cutting concerns applied to ALL phases:**
- **Test-driven development**: Tests written before implementation for every component
- **Structured logging**: Error logging at pipeline stages (render, validation, transitions, API calls)
- **Senior product design lens**: Apple/Google/Anthropic design principles researched and applied via frontend-design skill
- **Visual verification**: No feature reported "complete" without human-verified visual confirmation

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Rendering Environment & Verification** - Docker + Remotion + headless Chrome pipeline with visual verification workflow (completed 2026-05-13)
- [ ] **Phase 2: Module 1 Animation & Stakeholder Demo** - DEFERRED until Instructor provides final lesson scripts. Design system locked.
- [x] **Phase 3: Content Repository & Schemas** - Structured AI tool knowledge base with validation, versioning, and content-to-scene mapping (completed 2026-05-14)
- [x] **Phase 4: Content Ingestion & Freshness** - Web scraping system for vendor docs + video transcription pipeline for large source recordings (completed 2026-05-14)
- [x] **Phase 5: TA Chatbot (Scaffold)** - Chat UI, LLM provider, session management, access control, system prompt (completed 2026-05-14). NOTE: RAG grounding NOT wired — chatbot uses general Claude knowledge, not content repo.
- [ ] **Phase 6: Content Viewer V2** - P0/P1 labels, multi-select filtering, comparison page with benchmarks + editorial picks
- [ ] **Phase 7: Chatbot Content Grounding** - RAG pipeline wiring content repo into chat, citation verification
- [ ] **Phase 8: Chatbot Enhancements** - Office Hours mode, session persistence (SQLite)
- [ ] **Phase 9: Scene Components** - Implement top scene types as Remotion React components from existing schemas
- [ ] **Phase 10: Stakeholder Demo Animation** - Product walkthrough Remotion composition with mock chatbot responses
- [ ] **Phase 11: Lesson Pipeline** - BLOCKED on Instructor. Teaching philosophy, lesson generator, Teachable export

## Phase Details

### Phase 1: Rendering Environment & Verification
**Goal**: A containerized Remotion rendering pipeline that produces verified MP4 output with human-reviewable screenshots at every stage
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, VERI-01, VERI-02, VERI-03, VERI-04
**Success Criteria** (what must be TRUE):
  1. Running `docker compose up` produces a working Remotion environment that renders a test composition to MP4
  2. Headed browser mode is available for development — user can see live animations in a browser window, not just headless output
  3. Every rendered scene produces verification screenshots viewable by a human reviewer
  4. Rendering is deterministic — same storyboard input produces identical video output across runs
  5. Post-render validation catches file size, resolution, and blank-frame errors before output is accepted
**Plans:** 4 plans
Plans:
- [x] 01-01-PLAN.md — Project scaffold, Docker two-service architecture, brand tokens, font bundling
- [x] 01-02-PLAN.md — Brand Showcase test composition (3 scenes) and render script with screenshot capture
- [x] 01-03-PLAN.md — Post-render validation pipeline (TDD: file size, resolution, fps, blank frames, font, duration)
- [x] 01-04-PLAN.md — HTML verification gallery, deterministic frame comparison, pipeline orchestrator, visual checkpoint

### Phase 2: Module 1 Animation & Stakeholder Demo
**Goal**: A polished, stakeholder-demo-quality Module 1 animated video in the warm-minimalist style with brand-consistent design and smooth spring-physics motion. Uses the course outline's first section as the storyboard base alongside the Module 1 HTML mockup.
**Status**: DEFERRED — waiting on Instructor's final lesson scripts. Animation design system fully locked via Claude Design session (`Claude design work in session-SampleAcademy/animated-lesson-skill/`).
**Depends on**: Phase 1 (complete), Phase 3 (content schema + animation architecture prep), Instructor's final content
**Requirements**: ANIM-01, ANIM-02, ANIM-03, ANIM-04, ANIM-05, ANIM-06, ANIM-07
**Success Criteria** (what must be TRUE):
  1. Module 1 renders as a polished 1080p MP4 at 30fps with smooth spring-physics animations — no choppy transitions, no slideshow feel
  2. Brand system is pixel-perfect: Syne font renders correctly, #EDE8E3 background, #8B2635 accents, 4px radius on all elements
  3. Visual tethers connect concept states — continuous visual elements guide the viewer through data flow and state changes
  4. Individual scenes can be re-rendered without rebuilding the entire video
  5. Storyboard JSON includes timestamps, narration cues, and pause points ready for future voiceover integration
**Design Reference**: Claude Design session output — 13 scene types, motion contract (Anthropic glide easing), brand primitives, JSON content schema
**Animation Architecture Prep** (done in Phase 3): JSON content loader, Zod schema, scene type dispatcher, Remotion primitives ported from design system
**Plans**: TBD — will be planned when content scripts are available
**UI hint**: yes

### Phase 3: Content Repository & Schemas
**Goal**: A structured, validated, Git-versioned knowledge base of AI tool capabilities that maps directly to video scenes. Includes animation architecture prep (JSON content loader, Zod lesson schema, scene type dispatcher) so Phase 2 can execute immediately when content arrives.
**Depends on**: Phase 1 (complete)
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05
**Success Criteria** (what must be TRUE):
  1. AI tool capabilities for all 11 categories across P0/P1 tools are stored in structured schema with Zod validation catching errors before render
  2. Every factual claim has official source attribution with URL and verification date
  3. Content changes are Git-versioned with structured change history showing what changed and why
  4. Content nodes map to specific video sections — changing a content node identifies exactly which scenes need re-rendering
  5. Lesson content JSON schema validated with Zod and consumable by the Remotion rendering pipeline
  6. Scene type dispatcher maps JSON scene types to Remotion components
**Plans:** 5 plans
Plans:
- [x] 03-01-PLAN.md — Zod schemas: tool capabilities, source bibliography, lesson content, scene types
- [x] 03-02-PLAN.md — Animation architecture: scene type dispatcher, JSON content loader, content-to-scene mapping
- [x] 03-03-PLAN.md — P0 LLM tool data: ChatGPT, Claude, Gemini, Perplexity + source bibliographies
- [x] 03-04-PLAN.md — Remaining 8 tools: P0 coding agents + P1 tools + source bibliographies
- [x] 03-05-PLAN.md — Content-to-scene mapping, validation CLI, integration tests

### Phase 4: Content Ingestion & Freshness
**Goal**: Automated systems that keep the content repository current — scraping vendor docs for AI tool updates and transcribing large source recordings for course context
**Depends on**: Phase 3 (content repository schemas must exist before ingestion pipelines can populate them)
**Requirements**: CONT-06, TRAN-01
**Success Criteria** (what must be TRUE):
  1. Web scraping system discovers and ingests new AI tool developments from vendor docs, changelogs, and support pages with minimal API key usage
  2. Video transcription pipeline processes files up to 2.5GB (the large source recordings) and produces usable text output
**Plans:** 5 plans

**Wave 1** *(parallel — no dependencies)*
Plans:
- [x] 04-01-PLAN.md — Dependencies & configuration system (cheerio, robots-parser, p-limit, ingest.config.json, Zod config loader)
- [x] 04-02-PLAN.md — HTTP scraper, CSS extractor & JSON Lines logger (fetch + cheerio + robots.txt + skip-and-log)
- [x] 04-03-PLAN.md — Diff engine & schema validation (scraped vs existing tool JSON, D-07 best-effort mapping)

**Wave 2** *(blocked on Wave 1 completion)*
Plans:
- [x] 04-04-PLAN.md — PR workflow & LLM extraction (per-vendor git branch + gh pr create, Claude Code prompt generator)
- [x] 04-05-PLAN.md — CLI entry point, Docker container & npm scripts (4 ingestion modes, cron scheduling)

Cross-cutting constraints:
- All scraped data validated against ToolSchema.safeParse before writing (T-04-01)
- Vendor names sanitized via SHELL_METACHAR_PATTERN before shell commands (T-04-02)
- TRAN-01 deferred — no transcription code in this phase

### Phase 5: TA Chatbot
**Goal**: A standalone web application where learners get accurate, source-cited answers grounded in the course content repository
**Depends on**: Phase 3 (chatbot RAG needs the content repository to ground responses). Architecture can begin in parallel with other phases — data population comes later.
**Requirements**: CHAT-01, CHAT-02, CHAT-03
**Success Criteria** (what must be TRUE):
  1. Chatbot answers questions using course content repository — not generic LLM knowledge — with responses grounded in verified, current information
  2. Every chatbot response includes source citations identifying which lesson, module, or tool the answer references
  3. Chatbot runs as a standalone web application with its own frontend, accessible independently of Teachable
**Plans:** 4 plans
Plans:
- [x] 05-01-PLAN.md — Next.js app scaffold, brand system, shared types, access control (demo/student)
- [x] 05-02-PLAN.md — LLM backend: dual provider, Tutor system prompt, session store
- [x] 05-03-PLAN.md — Chat UI components, API route wiring, citations, visual checkpoint
- [x] 05-04-PLAN.md — Docker containerization for chatbot
**UI hint**: yes

### Phase 6: Content Viewer V2
**Goal**: Polish the content viewer with user-friendly labels, multi-select filtering, and a comparison page with benchmark data and editorial "best for X" recommendations
**Depends on**: Phase 3 (complete), Phase 5 (complete — viewer exists)
**Requirements**: CONT-07, CONT-08
**Success Criteria** (what must be TRUE):
  1. P0/P1 labels display as "P0 Models"/"P1 Models" (or similar user-friendly phrasing) — raw P0/P1 codes not shown to end users
  2. Capability filtering supports multi-select — user can filter by multiple capabilities simultaneously
  3. Features vs limitations use Apple iOS soft-bubble styling with visual distinction
  4. Comparison page at /content/compare shows side-by-side tool data with benchmark scores from open sources
  5. Editorial "best for X" recommendations based on curated content data
**Plans**: TBD

### Phase 7: Chatbot Content Grounding
**Goal**: Wire the content repository into the chatbot so Tutor answers from curated tool data instead of general Claude knowledge — the single biggest gap in the system
**Depends on**: Phase 3 (content repo), Phase 5 (chatbot scaffold)
**Requirements**: CHAT-01 (re-opened), CHAT-02 (re-opened), CHAT-06
**Success Criteria** (what must be TRUE):
  1. Chat route loads relevant content from content.ts before sending to LLM — Tutor's answers reflect your curated tool data, not generic Claude knowledge
  2. System prompt includes content context injection with the specific tool data relevant to the user's question
  3. Citations in responses reference actual content repository entries and can be verified as existing
  4. A student asking "what can Claude do for research?" gets an answer grounded in your Claude tool JSON, with citations
**Plans:** 2 plans
**Wave 1** *(no dependencies)*
Plans:
- [ ] 07-01-PLAN.md — Content retrieval function, system prompt content injection, LLMRequest type update

**Wave 2** *(depends on Wave 1)*
Plans:
- [ ] 07-02-PLAN.md — Chat route wiring, citation verification, provider updates, end-to-end checkpoint

### Phase 8: Chatbot Enhancements
**Goal**: Add Office Hours mode for exploratory questions and persist sessions across restarts
**Depends on**: Phase 7 (content grounding should be in place first)
**Requirements**: CHAT-04, CHAT-05
**Success Criteria** (what must be TRUE):
  1. Office Hours mode has its own system prompt allowing tangential/exploratory questions beyond strict TA content
  2. UI toggle lets user switch between TA mode and Office Hours mode
  3. Sessions persist across server restarts via SQLite (or similar file-based store)
  4. Session history survives container restarts with data stored in a mounted volume
**Plans**: TBD

### Phase 9: Scene Components
**Goal**: Implement the top 3-4 scene types from the 14 defined schemas as working Remotion React components
**Depends on**: Phase 1 (rendering env), Phase 3 (scene schemas)
**Requirements**: ANIM-03 (partial), ANIM-08
**Success Criteria** (what must be TRUE):
  1. At least 3 scene types render from JSON data as Remotion compositions with spring-physics animations
  2. Scene dispatcher correctly routes JSON scene type to the corresponding React component
  3. Each scene type follows the brand system (Syne, warm linen palette, 4px radius)
  4. Scene components are registered in Root.tsx alongside BrandShowcase
**Plans**: TBD

### Phase 10: Stakeholder Demo Animation
**Goal**: A polished product walkthrough Remotion composition demonstrating the chatbot + content repo for stakeholder meetings
**Depends on**: Phase 7 (chatbot should be grounded), Phase 9 (scene components available)
**Requirements**: DEMO-01
**Success Criteria** (what must be TRUE):
  1. 30-60 second Remotion composition renders as stakeholder-quality MP4 showing the product in action
  2. Mock chatbot responses demonstrate content-grounded answers (uses mock provider, no API key needed)
  3. Content repo browsing shown with filters, comparison, and tool detail views
  4. Smooth spring-physics transitions throughout — no choppy slides
**Plans**: TBD

### Phase 11: Lesson Pipeline
**Goal**: End-to-end pipeline from content repository to rendered Remotion lessons with Instructor's teaching philosophy encoded
**Status**: BLOCKED — waiting on Instructor's input for teaching philosophy, lesson sequencing, and curriculum structure
**Depends on**: Phase 9 (scene components), Instructor's content
**Requirements**: PHILO-01, PHILO-02, SCALE-01
**Success Criteria** (what must be TRUE):
  1. Instructor's teaching philosophy (scaffolding, sequencing, explanation approach) encoded as structured rules
  2. Content repository data transforms into lesson JSON automatically
  3. Lesson JSON renders through scene components into cohesive video compositions
  4. Diff engine + scene mapping + re-render pipeline connected end-to-end for surgical updates
  5. Rendered MP4 exports in Teachable-compatible format
**Plans**: TBD — blocked on Instructor's input

## Progress

**Execution Order:**
Phase 1 (complete) → Phase 3–5 (complete) → Phase 6 + 7 (parallel, NOW) → Phase 8 (after 7) → Phase 9 → Phase 10 (after 7+9) → Phase 2 + 11 (when Instructor's content ready)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Rendering Environment & Verification | 4/4 | Complete | 2026-05-13 |
| 2. Module 1 Animation & Stakeholder Demo | 0/TBD | Deferred (awaiting Instructor) | - |
| 3. Content Repository & Schemas | 5/5 | Complete | 2026-05-14 |
| 4. Content Ingestion & Freshness | 5/5 | Complete | 2026-05-14 |
| 5. TA Chatbot (Scaffold) | 4/4 | Complete | 2026-05-14 |
| 6. Content Viewer V2 | 0/TBD | Ready to plan | - |
| 7. Chatbot Content Grounding | 0/2 | Planned | - |
| 8. Chatbot Enhancements | 0/TBD | Blocked on Phase 7 | - |
| 9. Scene Components | 0/TBD | Ready to plan | - |
| 10. Stakeholder Demo Animation | 0/TBD | Blocked on Phase 7+9 | - |
| 11. Lesson Pipeline | 0/TBD | Blocked on Instructor | - |
