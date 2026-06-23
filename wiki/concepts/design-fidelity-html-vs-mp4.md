---
type: concept
title: "Design fidelity: HTML prototype vs Remotion MP4"
tags: [remotion, video, design, color, encoding, claude-design]
sources: []
created: 2026-06-22
updated: 2026-06-22
---

# Design fidelity: HTML prototype vs Remotion MP4

When a design is prototyped in **Claude Design** as a self-contained HTML/React artifact and then re-implemented in **Remotion (TSX)** to render a Teachable-deliverable MP4, the MP4 routinely reads **softer, duller, and less crisp** than the HTML. This page decomposes that gap into its real causes — and establishes that **color is not one of them** for the brand system — so the fix targets the render pipeline, not the tokens.

## The gap is NOT color

The core brand palette is **byte-identical sRGB hex** on both sides (linen `#EDE8E3`, crimson `#8B2635`, charcoal `#1C1C1C`, the tool solids). There is no OKLCH / Display-P3 → sRGB flattening: the brand doc lists OKLCH equivalents but both sides render the hex. Proof: an uncompressed `renderStill` PNG measures CIE2000 **ΔE ≈ 0** against the design hexes (`scripts/_sizzle-color-de.ts`). So token re-binding and color-space conversion are dead ends; the only residual color items are minor accent-gradient stops (e.g. the Gemini blue→purple→pink) and the dark-mode rose.

## The three real causes, in priority order

1. **Resolution / DPI** (usually the biggest). The HTML renders at the display's `devicePixelRatio` (retina ≈ 2× effective); the Remotion output is a flat **1920×1080 raster**. Fix: render the composition at **2× (3840×2160) and downscale to 1080p** (supersampling / SSAA), which recovers most of the perceived crispness.
2. **Codec / encode loss** (MP4 only — absent from the renderStill). h264 **4:2:0 chroma subsampling** desaturates and bleeds saturated edges (worst case: crimson on linen); **CRF/bitrate quantization** adds ringing on Syne edges. Mitigations: lower CRF / higher bitrate, full-range **BT.709** tagging, and `yuv444p` only if the Teachable player accepts it (it often won't). This is *mitigated, never eliminated*.
3. **Implementation + motion parity** (fixable to parity in the renderStill/code). Box-shadow blur/spread/opacity, gradient stops/banding, SVG stroke widths / vector AA, exact px / letter-spacing / radii, and font hinting/AA (Remotion's bundled variable TTF vs the HTML's CDN font). **Motion cannot be diagnosed from stills** — compare the code timing functions (Remotion `spring({damping,mass,stiffness})` / `interpolate()` vs the HTML easing curves and durations).

## The diagnostic seam

Pair an **uncompressed `renderStill` PNG** against the **same-frame MP4 PNG**. Anything already wrong in the renderStill is **fixable implementation**; anything that only degrades in the MP4 is **codec** (mitigate). Always judge color/sharpness from PNGs, never the MP4; judge motion from code, never stills. The ready-made review bundle (paired frames + both source trees + tokens + a Claude-Design review prompt) lives in `claude-design-delta/`.

## Why not /design-sync

`/design-sync` imports a *UI component library* (Storybook or an esbuild-bundlable package → compiled components the design agent renders). This repo is a video pipeline; the scene components are frame-driven (`useCurrentFrame`/`<Sequence>`) and don't render as standalone UI, so sync structurally bows out. To keep Claude Design on-brand, ship a **context bundle** (`tokens.css` + guidelines) instead — see `claude-design-context/` and `.design-sync/NOTES.md`.

## Where this fits

- The renderStill-vs-MP4 color proof (ΔE ≈ 0) was first measured on the sizzle reel.
- [[layout-integrity-gate]] — the sibling DOM-measured "did it render correctly" gate.
