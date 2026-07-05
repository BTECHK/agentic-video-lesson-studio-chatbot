# Research: Dashboard UX + Video Accessibility + Low-Bandwidth Delivery (2026-07-04)

Source: sonnet research agent (web-sourced). Feeds GOALS-spec (UX/UI, accessibility, performance).

## TOP 8 quick wins (ranked impact/effort)
1. **Captions from TTS script timestamps via `@remotion/captions` → serializeSrt() → .srt upload per Teachable lesson** — near-zero marginal cost, closes hard WCAG gap. Teachable accepts .srt/.vtt per lesson (support.teachable.com/articles/11682456). (remotion.dev/docs/captions)
2. **Verify actual delivered resolution/bitrate on Teachable** (devtools on a published lesson) — third-party source claims ~720p player cap (224p–720p): NEEDS DIRECT VERIFICATION before any pipeline change. 1080p master upload remains correct either way.
3. **Cmd+K command palette in control station** — baseline for internal power tools (Linear/Vercel/GitHub). (925studios Linear breakdown; Superhuman palette guide)
4. **Status-dot health top row (green/amber/red) for render/gate state** — "never a chart where a status dot will do"; hero status → progressive disclosure, 5-9 elements max. (how-to-dashboard.vercel.app)
5. **Audit AmbientGlows/SceneAmbient pulse rates vs WCAG 2.3.1 (≤3 flashes/sec)** — liveliness contract must stay under photosensitivity threshold. (w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold)
6. **Run Teachable auto-captions as a QA diff against our generated .srt** — Coursera/Udemy pattern: auto-caption is draft, review to ≥99%. (teach.udemy.com accessible video)
7. **Empty states + loading skeletons + error boundaries in dashboard once, reused** — the most common "feels unfinished" tell. (dev.to shadcn dashboard 2026)
8. **Dark mode via semantic tokens** (extend tokens.ts discipline to dashboard). (ui.shadcn.com/docs/dark-mode)

## WCAG essentials for our video
- Captions must include speaker ID + sound cues (captions ≠ subtitles). (3playmedia)
- Contrast 4.5:1 normal / 3:1 large text (AA); caption text ≥14-16pt at delivery scale.
- Keyboard-accessible player is Teachable's job; our job = caption file + contrast + flashing.
- Audio description needed only if visual-only info exists (our VO narrates most visuals — verify per scene type).

## Delivery
- Teachable transcodes/ABR-serves; our job = one clean 1080p H.264 master (already true). Bandwidth work is LMS-side.
- Standard ABR rungs if ever self-hosting: 240p/400k, 360p/800k, 540p/1.5M, 720p/2.5M. (mux.com ABR guide)
- Sub-3-min chunking for EdTech: hypothesis only (unsourced).

## Dashboard patterns (production-grade tells)
- 3-row layout: hero KPIs (2s scannable) → narrative charts → detail tables. (vercel guide)
- Keyboard-first philosophy; optimistic UI (why Linear feels instant); 12-col grid, 8px spacing; semantic color ONLY for status.
