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
- [ ] **CONT-04**: Content-to-scene mapping metadata linking content nodes to specific video sections
- [ ] **CONT-05**: Zod-validated content schemas catching structural errors before render

- [ ] **CONT-06**: Web scraping/research system that periodically discovers new AI tool developments and updates from vendor docs, changelogs, and support pages — minimal API key usage, agent-driven

### Chatbot Support

- [ ] **CHAT-01**: RAG-grounded TA chatbot answering from course content repository with verified, current information
- [ ] **CHAT-02**: Source citations in every response (which lesson/module/tool the answer references)
- [ ] **CHAT-03**: Standalone web application (separate from Teachable) with its own frontend

### Transcription

- [ ] **TRAN-01**: Video transcription pipeline (FFmpeg audio extraction + Whisper/AssemblyAI) capable of handling files up to 2.5GB

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Voiceover System

- **VOICE-01**: AI voiceover generation using ElevenLabs TTS with Instructor voice clone
- **VOICE-02**: Word-level timestamp alignment syncing narration to animation frames
- **VOICE-03**: Audio-driven scene duration adjustment (scenes stretch/compress to match narration)

### Content Freshness Automation

- **FRESH-01**: Automated change detection diffing vendor docs against stored content
- **FRESH-02**: Human-in-the-loop approval workflow before content updates propagate to video
- **FRESH-03**: Content-change-triggered selective scene re-rendering

### Scaling

- **SCALE-01**: Batch rendering pipeline for multiple lessons from content repository
- **SCALE-02**: Content-to-storyboard auto-generation from structured content + Instructor's teaching philosophy
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
| ANIM-01 | Phase 2 | Pending |
| ANIM-02 | Phase 2 | Pending |
| ANIM-03 | Phase 2 | Pending |
| ANIM-04 | Phase 2 | Pending |
| ANIM-05 | Phase 2 | Pending |
| ANIM-06 | Phase 2 | Pending |
| ANIM-07 | Phase 2 | Pending |
| CONT-01 | Phase 3 | Complete (03-03, 03-04) |
| CONT-02 | Phase 3 | Complete (03-03, 03-04) |
| CONT-03 | Phase 3 | Complete (03-03, 03-04) |
| CONT-04 | Phase 3 | Pending |
| CONT-05 | Phase 3 | Pending |
| CONT-06 | Phase 4 | Pending |
| TRAN-01 | Phase 4 | Pending |
| CHAT-01 | Phase 5 | Pending |
| CHAT-02 | Phase 5 | Pending |
| CHAT-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-05-13*
*Last updated: 2026-05-14 after 03-04 completion*
