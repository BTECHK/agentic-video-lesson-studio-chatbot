# Phase 6: Content Viewer V2 - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning
**Source:** Gap audit session decisions (approved by user)

<domain>
## Phase Boundary

Polish the existing content viewer with user-friendly labels, multi-select capability filtering, Apple iOS-style soft-bubble visual distinction for features vs limitations, and a new comparison page at /content/compare with benchmark data from open sources and editorial "best for X" recommendations.

All work is in the `chatbot/` subdirectory. The content viewer already exists and works — this phase enhances it.

</domain>

<decisions>
## Implementation Decisions

### Labels & Display
- P0/P1 labels → "P0 Models"/"P1 Models" (or similar user-friendly suffix) — raw P0/P1 alone not intuitive to end users
- Priority badges in ToolCard.tsx and ToolRow.tsx need updated display text

### Filtering
- Capability filtering changes from single-select dropdown to multi-select (user can filter by multiple capabilities simultaneously)
- FilterBar.tsx needs multi-select UI replacing the current single `<select>`
- Filter logic in ContentIndex.tsx: tool shows if it supports ANY of the selected capabilities (OR logic)

### Visual Styling
- Features vs limitations in CapabilityAccordion.tsx: Apple iOS soft-bubble styling
- Features: soft green-tinted bubble background
- Limitations: soft red/muted-tinted bubble background
- Must align with existing design tokens (var(--accent), var(--bg-card), etc.)
- 4px radius maintained everywhere

### Comparison Page
- New route: /content/compare
- Side-by-side comparison of 2-3 selected tools
- Data sources: benchmark scores from open sources (LMSYS Chatbot Arena, Artificial Analysis)
- Editorial "best for X" recommendations based on curated capability data
- Price comparison where available
- Navigation: tab or link from content index page

### Claude's Discretion
- Exact multi-select UI pattern (chips, checkboxes, tag-pills)
- Comparison page layout details
- How benchmark data is stored (static JSON vs fetched)
- Whether comparison shows all 11 capabilities or subset

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Content Viewer Components
- `chatbot/src/components/FilterBar.tsx` — Current filter implementation (single dropdown)
- `chatbot/src/components/ContentIndex.tsx` — Main index with filter logic
- `chatbot/src/components/ToolCard.tsx` — Tile view card with P0/P1 badge
- `chatbot/src/components/ToolRow.tsx` — List view row with P0/P1 badge
- `chatbot/src/components/CapabilityAccordion.tsx` — Features/limitations display (140 lines)
- `chatbot/src/components/ToolDetail.tsx` — Full tool detail page (217 lines)

### Data Layer
- `chatbot/src/lib/content.ts` — getAllTools(), getToolById()
- `chatbot/src/lib/content-types.ts` — ToolData interface with priority field

### Design System
- `chatbot/src/app/globals.css` — CSS variables (brand tokens)

</canonical_refs>

<specifics>
## Specific Ideas

- Soft-bubble styling reference: Apple iOS system messages, rounded pill shapes with tinted backgrounds
- Benchmark sources: LMSYS Chatbot Arena (https://chat.lmsys.org), Artificial Analysis (https://artificialanalysis.ai)
- "Best for X" categories: research, coding, creative writing, file analysis, conversation, image generation
- Comparison should work without API calls — use static/cached benchmark data

</specifics>

<deferred>
## Deferred Ideas

- Quick-compare checkboxes on the content index page (backlog for later)
- Dynamic benchmark data fetching (use static for now)
- Price comparison API integration (use manually curated pricing data)

</deferred>

---

*Phase: 06-content-viewer-v2*
*Context gathered: 2026-05-15 via gap audit decisions*
