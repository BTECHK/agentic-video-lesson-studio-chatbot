# Phase 7: Chatbot Content Grounding - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning
**Source:** Gap audit session decisions (approved by user)

<domain>
## Phase Boundary

Wire the content repository (12 AI tools, 11 capabilities each) into the chatbot's chat route so Tutor answers from curated tool data instead of general Claude knowledge. This is the single biggest gap — the chatbot currently has a UI and can talk to Claude, but is completely disconnected from the content repository.

All work is in the `chatbot/` subdirectory. The content loader (content.ts) and chat route (api/chat/route.ts) both exist — this phase connects them.

</domain>

<decisions>
## Implementation Decisions

### RAG Architecture
- No vector database — content is small enough (12 tools × 11 capabilities) to use keyword/semantic matching + full context injection
- On each chat request, determine which tools/capabilities are relevant to the user's question
- Inject relevant content as structured context in the system prompt (not as separate RAG retrieval step)
- This is "stuffing" approach — works because total content fits within Claude's context window

### Content Injection
- content.ts already has getAllTools() and getToolById() — use these
- Build a content retrieval function that takes a user message and returns relevant tool snippets
- Match against: tool names, vendor names, capability categories, feature descriptions
- Include tool metadata (vendor, URL, priority) in injected context for citation generation

### System Prompt Enhancement
- Extend system-prompt.ts to accept content context parameter
- Replace BOOTSTRAP_ADDENDUM (general knowledge disclaimer) with actual content injection
- Keep Tutor persona and boundaries unchanged
- Add instruction: "Use ONLY the provided tool data to answer. If the question isn't covered by the data, say so."

### Citation Verification
- After LLM responds with citations, verify each cited tool/capability exists in the content repository
- Remove invalid citations before sending to client
- Log unverified citations for monitoring

### API Route Changes
- chat/route.ts: Before calling LLM, load relevant content based on user message
- Pass content context to system prompt builder
- Verify citations in response before returning

### Claude's Discretion
- Exact content matching/ranking algorithm (keyword vs simple contains)
- How much content to inject per request (all relevant tools vs top-N)
- System prompt formatting for injected content
- Whether to show verified/unverified status on citations in UI

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Content Layer (SOURCE)
- `chatbot/src/lib/content.ts` — getAllTools(), getToolById(), getSourcesForVendor()
- `chatbot/src/lib/content-types.ts` — ToolData, ToolCapability interfaces
- `chatbot/content/tools/*.json` — 12 tool data files (the actual content)
- `chatbot/content/sources/*.json` — 11 source bibliography files

### Chat System (TARGET)
- `chatbot/src/app/api/chat/route.ts` — Chat API route (55 lines)
- `chatbot/src/lib/llm/system-prompt.ts` — Tutor persona + system prompt builder (50 lines)
- `chatbot/src/lib/llm/anthropic-provider.ts` — Anthropic API call (40 lines)
- `chatbot/src/lib/llm/types.ts` — LLMRequest/LLMResponse interfaces
- `chatbot/src/lib/citations.ts` — Citation parsing regex (27 lines)
- `chatbot/src/lib/session.ts` — Session store with message history

### Existing Tests
- `chatbot/__tests__/` — 48 existing tests (must not break)

</canonical_refs>

<specifics>
## Specific Ideas

- Content retrieval should be fast (< 50ms) since we're just filtering JSON in memory
- System prompt with full content should stay under 8000 tokens to leave room for conversation
- Citation format stays the same: [Source: Module X, Lesson Y, Tool: ToolName]
- For now, map all content to "Module 1" since that's the only module that exists
- Consider adding a "confidence" field to citations based on whether the cited content was actually in the injected context

</specifics>

<deferred>
## Deferred Ideas

- Vector embeddings for semantic search (overkill for 12 tools)
- Streaming responses (Phase 8 or later)
- Multi-module content organization (when more modules exist)
- Citation UI enhancement showing verified vs unverified (Phase 8)

</deferred>

---

*Phase: 07-chatbot-content-grounding*
*Context gathered: 2026-05-15 via gap audit decisions*
