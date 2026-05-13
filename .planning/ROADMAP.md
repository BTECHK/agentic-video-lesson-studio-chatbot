# Roadmap: Sample Academy AI Content System

## Overview

This roadmap delivers Sample Academy's AI content system in five phases. The stakeholder demo (Phases 1-2) is the critical path. Phase 1 establishes the containerized rendering pipeline with visual verification. Phase 2 produces the polished Module 1 video using the course outline's first section as the storyboard base. Phase 3 (Content Repository) runs in parallel with Phase 2 since they are independent — the content schema can be designed while animation work proceeds. Phase 4 (Content Ingestion) and Phase 5 (Chatbot) can also overlap once their dependencies are met.

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

- [ ] **Phase 1: Rendering Environment & Verification** - Docker + Remotion + headless Chrome pipeline with visual verification workflow
- [ ] **Phase 2: Module 1 Animation & Stakeholder Demo** - Polished Module 1 MP4 with brand-consistent spring-physics animations
- [ ] **Phase 3: Content Repository & Schemas** - Structured AI tool knowledge base with validation, versioning, and content-to-scene mapping
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
- [ ] 01-04-PLAN.md — HTML verification gallery, deterministic frame comparison, pipeline orchestrator, visual checkpoint

### Phase 2: Module 1 Animation & Stakeholder Demo
**Goal**: A polished, stakeholder-demo-quality Module 1 animated video in the warm-minimalist style with brand-consistent design and smooth spring-physics motion. Uses the course outline's first section as the storyboard base alongside the Module 1 HTML mockup.
**Depends on**: Phase 1
**Requirements**: ANIM-01, ANIM-02, ANIM-03, ANIM-04, ANIM-05, ANIM-06, ANIM-07
**Success Criteria** (what must be TRUE):
  1. Module 1 renders as a polished 1080p MP4 at 30fps with smooth spring-physics animations — no choppy transitions, no slideshow feel
  2. Brand system is pixel-perfect: Syne font renders correctly, #EDE8E3 background, #8B2635 accents, 4px radius on all elements
  3. Visual tethers connect concept states — continuous visual elements guide the viewer through data flow and state changes
  4. Individual scenes can be re-rendered without rebuilding the entire video
  5. Storyboard JSON includes timestamps, narration cues, and pause points ready for future voiceover integration
**Storyboard Source**: Course outline first section (sample-course-outline.docx Topic 1) + Module 1 Slides HTML mockup as design reference
**Design Approach**: Apply frontend-design skill with Apple/Google/Anthropic product design research
**Plans**: TBD
**UI hint**: yes

### Phase 3: Content Repository & Schemas
**Goal**: A structured, validated, Git-versioned knowledge base of AI tool capabilities that maps directly to video scenes
**Depends on**: Nothing (runs in PARALLEL with Phase 2)
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05
**Success Criteria** (what must be TRUE):
  1. AI tool capabilities for all 11 categories across P0/P1 tools are stored in structured schema with Zod validation catching errors before render
  2. Every factual claim has official source attribution with URL and verification date
  3. Content changes are Git-versioned with structured change history showing what changed and why
  4. Content nodes map to specific video sections — changing a content node identifies exactly which scenes need re-rendering
**Plans**: TBD

### Phase 4: Content Ingestion & Freshness
**Goal**: Automated systems that keep the content repository current — scraping vendor docs for AI tool updates and transcribing large source recordings for course context
**Depends on**: Phase 3 (content repository schemas must exist before ingestion pipelines can populate them)
**Requirements**: CONT-06, TRAN-01
**Success Criteria** (what must be TRUE):
  1. Web scraping system discovers and ingests new AI tool developments from vendor docs, changelogs, and support pages with minimal API key usage
  2. Video transcription pipeline processes files up to 2.5GB (the large source recordings) and produces usable text output
**Plans**: TBD

### Phase 5: TA Chatbot
**Goal**: A standalone web application where learners get accurate, source-cited answers grounded in the course content repository
**Depends on**: Phase 3 (chatbot RAG needs the content repository to ground responses). Architecture can begin in parallel with other phases — data population comes later.
**Requirements**: CHAT-01, CHAT-02, CHAT-03
**Success Criteria** (what must be TRUE):
  1. Chatbot answers questions using course content repository — not generic LLM knowledge — with responses grounded in verified, current information
  2. Every chatbot response includes source citations identifying which lesson, module, or tool the answer references
  3. Chatbot runs as a standalone web application with its own frontend, accessible independently of Teachable
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phase 1 → Phase 2 + Phase 3 (parallel) → Phase 4 + Phase 5 (parallel, once Phase 3 complete)

Note: Phase 5 chatbot architecture can begin early alongside Phase 2/3 since RAG patterns are well-established. Full data grounding depends on Phase 3 completion.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Rendering Environment & Verification | 3/4 | Executing | - |
| 2. Module 1 Animation & Stakeholder Demo | 0/TBD | Not started | - |
| 3. Content Repository & Schemas | 0/TBD | Not started | - |
| 4. Content Ingestion & Freshness | 0/TBD | Not started | - |
| 5. TA Chatbot | 0/TBD | Not started | - |
