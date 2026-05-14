# Roadmap: Sample Academy AI Content System

## Overview

This roadmap delivers Sample Academy's AI content system in five phases. Phase 1 (complete) established the rendering pipeline. Phase 2 (animation) is deferred until Instructor provides final lesson scripts — the animation design system is locked via the Claude Design session output. Phase 3 (Content Repository) and Phase 5 (Chatbot) now run in parallel as the active critical path. Phase 3 also includes animation architecture prep (JSON schema, scene dispatcher, Remotion primitives) so content can be rendered immediately when scripts arrive. Phase 4 (Content Ingestion) follows Phase 3.

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
- [ ] **Phase 4: Content Ingestion & Freshness** - Web scraping system for vendor docs + video transcription pipeline for large source recordings
- [ ] **Phase 5: TA Chatbot** - Standalone RAG-grounded chatbot answering from course content with source citations

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
- [ ] 04-03-PLAN.md — Diff engine & schema validation (scraped vs existing tool JSON, D-07 best-effort mapping)

**Wave 2** *(blocked on Wave 1 completion)*
Plans:
- [ ] 04-04-PLAN.md — PR workflow & LLM extraction (per-vendor git branch + gh pr create, Claude Code prompt generator)
- [ ] 04-05-PLAN.md — CLI entry point, Windows Task Scheduler & npm scripts (3 ingestion modes, schtasks setup)

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

## Progress

**Execution Order:**
Phase 1 (complete) → Phase 3 + Phase 5 (parallel, NOW) → Phase 4 (after Phase 3) → Phase 2 (when Instructor's content ready)

Phase 2 deferred — animation design locked, waiting on final lesson scripts. Phase 3 includes animation architecture prep so Phase 2 executes fast when unblocked.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Rendering Environment & Verification | 4/4 | Complete | 2026-05-13 |
| 2. Module 1 Animation & Stakeholder Demo | 0/TBD | Deferred (awaiting content) | - |
| 3. Content Repository & Schemas | 5/5 | Complete | 2026-05-14 |
| 4. Content Ingestion & Freshness | 2/5 | In Progress | - |
| 5. TA Chatbot | 4/4 | Complete | 2026-05-14 |
