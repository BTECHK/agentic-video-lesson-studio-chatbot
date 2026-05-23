# Requirements: Sample Academy AI Content System

**Defined:** 2026-05-13
**Core Value:** Lessons that stay current and look professionally animated without requiring Instructor to re-record

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Animation Pipeline

- [ ] **ANIM-01**: Module 1 renders as polished 1080p MP4 at 30fps with smooth spring-physics animations matching Anthropic Cowork quality
- [ ] **ANIM-02**: Brand system applied via CSS variables (Syne font, #EDE8E3 base, #8B2635 accent, 4px radius) — exact match to established brand tokens
- [ ] **ANIM-03**: Reusable scene type components (intro, concept explanation, demo walkthrough, tool comparison, summary) parameterized by content data
- [ ] **ANIM-04**: Visual tethers connecting concept states — continuous visual elements guiding the eye through data flow and state changes
- [ ] **ANIM-05**: Storyboard JSON contract with scene timestamps, narration cues, and pause points for future AI voiceover integration
- [ ] **ANIM-06**: Scene-level rendering enabling selective re-render of individual scenes without rebuilding full video
- [ ] **ANIM-07**: MP4 output under 2GB with CRF 23 / 5Mbps bitrate cap for Teachable upload compatibility

### Infrastructure

- [x] **INFRA-01**: Docker container with Remotion + headless Chrome on node:22-bookworm-slim for rendering
- [x] **INFRA-02**: Docker Compose configuration with shared volumes for content, storyboards, and rendered output
- [x] **INFRA-03**: FFmpeg for video post-processing, scene concatenation, and format validation
- [x] **INFRA-04**: Deterministic rendering — same storyboard input produces identical video output
- [x] **INFRA-05**: Headed browser mode available for visual verification — screenshots captured at each scene for human + AI review
- [x] **INFRA-06**: Pre-render and post-render validation checks (file size < 1.8GB, resolution correct, font rendering verified, no blank frames)

### Visual Verification

- [x] **VERI-01**: Every rendered scene produces verification screenshots viewable by human reviewer
- [x] **VERI-02**: Headed browser mode for development — see the actual animations during authoring, not just headless output
- [x] **VERI-03**: Side-by-side comparison of storyboard intent vs rendered output for QA
- [x] **VERI-04**: No feature or animation reported as "complete" without human-verified visual confirmation

### Content Repository

- [x] **CONT-01**: Structured schema for AI tool capabilities (11 capability categories across P0/P1 tools)
- [x] **CONT-02**: Official source attribution for every factual claim with URL and verification date
- [x] **CONT-03**: Git-versioned content with structured change history
- [x] **CONT-04**: Content-to-scene mapping metadata linking content nodes to specific video sections
- [x] **CONT-05**: Zod-validated content schemas catching structural errors before render
- [x] **CONT-06**: Web scraping/research system that periodically discovers new AI tool developments and updates from vendor docs, changelogs, and support pages — minimal API key usage, agent-driven
- [ ] **CONT-07**: AI tool comparison feature with benchmark data from open sources (LMSYS, Artificial Analysis) and editorial "best for X" recommendations
- [ ] **CONT-08**: User-friendly content labels (not raw P0/P1) and multi-select capability filtering in the content viewer

### Chatbot Support

- [ ] **CHAT-01**: RAG-grounded TA chatbot answering from course content repository with verified, current information (Phase 5 built scaffold only — RAG not wired)
- [ ] **CHAT-02**: Source citations in every response that reference actual content repo entries and can be verified (Phase 5 built parsing only — no verification)
- [x] **CHAT-03**: Standalone web application (separate from Teachable) with its own frontend
- [ ] **CHAT-04**: Office Hours chatbot mode for tangential/exploratory questions — distinct from TA mode's strict content grounding (moved from v2)
- [ ] **CHAT-05**: Session persistence across server restarts via file-based storage
- [ ] **CHAT-06**: Citation verification — every cited source validated against content repository before display

### Stakeholder Demo

- [ ] **DEMO-01**: Product walkthrough animation (30-60s Remotion composition) demonstrating chatbot + content repo for stakeholder meetings

### Scene Components

- [ ] **ANIM-08**: Scene type components implemented as Remotion React components from the 14 defined Zod schemas

### Lesson Generation Pipeline (promoted from v2 — unblocked by Instructor's transcripts, 2026-05-23)

The codified outline → script → animation → voiceover → MP4 factory. See `docs/superpowers/specs/2026-05-23-codified-lesson-pipeline-design.md`.

- [ ] **STYLE-01**: Instructor's teaching voice extracted from workshop transcripts into a reusable `content/teaching/STYLE.md` (cadence, vocabulary, signature phrases, openings/closings, grade level)
- [ ] **OUTLINE-01**: Zod-validated lesson `outline.json` schema (sections, learning objectives, tool/capability references) — codified lesson structure above the scene layer
- [ ] **SCRIPT-01**: AI script generator producing talk-track `script.json` in Instructor's voice, structured per scene type, from outline + STYLE + facts
- [ ] **SCRIPT-02**: Fact-check gate — every tool claim in a generated script maps to a capability/source record or is flagged for review (audit-integrity P0; "official sources only")
- [ ] **PLAN-01**: Scene planner mapping `script.json` blocks → `lesson.json` draft scenes against the 14 scene-type content schemas
- [ ] **VOICE-01**: AI voiceover via free/local TTS adapter — Kokoro-82M (Apache-2.0) branded neutral default, Chatterbox (MIT) Instructor-clone upgrade, paid API behind the same adapter (no subscription required)
- [ ] **VOICE-02**: Word-level timestamp alignment (stable-ts, local) syncing narration + captions to animation frames
- [ ] **VOICE-03**: Audio-driven scene durations — `narration` audio length drives `duration`; contiguous `start`/`lesson.duration` recomputed and re-validated; per-scene-type minimum-duration floor
- [ ] **VOICE-04**: `narration` layer added to `SceneBaseSchema` (text + audioSrc + word timings) — single source of truth for audio/captions; backward-compatible with silent lessons
- [ ] **FRESH-01**: Content-hashed artifact DAG — changing one input regenerates only affected downstream artifacts, cached per scene
- [ ] **FRESH-02**: Targeted regeneration — edit/comment on one element (script block, voice, scene content) → only that scene's downstream artifacts rebuild, then re-splice (no full re-record)
- [ ] **FRESH-03**: `regenerate` CLI driving the DAG with fresh/stale/error reporting

### Control Plane (Studio)

- [ ] **CTRL-01**: "Studio" tab in the Next.js app — CapCut/GarageBand-style multi-track timeline showing animation / voiceover / script / captions as 4 parallel tracks on one shared time axis
- [ ] **CTRL-02**: Click any element → view isolated + leave a comment; edits are AI-delegated (comment → regenerate), no in-app content editing
- [ ] **CTRL-03**: Per-element fresh/stale/error status surfaced on the timeline; playhead scrub/play of all tracks together; set-and-forget default

### Transcription

- [ ] **TRAN-01**: Video transcription pipeline (FFmpeg audio extraction + Whisper/AssemblyAI) capable of handling files up to 2.5GB

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Voiceover System — ⮝ PROMOTED to v1 (2026-05-23)

Re-scoped free/local-first (not ElevenLabs) and moved to the active Lesson Generation Pipeline group above as `VOICE-01..04`. Original v2 entries kept for history:
- ~~**VOICE-01**: AI voiceover generation using ElevenLabs TTS with Instructor voice clone~~ → free/local Kokoro+Chatterbox, paid behind adapter
- ~~**VOICE-02**: Word-level timestamp alignment~~ → promoted
- ~~**VOICE-03**: Audio-driven scene duration adjustment~~ → promoted

### Content Freshness Automation — ⮝ PROMOTED to v1 (2026-05-23)

Promoted as `FRESH-01..03` (content-hashed regeneration DAG) above:
- ~~**FRESH-01/02/03**~~ → promoted (FRESH-02 re-scoped from vendor-doc approval to per-element targeted regeneration)

### Teaching Philosophy — ⮝ PARTIALLY PROMOTED (2026-05-23, unblocked by transcripts)

- **PHILO-01**: Encode Instructor's teaching philosophy → realized as `STYLE-01` (extracted STYLE.md) + script-generator system prompts (`SCRIPT-01`)
- **PHILO-02**: Curriculum auto-generation pipeline → realized as `OUTLINE-01` + `SCRIPT-01` + `PLAN-01` (outline → script → scene-plan)

### Use Case Content

- **USECASE-01**: Use case content ingestion from community sources (YouTube walkthroughs, Reddit threads, developer forums, practitioner blogs) — distinct from vendor doc scraping in CONT-06
- **USECASE-02**: Curated creator tracking (public practitioners) for course-relevant use case examples

### Chatbot Enhancements

- ~~**CHAT-04**: Moved to v1 requirements (Phase 8)~~

### Scaling

- **SCALE-01**: Batch rendering pipeline for multiple lessons from content repository
- **SCALE-02**: Content-to-storyboard auto-generation from structured content + Instructor's teaching philosophy (depends on PHILO-01)
- **SCALE-03**: Multi-language/localization support (English-only for v1)

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI avatar / talking head videos | Conflicts with warm-minimalist brand; uncanny valley risk; Sample Academy uses motion graphics, not digital people |
| Custom LMS / leaving Teachable | Multi-year distraction; Teachable handles enrollment, payments, hosting, adaptive streaming |
| Live streaming / real-time content | Course is async self-paced; live sessions happen on existing tools (Zoom) |
| Interactive in-video quizzes | Teachable player doesn't support overlays; use Teachable's native quiz features instead |
| Adaptive learning / personalized paths | a later-stage feature; adds operational complexity that conflicts with "minimal human intervention" |
| SCORM/xAPI packaging | Teachable doesn't use SCORM; wasted effort |
| Admin dashboard / CMS | Git-based workflow sufficient for v1; premature UI build |
| Manual video editing workflows | System must be code-driven and automatable — no Premiere Pro or After Effects in the loop |
| Teachable embedded widget for chatbot | Teachable doesn't support custom widgets; chatbot is standalone |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Complete (01-01) |
| INFRA-02 | Phase 1 | Complete (01-01) |
| INFRA-03 | Phase 1 | Complete (01-01) |
| INFRA-04 | Phase 1 | Complete (01-04) |
| INFRA-05 | Phase 1 | Complete (01-02) |
| INFRA-06 | Phase 1 | Complete (01-03) |
| VERI-01 | Phase 1 | Complete (01-02) |
| VERI-02 | Phase 1 | Complete (01-01) |
| VERI-03 | Phase 1 | Complete (01-04) |
| VERI-04 | Phase 1 | Complete (01-03) |
| ANIM-01 | Phase 2 | Deferred (awaiting Instructor) |
| ANIM-02 | Phase 2 | Deferred (awaiting Instructor) |
| ANIM-03 | Phase 2 + 9 | Partial — schemas done (Phase 3), components in Phase 9 |
| ANIM-04 | Phase 2 | Deferred (awaiting Instructor) |
| ANIM-05 | Phase 2 | Deferred (awaiting Instructor) |
| ANIM-06 | Phase 2 | Deferred (awaiting Instructor) |
| ANIM-07 | Phase 2 | Deferred (awaiting Instructor) |
| ANIM-08 | Phase 9 | Pending |
| CONT-01 | Phase 3 | Complete (03-03, 03-04) |
| CONT-02 | Phase 3 | Complete (03-03, 03-04) |
| CONT-03 | Phase 3 | Complete (03-03, 03-04) |
| CONT-04 | Phase 3 | Complete (03-05) |
| CONT-05 | Phase 3 | Complete (03-05) |
| CONT-06 | Phase 4 | Complete (04-01 through 04-05) |
| CONT-07 | Phase 6 | Pending |
| CONT-08 | Phase 6 | Pending |
| TRAN-01 | Phase 4 | Deferred (per CONTEXT.md) |
| CHAT-01 | Phase 7 | Scaffold in Phase 5, RAG grounding in Phase 7 |
| CHAT-02 | Phase 7 | Parsing in Phase 5, verification in Phase 7 |
| CHAT-03 | Phase 5 | Complete (05-01) |
| CHAT-04 | Phase 8 | Pending (moved from v2) |
| CHAT-05 | Phase 8 | Pending |
| CHAT-06 | Phase 7 | Pending |
| DEMO-01 | Phase 10 | Pending |
| PHILO-01 | Phase 11 | Blocked on Instructor |
| PHILO-02 | Phase 11 | Blocked on Instructor |
| SCALE-01 | Phase 11 | Blocked on Instructor |

**Coverage:**
- v1 requirements: 34 total (7 new from gap audit)
- Mapped to phases: 34
- Unmapped: 0

---
*Requirements defined: 2026-05-13*
*Last updated: 2026-05-15 after gap audit — 6 new phases added, CHAT-01/02 re-opened, CHAT-04 moved from v2*
