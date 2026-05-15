# Content Viewer — Design Spec

## Overview

A browsable frontend for the AI tool content repository, added as routes in the existing chatbot Next.js app. Lets users view all 12 tracked AI tools in tile or list layout, drill into capability details, and ask questions via a floating Tutor chat widget.

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Chatbot (existing, unchanged) |
| `/content` | Content index — tile/list grid of all tools |
| `/content/[toolId]` | Tool detail — capabilities, pricing, sources, history |

## Navigation

Top bar with two tabs: **Chat** and **Content**. Brand-consistent: `--bg-base` background, Syne font, `--accent` underline on active tab. Shared across all pages via root layout.

## Content Index (`/content`)

- **Header**: "AI Tools Repository", tool count, last-updated date
- **View toggle**: Tile (grid) vs. List (compact rows)
- **Filters**: Priority (All/P0/P1), capability category dropdown
- **Tile card**: Tool name, vendor, priority badge, capability count (e.g. "9/11 supported"), truncated description
- **List row**: Same data in a single compact line
- **Click**: Navigates to `/content/[toolId]`

## Tool Detail (`/content/[toolId]`)

- **Back link** to index
- **Header**: Tool name, vendor, URL, priority badge, full description
- **Capability grid**: All 11 categories with supported/unsupported indicator
- **Expandable sections** (accordion): Per-category sub-features, limitations
- **Pricing table**: Tier cards side by side
- **Version history**: Timeline of changes
- **Sources**: Linked source URLs from `content/sources/*.json`

## Floating Chat Widget

Bottom-right corner on `/content` pages. Collapsed: accent-colored circle. Expanded: 350x500px chat panel reusing existing ChatInterface components. Same API backend, contextually useful for querying the content repo.

## Data Source

Static reads from `content/tools/*.json` and `content/sources/*.json`. No database. Server components read JSON at request time.

## Brand Compliance

All existing tokens: `--bg-base` (#EDE8E3), `--accent` (#8B2635), `--text` (#1C1C1C), `--radius` (4px), Syne font. Inline styles with CSS variables matching existing component patterns.

## Components to Build

1. `TopNav` — tab navigation (Chat/Content)
2. `ContentIndex` — grid/list with filters and view toggle
3. `ToolCard` — tile view card
4. `ToolRow` — list view row
5. `ToolDetail` — full tool page with accordion sections
6. `CapabilityBadge` — supported/unsupported indicator
7. `PricingTable` — tier comparison
8. `ChatWidget` — floating collapsible chat panel
9. `ViewToggle` — tile/list switch control
10. `FilterBar` — priority + capability filters

## Success Criteria

1. `/content` renders all 12 tools from JSON files
2. Tile/list toggle works without page reload
3. Filters narrow visible tools correctly
4. Tool detail page shows all capability data, pricing, sources
5. Chat widget opens/closes and sends messages
6. Brand-consistent with existing chatbot pages
