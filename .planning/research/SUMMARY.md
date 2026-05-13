# Project Research Summary

**Project:** Sample Academy -- AI Content System
**Domain:** AI EdTech Content Pipeline + Programmatic Video Generation
**Researched:** 2026-05-13
**Confidence:** HIGH

## Executive Summary

Sample Academy needs a content-driven video pipeline that transforms structured AI tool knowledge into polished, brand-consistent animated videos for Teachable delivery. The expert approach for this type of system is a code-driven composition framework (not manual video editing) where content lives in structured data, animations are parameterized React components, and rendering happens headlessly in Docker. Remotion is the clear technology choice -- it renders a full DOM via headless Chrome, meaning the existing CSS-based brand system (Syne font, warm linen palette, 4px radius, custom easing) transfers directly into video compositions with zero translation effort. Motion Canvas and Revideo were evaluated and rejected because their canvas-only rendering would require manually reimplementing every CSS concept.

The recommended approach is to build the stakeholder demo video first using Remotion with a hand-written storyboard JSON, but with a minimal architectural discipline that makes the prototype scalable: each scene is a props-driven React component, content is separated from animation code, and voiceover timing metadata is included from day one even though audio is deferred. After the demo proves the animation quality, the system formalizes into a content repository (Markdown + YAML in Git), a storyboard generator, and eventually voiceover integration via ElevenLabs TTS with WhisperX word-level alignment. The RAG chatbot and content freshness engine are separate concerns that share the content repository but have no dependency on the video pipeline.

The key risks are: (1) choppy "slideshow" animations that fail to meet the Anthropic Cowork quality bar -- mitigated by using Remotion spring physics exclusively and building one hero scene for approval before scaling; (2) Docker rendering diverging from local preview -- mitigated by using Debian Bookworm (never Alpine), proper Chrome dependencies, and WSL2 filesystem storage on Windows; (3) timeline pressure causing throwaway architecture -- mitigated by enforcing a minimal content/storyboard/animation separation even in the prototype, spending 20% of time on structure and 80% on visual polish.

## Key Findings

### Recommended Stack

Remotion v4 is the animation framework, chosen for its full DOM rendering (CSS, SVG, web fonts work natively), 60K weekly npm downloads, official Docker documentation, and React-based composition model. The brand system maps directly to CSS variables consumed by Remotion components. Animation physics use Remotion built-in spring() and interpolate() functions with flubber for SVG path morphing. Content is managed as JSON/Markdown files in Git with Zod schema validation. ElevenLabs (deferred) is the voiceover provider for its voice cloning capability and highest quality scores (MOS 4.3).

**Core technologies:**
- **Remotion 4.0.x**: Programmatic video composition and MP4 rendering -- full DOM rendering means CSS brand system works directly
- **@remotion/google-fonts + @remotion/transitions**: Font loading (Syne) and scene transitions -- render-blocking font load prevents fallback; TransitionSeries for smooth scene changes
- **TypeScript + Zod + JSON-in-Git**: Content management and validation -- type-safe schemas catch structural errors before render, Git provides versioning
- **Docker (node:22-bookworm-slim)**: Containerized headless rendering -- official Remotion base image, never Alpine
- **ElevenLabs TTS (deferred)**: AI voiceover with voice cloning -- highest quality, Instructor voice can be cloned for brand consistency
- **FFmpeg 6.x**: Video post-processing -- scene concatenation, audio muxing, format validation

### Expected Features

**Must have (table stakes):**
- Smooth, fluid animation with natural easing (spring physics, not linear interpolation) -- the stakeholder demo bar
- 1080p MP4 output at 30fps, under 2GB for Teachable upload
- Brand-consistent visual design applied via CSS variables (Syne, warm linen palette, Crimson accent)
- Scene-based composition architecture enabling selective re-rendering
- Deterministic rendering (same input produces same output)
- One polished Module 1 video demonstrating animation quality, code-driven pipeline, and pedagogical effectiveness

**Should have (differentiators):**
- Reusable animation component library (parameterized scene types: intro, concept, demo, comparison, summary)
- Visual tethers connecting concept states (Anthropic Cowork signature technique)
- Voiceover-ready timing metadata baked into storyboard from day one
- Content freshness engine (automated vendor doc monitoring + surgical content updates)
- RAG-grounded TA chatbot answering from course content, not generic LLM knowledge

**Defer (v2+):**
- Multi-language/localization (English-only for v1, schema designed for extensibility)
- Adaptive learning / personalized paths (a later-stage feature)
- Interactive in-video quizzes (Teachable player does not support overlays)
- AI avatar / talking head (conflicts with the animation-first approach)
- Custom LMS / leaving Teachable (multi-year distraction)
- Admin dashboard (Git-based workflow sufficient for v1)

### Architecture Approach

The system is a content-driven video pipeline with five subsystems connected through a JSON-based storyboard contract. Content flows from a Markdown + YAML repository through a storyboard generator, into Remotion React compositions, out through headless Chrome rendering to MP4. Services communicate via shared filesystem volumes (not HTTP APIs) for simplicity, debuggability, and idempotency. The chatbot is the only HTTP service, using ChromaDB for vector search over the same content repository.

**Major components:**
1. **Content Repository** -- Markdown + YAML files in Git storing AI tool knowledge, lesson structures, and teaching philosophy
2. **Storyboard Generator** -- Node.js CLI that transforms lesson content into scene-by-scene JSON (the central data contract)
3. **Animation Engine** -- Remotion React compositions consuming storyboard JSON with brand CSS variables
4. **Video Renderer** -- Headless Chrome + FFmpeg in Docker producing 1080p H.264 MP4
5. **Voiceover Generator** (deferred) -- ElevenLabs TTS producing audio + word-level timestamps for animation sync
6. **RAG Chatbot** (separate track) -- LangChain + ChromaDB grounded in the content repository

### Critical Pitfalls

1. **Choppy slideshow animations** -- Use Remotion spring() exclusively (damping 12-15, mass 0.8-1.2), animate only transform and opacity, build one hero scene for approval before scaling. This is the single biggest stakeholder demo risk.
2. **Docker rendering diverges from local preview** -- Set --shm-size=2g, use node:22-bookworm-slim (never Alpine), install all Chrome dependencies, store project in WSL2 filesystem for 20x better I/O on Windows.
3. **Teachable 2GB file size limit** -- Target CRF 23 with --video-bitrate 5M cap, split long modules into 5-7 minute sub-lessons, add post-render size validation.
4. **Syne font renders as system fallback** -- Use @remotion/google-fonts/Syne with explicit weight filtering at module top level, also install font files locally in Docker container as backup.
5. **Timeline pressure produces throwaway architecture** -- Enforce minimal content/storyboard/animation separation from scene one. Props-driven components, timeline.json structure, three-layer split. Spend 20% on structure, 80% on polish.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Environment + Animation Engine + Stakeholder Demo

**Rationale:** The stakeholder demo is the immediate critical path. Everything else is infrastructure that pays off at scale but is not needed for one prototype video. However, the prototype must establish the architectural pattern (props-driven components, storyboard JSON, brand system) that all future phases build on.

**Delivers:** Working Remotion project in Docker, brand system in CSS variables, 5-6 reusable scene type components (intro, concept, demo, comparison, summary), hand-authored Module 1 storyboard JSON, polished Module 1 MP4 video.

**Addresses features:** Smooth fluid animation, brand consistency, scene-based composition, 1080p MP4 output, deterministic rendering, stakeholder demo video.

**Avoids pitfalls:** Choppy animations (#1), Docker rendering divergence (#2), Windows filesystem penalty (#6), font fallback (#4), throwaway architecture (#5), file size limit (#3).

### Phase 2: Content Repository + Storyboard Generator

**Rationale:** Now that the animation engine works and the storyboard JSON contract is proven by the prototype, automate the input side. This is what makes the system scalable beyond one module. The storyboard generator must produce the exact JSON format that Phase 1 consumes.

**Delivers:** Structured Markdown + YAML content repository for AI tool knowledge, Zod-validated content schemas, automated storyboard generation from content, content-to-video pipeline for multiple modules.

**Addresses features:** Structured AI tool knowledge base, capability-by-tool matrix, content versioning, official source attribution, content-to-scene mapping.

**Avoids pitfalls:** Content stored in code (anti-pattern #4), over-engineering into CMS (#9).

### Phase 3: Voiceover Integration

**Rationale:** The visual pipeline must work before adding audio. Audio timing changes scene durations, so the animation engine must already handle variable durations gracefully. Narration scripts from the content repository (Phase 2) feed the TTS system.

**Delivers:** ElevenLabs TTS generation with Instructor cloned voice, WhisperX word-level timestamps, audio-driven scene durations, narrated videos with synced animations.

**Addresses features:** Voiceover-ready timing metadata (designed in Phase 1, implemented here), AI voiceover generation.

**Avoids pitfalls:** Voiceover retrofit breaking animation timing (#8) -- mitigated by designing flexible hold states and narration scripts from Phase 1.

### Phase 4: Content Freshness Engine

**Rationale:** Only worth building after the forward pipeline (content to video) is proven. The update pipeline is the same pipeline run in reverse-diff mode. Requires the content repository from Phase 2 and scene-level rendering from Phase 1.

**Delivers:** Automated vendor doc monitoring, change detection and diffing, human-in-the-loop approval workflow, surgical content updates, selective scene re-rendering.

**Addresses features:** Automated changelog monitoring, surgical content updates, content-change-triggered video regeneration.

**Avoids pitfalls:** Over-engineering into CMS (#9) -- starts with detection-only automation, manual approval required.

### Phase 5: RAG Chatbot (TA + Office Hours)

**Rationale:** Entirely independent of the video pipeline. Shares only the content repository (Phase 2). Can be built in parallel with Phases 3-4 if resources allow.

**Delivers:** RAG-grounded TA chatbot for learner support, course-content-scoped responses with source citations, deployable web widget.

**Addresses features:** TA chatbot grounded in course content, cross-tool capability comparison, 24/7 availability.

### Phase Ordering Rationale

- **Phase 1 before all else:** Stakeholder demo is days away, and the storyboard JSON contract defined by the prototype becomes the interface that every other component targets.
- **Phase 2 before 3-5:** Content repository is a shared dependency for storyboard generation, voiceover scripts, content freshness, and chatbot RAG. Building it second lets Phase 1 inform the schema design with real production experience.
- **Phase 3 before 4:** Voiceover adds the narration layer to existing videos. Content freshness (Phase 4) benefits from the full pipeline being in place so re-rendered scenes include voiceover.
- **Phase 5 is independent:** The chatbot only needs the content repository. It can run in parallel with any phase after Phase 2.
- **This ordering avoids the demo mode trap (#5):** Phase 1 establishes architecture, Phase 2 automates it, Phases 3-5 extend it. No rework required.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (animation scenes):** The specific scene types and animation choreography need design iteration. Research the Remotion Timing Editor and spring parameter tuning for each scene type.
- **Phase 3 (voiceover integration):** WhisperX word-level timestamp alignment with Remotion is a novel integration pattern -- needs prototype validation. ElevenLabs voice cloning setup and pricing at scale need investigation.
- **Phase 4 (content freshness):** Vendor doc scraping approaches vary by provider (OpenAI changelog vs Anthropic docs vs Google release notes). Detection-vs-rewriting boundary needs scoping.

Phases with standard patterns (skip research-phase):
- **Phase 2 (content repository):** JSON/Markdown in Git with Zod validation is a well-documented pattern. Storyboard generator is straightforward transformation logic.
- **Phase 5 (RAG chatbot):** LangChain + ChromaDB + OpenAI embeddings is a thoroughly documented pattern with extensive tutorials and reference implementations.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Remotion verified via Context7 (benchmark 90.59), official docs, npm registry. All core packages confirmed available. Licensing terms clear. |
| Features | HIGH | Feature priorities validated against stakeholder context, Teachable constraints, and project brief. Clear critical path (demo video) vs. infrastructure (pipeline). Anti-features well-defined. |
| Architecture | HIGH | Storyboard JSON contract is well-designed. Docker Compose service separation follows standard patterns. Shared-volume communication is appropriate for this pipeline topology. |
| Pitfalls | HIGH | Top pitfalls verified against official Remotion docs, Docker performance reports, and Teachable file limits. Phase-specific warnings are actionable. |

**Overall confidence:** HIGH

### Gaps to Address

- **WhisperX + Remotion integration:** No known reference implementation for word-level timestamp-driven animation sync. Needs a proof-of-concept in Phase 3 before committing to the approach. Fallback: AssemblyAI API which provides timestamps without local infrastructure.
- **ElevenLabs voice cloning quality:** Voice cloning from Instructor audio samples needs testing to confirm quality matches native ElevenLabs voices. If quality is insufficient, pivot to a curated stock voice.
- **Windows Docker performance reality:** WSL2 filesystem storage is recommended but the project is currently on Windows desktop path. Migration to WSL2 filesystem should happen in Phase 1 environment setup to avoid the 10-20x I/O penalty.
- **Remotion licensing:** Sample Academy employee count determines whether a paid company license is needed. Verify during Phase 1 setup.
- **Conversation video transcription:** Large source recordings contain critical context. Transcription should happen in parallel with Phase 1 using silence-point chunking and local Whisper or a service like AssemblyAI.

## Sources

### Primary (HIGH confidence)
- [Remotion Official Docs](https://www.remotion.dev/docs/) -- animation framework, Docker, fonts, spring physics, encoding
- [Remotion Context7 Library ID: /remotion-dev/remotion](https://context7.com) -- Benchmark Score 90.59
- [Remotion Docker Guide](https://www.remotion.dev/docs/docker) -- container setup, Chrome dependencies, base image
- [Teachable Content File Types](https://support.teachable.com/en/articles/11682497-content-file-types) -- MP4 constraints, 2GB limit
- [ElevenLabs Documentation](https://elevenlabs.io/docs/overview/intro) -- TTS API, voice cloning, forced alignment
- [Remotion vs Motion Canvas](https://www.remotion.dev/docs/compare/motion-canvas) -- framework comparison

### Secondary (MEDIUM confidence)
- [WhisperX GitHub (17K+ stars)](https://github.com/m-bain/whisperx) -- word-level timestamp extraction
- [CrePal: Remotion Docker Guide](https://crepal.ai/blog/aivideo/blog-how-to-run-remotion-in-docker/) -- Docker performance tips
- [TTS Quality Comparisons (MOS scores)](https://tokenmix.ai/blog/tts-api-comparison) -- ElevenLabs vs OpenAI vs Google
- [RAG Chatbots for Education Survey](https://www.mdpi.com/2076-3417/15/8/4234) -- chatbot architecture patterns
- [Video Automation Pipeline with Remotion](https://dev.to/comlaterra_38/building-a-video-automation-pipeline-with-remotion-and-ai-apis-4i82) -- pipeline patterns

### Tertiary (needs validation)
- WhisperX + Remotion word-level sync integration -- no known reference implementation, needs prototype validation
- ElevenLabs voice cloning from limited audio samples -- quality depends on sample quantity and quality

---
*Research completed: 2026-05-13*
*Ready for roadmap: yes*
