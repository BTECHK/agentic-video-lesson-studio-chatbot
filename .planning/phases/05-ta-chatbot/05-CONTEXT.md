# Phase 5: TA Chatbot - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

A standalone web application where learners get accurate, source-cited answers grounded in the course content repository. The chatbot ("Tutor") acts as a teaching assistant — answering knowledge questions AND helping with practical tasks like prompt writing and tool setup. This phase delivers the chatbot web app, RAG pipeline, and access control. It does NOT include content ingestion (Phase 4) or content schema definition (Phase 3), though it consumes Phase 3's content repository.

</domain>

<decisions>
## Implementation Decisions

### Access & Audience
- **D-01:** Dual-mode access — open demo (no auth required) + authenticated student mode (access code). Demo is public for stakeholders, marketing, and discovery. Student mode requires an access code shared by Instructor via Teachable enrollment.
- **D-02:** Dev bypass mechanism for access code during development/testing. Environment variable or URL parameter that skips auth so developers don't get blocked during testing.
- **D-03:** Demo content is module-scoped and configurable. Demo mode starts with Module 1 content only. The scope is a configuration setting (not hard-coded) — can be expanded or restricted. Students get full content access across all modules.

### Conversation Boundaries
- **D-04:** Course-first with redirects. Chatbot answers from the course content repository first. When content doesn't cover the question, redirects to specific vendor docs or resources. No generic LLM answers — every response is either grounded in course content or explicitly redirecting to an authoritative external source.
- **D-05:** Knowledge + practical help (full TA mode). Tutor answers knowledge questions AND helps with practical tasks — prompt writing, tool setup guidance, troubleshooting. This is what makes it a teaching assistant, not just a reference bot.
- **D-06:** Multi-turn conversations within session. Chatbot remembers prior messages in the current conversation. Session expires when the tab closes. Follow standard RAG chatbot architecture patterns for session management.
- **D-07:** Gentle redirect for off-topic questions. Politely declines non-AI/non-course questions: "I'm Tutor, your Sample Academy AI assistant — I'm best at helping with AI tools and the course material. What AI topic can I help with?"

### LLM Backend
- **D-08:** Dual LLM backend built in from day one. Two options: (1) Claude Code as passthrough — routes questions through Claude Code for answers, (2) Direct API key — calls the LLM API directly. API key is the fallback since the platform choice isn't locked yet. Both options must be programmed in and switchable via configuration.

### Chatbot Personality
- **D-09:** Friendly, clear tutoring voice. Practical and empowering — like a knowledgeable friend showing you how to do something. Tone calibrated for working professionals.
- **D-10:** Inline citations with expandable details. Source citations appear as clickable references within the response text (e.g., [Module 2, Lesson 3]). Clicking expands to show the full source — lesson name, module, tool, and verification date. Clean reading experience with detail on demand.
- **D-11:** Named TA persona "Tutor." Introduces itself: "Hi, I'm Tutor, your Sample Academy AI teaching assistant." Personal and memorable.

### Claude's Discretion
- RAG architecture and vector store implementation
- Frontend framework and component library choice (must follow brand system)
- Chat UI layout and responsive design (Apple/Google/Anthropic design principles)
- Session storage and memory implementation
- API route design and error handling
- Deployment configuration

</decisions>

<specifics>
## Specific Ideas

- "Tutor" as the TA name
- The tutoring voice should be encoded in the system prompt — friendly, practical, empowering
- The chatbot should feel like texting a knowledgeable friend, not querying a database
- Demo mode is a key stakeholder touchpoint — must be immediately impressive without requiring login
- The dual LLM backend (Claude Code passthrough vs API key) ensures flexibility while the team decides on the long-term platform

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Content Repository (Data Source)
- `.planning/phases/03-content-repository-schemas/03-CONTEXT.md` — Content structure decisions: one JSON per tool, per-vendor source bibliography, Zod validation. This is the data the chatbot RAGs against.
- `.planning/REQUIREMENTS.md` — CHAT-01, CHAT-02, CHAT-03 define this phase's requirements

### Brand & Design
- `src/brand/tokens.ts` — Existing brand constants in code (reuse for chatbot UI consistency)

### Project Context
- `.planning/ROADMAP.md` — Phase 5 success criteria (3 items), dependency on Phase 3, execution order

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/brand/tokens.ts`: BRAND constant with colors, font config, radius — reuse for chatbot UI to maintain brand consistency across the video system and chatbot
- No chatbot-related code exists — this is a standalone app, separate from the Remotion video pipeline

### Established Patterns
- TypeScript with strict types throughout
- Zod for schema validation
- Docker containerized development

### Integration Points
- Phase 3 content repository (`content/tools/*.json`, `content/sources/*.json`) is the RAG data source
- The chatbot is a standalone web app — separate codebase/deployment from the Remotion video pipeline
- Brand tokens should be shared or duplicated to ensure visual consistency

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-ta-chatbot*
*Context gathered: 2026-05-13*
