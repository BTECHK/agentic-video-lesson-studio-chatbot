---
phase: 06-content-viewer-v2
plan: 02
status: complete
started: 2026-05-15
completed: 2026-05-15
---

# Summary: Comparison Page with Benchmarks and Editorial Picks

## What Was Done

- Created /content/compare route with side-by-side tool comparison (max 3 tools)
- Built static benchmark data layer (LMSYS Arena ELO, Artificial Analysis quality/speed/price) for all 12 tools
- Built editorial "best for X" picks (8 categories: research, coding, creative writing, file analysis, conversation, image generation, budget, autonomous tasks)
- Added ComparisonTable component with benchmark rows and capability checkmarks
- Added ComparisonPage client component with tool selector pills and FIFO selection
- Added "Compare" tab to TopNav

## Files Created

- chatbot/src/lib/benchmarks.ts (BenchmarkEntry type + static data for 12 tools)
- chatbot/src/lib/editorial.ts (EditorialPick type + 8 curated picks)
- chatbot/src/components/ComparisonTable.tsx
- chatbot/src/components/ComparisonPage.tsx
- chatbot/src/app/content/compare/page.tsx

## Files Changed

- chatbot/src/components/TopNav.tsx (added Compare tab)

## Decisions

- Benchmark data is static (no external API calls) — values are directionally correct approximations from May 2025 public leaderboards
- Default comparison shows ChatGPT, Claude, Gemini (top 3 P0 models)
- Max 3 tools compared simultaneously with FIFO replacement

## Verification

- TypeScript compiles clean
- Next.js build succeeds, /content/compare route renders
- Visual verification approved 2026-05-15
