# Phase 3: Content Repository & Schemas - Discussion Log

**Date:** 2026-05-13
**Areas discussed:** Tool Knowledge Base Structure, Source Attribution Model
**Areas skipped:** Content-to-Scene Mapping (Claude's discretion), Animation Architecture Prep Scope (Claude's discretion)

## Tool Knowledge Base Structure

### Q1: Data file organization
- **Options:** One file per tool (Recommended) | One file per capability | Single monolithic file
- **Selected:** One file per tool
- **Notes:** Natural alignment with per-vendor updates and Phase 4 scrapers

### Q2: Tool priority tiers
- **Options:** P0 fully populated + P1 stubs (Recommended) | All tools fully populated | P0 only, no P1
- **Selected:** All tools fully populated
- **Notes:** No stubs — real data for all 12 tools from day one

### Q3: Capability categories schema
- **Options:** Fixed enum of 11 (Recommended) | Open string field
- **Selected:** Fixed enum of 11
- **Notes:** Strict validation via Zod enum, catches typos

### Q4: Capability entry detail level
- **Options:** Rating + summary + claims (Recommended) | Rating + summary only | Full feature breakdown
- **Selected:** Full feature breakdown
- **Notes:** Deep technical detail: sub-features, limitations, pricing tier differences, version history

## Source Attribution Model

### Q5: Citation location
- **Options:** Inline with each claim (Recommended) | Separate bibliography file | Hybrid
- **Selected:** Separate bibliography file
- **Notes:** Clean deduplication — claims reference source IDs, sources live in separate files

### Q6: Source file organization
- **Options:** One per vendor (Recommended) | One global sources.json | Inline in each tool file
- **Selected:** One per vendor
- **Notes:** Aligns with Phase 4 scraper structure (one scraper per vendor)

### Q7: Freshness tracking
- **Options:** verifiedAt per source + staleness threshold (Recommended) | Manual tracking only | Git history as source of truth
- **Selected:** Git history as source of truth
- **Notes:** No redundant date fields — git log determines when sources were last verified

---

*Discussion completed: 2026-05-13*
