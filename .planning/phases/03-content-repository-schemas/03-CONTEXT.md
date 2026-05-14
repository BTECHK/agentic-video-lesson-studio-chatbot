# Phase 3: Content Repository & Schemas - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

A structured, validated, Git-versioned knowledge base of AI tool capabilities that maps directly to video scenes. Includes animation architecture prep (JSON content loader, Zod lesson schema, scene type dispatcher) so Phase 2 can execute immediately when content arrives. This phase delivers the data layer and schema infrastructure — not the scraping/ingestion pipeline (Phase 4) or the chatbot (Phase 5), though both consume this data.

</domain>

<decisions>
## Implementation Decisions

### Tool Knowledge Base Organization
- **D-01:** One JSON file per tool — e.g. `content/tools/chatgpt.json`, `content/tools/claude.json`. Each file contains all 11 capability categories for that tool.
- **D-02:** All 12 tools (P0 + P1) fully populated with real data from day one. No stubs, no placeholder content. P0: ChatGPT, Claude, Gemini, Perplexity, Codex, Claude Code, Cowork. P1: Grok, DeepSeek, Qwen, Comet, Manus.
- **D-03:** The 11 capability categories are a fixed Zod enum: writing-chat, research, file-analysis, document-creation, image-generation, prototyping, personalization, persistent-context, agents, connectors, dictation. Adding a category requires a schema change.
- **D-04:** Each tool's capability entry contains a full feature breakdown: sub-features, limitations, pricing tier differences, version history. Deep technical detail — not just ratings and summaries.

### Source Attribution Model
- **D-05:** Source citations live in separate bibliography files, one per vendor — e.g. `content/sources/openai.json`, `content/sources/anthropic.json`. Tool files reference sources by ID (e.g. `"sourceRef": "openai-models"`).
- **D-06:** Git history is the source of truth for freshness tracking. No `verifiedAt` or `lastCheckedAt` fields in source entries. `git log` on source files determines when each source was last verified. Source entries contain: URL, title, and a stable ID.
- **D-07:** Per-vendor source files align with Phase 4 scrapers — each scraper updates one vendor's sources at a time.

### Content-to-Scene Mapping
- **D-08:** Claude's discretion — the mapping from content nodes to video scenes (CONT-04) is a technical design decision. The design system's scene catalog (`03-scene-catalog.md`) defines scene types with content schemas. The mapping should enable "tool X changed → these scenes need re-rendering."

### Animation Architecture Prep
- **D-09:** Claude's discretion — the scope and implementation of the JSON content loader, Zod lesson schema, and scene type dispatcher. The Claude Design session's `05-content-schema.md` and `03-scene-catalog.md` define the contracts. The existing `SceneConfig` interface in `src/lib/types.ts` and scene components in `src/compositions/scenes/` establish the pattern.

</decisions>

<specifics>
## Specific Ideas

- Full feature breakdowns per tool capability should make the chatbot (Phase 5) authoritative — learners get deep, cited answers, not shallow summaries
- The per-vendor source file structure mirrors how AI vendors organize their own documentation — natural for scrapers to target
- 12 tools × 11 capabilities = 132 capability entries with full detail. This is a substantial data population effort but produces a genuinely comprehensive knowledge base
- The design system's scene types (capability-table, tool-card-reveal, comparison-chats) directly consume this tool data — the schema must produce data these scenes can render

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Animation Design System (LOCKED)
- `Claude design work in session-SampleAcademy/animated-lesson-skill/references/05-content-schema.md` — JSON lesson schema (v1.0), field reference, timing constraints, versioning rules
- `Claude design work in session-SampleAcademy/animated-lesson-skill/references/03-scene-catalog.md` — 13 scene types with content schemas, beat timing, and visual notes
- `Claude design work in session-SampleAcademy/animated-lesson-skill/references/04-component-api.md` — Component primitives API
- `Claude design work in session-SampleAcademy/animated-lesson-skill/references/01-brand-system.md` — Brand tokens and design system
- `Claude design work in session-SampleAcademy/animated-lesson-skill/references/02-motion-contract.md` — Motion/animation contract

### Project Context
- `.planning/REQUIREMENTS.md` — CONT-01 through CONT-05 define this phase's requirements
- `.planning/ROADMAP.md` — Phase 3 success criteria (6 items) and animation architecture prep scope

### Existing Code
- `src/brand/tokens.ts` — Brand constants (colors, font, radius, video dimensions)
- `src/lib/types.ts` — SceneConfig interface (name, durationInFrames)
- `src/compositions/scenes/` — Existing scene components (TypographyScene, BrandElementsScene, MotionTestScene) establishing the Remotion component pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/brand/tokens.ts`: BRAND constant with colors, font config, radius, video dimensions — reuse for content validation (e.g., checking brand compliance in generated scenes)
- `src/lib/types.ts`: SceneConfig interface — extend for the full scene type system from the design catalog
- Existing scene components in `src/compositions/scenes/`: pattern for how Remotion scenes are structured (React components with frame-based animation)

### Established Patterns
- TypeScript with strict types throughout
- Remotion compositions as React components
- Brand tokens as a typed constant object
- Docker two-service architecture (dev + render)

### Integration Points
- New content JSON files will be consumed by Remotion compositions via the scene type dispatcher
- Zod schemas validate content at build time before render
- Source files feed into Phase 4 (freshness scrapers) and Phase 5 (chatbot RAG)
- The scene type dispatcher maps JSON `type` fields to Remotion scene components

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-content-repository-schemas*
*Context gathered: 2026-05-13*
