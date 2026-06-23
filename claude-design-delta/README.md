# claude-design-delta — your guide

Diagnose why the Remotion MP4 looks **softer/duller/less crisp** than the Claude Design HTML, and fix it — **without** touching your animation pipeline.

## This folder
- **`claude-design-delta-upload.zip`** ← drop THIS into Claude Design (or drag the `upload/` files individually).
- **`PROMPT.md`** ← paste this into the Claude Design chat with the upload.
- **`upload/`** ← the 15 essential files (frames + design-side + code-side) + a `00-READ-ME-FIRST.md` manifest.
- This `README.md` ← the steps (below).

## Settled facts (don't re-litigate)
- `/design-sync` doesn't apply (this is a video pipeline, not a component library). Already dismissed.
- **Colors are correct** — byte-identical sRGB hex both sides, renderStill ΔE ≈ 0. No color work needed.
- The gap = **resolution/DPI → codec → implementation → motion**. The whole flow is manual; that's expected.

## Steps
1. **In Claude Design** — open the project that owns the original system. Upload **`claude-design-delta-upload.zip`** (or the `upload/` files). Paste **`PROMPT.md`**. → you get a prioritized punch list (exact value-vs-value + corrected values).
2. **Back in Claude Code** — paste the punch list with the remediation prompt below.
3. **Verify** — re-render, capture a fresh renderStill, compare **PNG ↔ PNG** vs the Design reference. Never judge against the MP4.

## Remediation prompt for Claude Code (values in, pipeline preserved)
```
Here is a prioritized delta/punch list from Claude Design (it authored the original
system). Apply it WITHOUT touching my pipeline's structure, sequencing, components, or
the rules in CLAUDE.md — Design owns VALUES, my pipeline owns IMPLEMENTATION.

1. RENDER CONFIG first (highest leverage): render the Remotion comp at 2x (3840x2160)
   and downscale to 1080p (SSAA); lower CRF / raise bitrate; keep BT.709; try yuv444p
   ONLY if it still plays on Teachable (else yuv420p). Put these in the render scripts.
2. Implementation parity: change only the exact values named in the punch list
   (shadows, gradient stops incl. the Gemini hexes, SVG stroke widths, radii, font AA)
   in the scene components / tokens.
3. Motion: for each easing/duration/spring divergence, feed Design's value into my
   existing motion inputs (convert cubic-bezier <-> spring where needed, and SHOW me the
   conversion before applying). Do not replace my motion components.
4. Route new values through the token layer (brand-tokens.ts / storyboard); never hardcode
   past it.
5. Write design-system/BIND_MANIFEST.md: each value applied, where it landed, any
   conversion, and anything skipped because it conflicted with a pipeline rule.
Do not regenerate styling from any screenshot or video frame.
```

## Highest-leverage fix (expect this to dominate)
Render at **2× (3840×2160) → downscale to 1080p (SSAA)** + **higher bitrate / lower CRF**. Your HTML looks crisp largely because it's on a retina display (DPR ≥ 2); a flat 1080p raster isn't. Match that and most of the "soft/dull" is gone. Color needs no work.
