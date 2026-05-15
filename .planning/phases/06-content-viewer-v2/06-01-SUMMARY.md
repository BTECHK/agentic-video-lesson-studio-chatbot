---
phase: 06-content-viewer-v2
plan: 01
status: complete
started: 2026-05-15
completed: 2026-05-15
---

# Summary: Labels, Multi-Select Filtering, Soft-Bubble Styling

## What Was Done

- Priority badges changed from raw "P0"/"P1" to "Essential"/"Supplementary" across ToolCard, ToolRow, ToolDetail
- FilterBar converted from single-select dropdown to multi-select tag pills with OR-based filtering logic
- CapabilityAccordion features styled as green-tinted soft bubbles, limitations as red-tinted soft bubbles
- Added design tokens to globals.css: --feature-bg, --feature-border, --feature-text, --limitation-bg, --limitation-border, --limitation-text

## Files Changed

- chatbot/src/app/globals.css (new tokens)
- chatbot/src/components/FilterBar.tsx (multi-select rewrite)
- chatbot/src/components/ContentIndex.tsx (string[] state, OR filter logic)
- chatbot/src/components/ToolCard.tsx (priority label)
- chatbot/src/components/ToolRow.tsx (priority label)
- chatbot/src/components/ToolDetail.tsx (priority label)
- chatbot/src/components/CapabilityAccordion.tsx (soft-bubble styling)

## Decisions

- Priority labels use "Essential"/"Supplementary" (user-friendly) while internal values remain P0/P1
- OR logic for multi-select: tools matching ANY selected capability appear

## Verification

- TypeScript compiles clean
- Next.js build succeeds
- Visual verification approved 2026-05-15
