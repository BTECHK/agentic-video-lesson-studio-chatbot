# P1-C Research: Asset-Generation Tooling Landscape
*(subagent report, 2026-08-01 — appendix input for .planning/VISUAL-PIPELINE-PLAN.md; pricing verified against official pages, dates noted inline)*

## 1. Google "Nano Banana" = gemini-2.5-flash-image
- Official model: `gemini-2.5-flash-image` (GA Oct 2025; "Nano Banana Pro" on Gemini 3 Pro exists via wrappers). Gemini API / AI Studio / Vertex.
- Pricing (ai.google.dev/gemini-api/docs/pricing): **$0.039/image** standard (1290 out-tokens × $30/1M) · $0.0195 batch · $0.0702 priority · input images $0.30/image. Cheapest capable API by ~4-5x vs gpt-image.
- Multi-image fusion + style consistency via reference images (documented in Google's prompting guide); third-party testing reports drift over several generations; imperfect in-image text.
- **No deterministic hex-color control** — prompt + refs get "close", recolor in post for brand-critical exactness.
- Commercial use allowed; paid tier can opt out of data sharing; SynthID watermark embedded.
- Trivially scriptable from Node/TS — strongest drop-in raster candidate.

## 2. Google Stitch — verdict: NOT the right tool
- AI UI-design tool (Labs; Gemini 3): prompt → high-fidelity **Material Design 3** screens; exports to **Figma/code** (Tailwind/Flutter/SwiftUI...), Prototypes canvas.
- **No public API** — interactive web app only. Free during Labs (350 std + 50 experimental gens/mo); paid tier speculated late 2026.
- Wrong output type (product-UI screens, Material register — not brand-styled video assets), unscriptable. At most a mood-board tool. **Answer to "do I need it?": No.**

## 3. Other paid APIs
| Tool | Model | $/image | SVG? | Brand controls | Notes |
|---|---|---|---|---|---|
| OpenAI | gpt-image-2 (1.5 deprecating Dec 2026) | ~$0.02–0.19 by tier | No | refs+prompt only | commercial OK |
| **Recraft V4.1** | raster from $0.035; **true SVG $0.08** (Pro $0.30) | **Yes — real paths** | **Brand kits (stored colors/style)** — closest to a real on-palette control | commercial in paid plans |
| Ideogram v4 | $0.03/$0.06/$0.10 | No | character-reference (+$0.05–0.11 PAYG) | best in-image text (~90%) |
| Midjourney v8.1 | n/a | No | --sref strong | **no first-party public API — poor pipeline fit** |
| Adobe Firefly | API needs enterprise (~$1,000/mo) then ~$0.02–0.10 | partial | — | best IP-indemnification story; expensive to unlock |

## 4. Open-source / local
- **FLUX licensing is the whole story:** FLUX.1 **schnell** = Apache 2.0 (free commercial) · FLUX.1 **dev** = NON-commercial (paid BFL license required) · FLUX.2 **klein-4B** = Apache 2.0 · klein-9B / FLUX.2-dev = non-commercial. **Stay on schnell/klein-4B if commercial.**
- SDXL: CreativeML Open RAIL-M; deepest LoRA/ComfyUI ecosystem — relevant for house-style LoRA training.
- **LoRA fine-tune** on ~15-30 exemplar images = the real lever for 100+ on-brand assets over months (matches the tokens philosophy: fixed source of truth, derived outputs).
- **Hardware reality: this laptop cannot run FLUX/SDXL at production speed** (wants ≥12GB VRAM). Use cloud inference: **fal.ai** ~$0.025/image (FLUX schnell 1024²), LoRA ~$0.055/MP · **Replicate** ~$0.003–0.04/image (per-second GPU billing, cheapest at scale, less predictable).

## 5. The no-image-model alternative — decision rule
- **Programmatic SVG/JSX wins outright for UI-mockup scenes**: animatable (tween every element; cursor glides, buttons depress), token-compliant by construction (reads tokens.ts — zero drift), git-diffable, exactly reproducible. Matches the existing hard rule ("stylized/cartoon animation... don't stitch in screen recordings") — the demo scenes are already built this way; a raster image would be a regression.
- Icons: **Lucide (ISC)** / **Phosphor (MIT)** — free commercial, import as SVG/React. Don't hand-draw standard glyphs.
- LottieFiles free tier: Lottie Simple License — free commercial use in product; can't resell raw animations.
- **Decision rule:** (1) default to code for UI mockups/icons/diagrams/device frames/anything animated; (2) image model ONLY for painterly/organic texture, complex spot art, "hand-drawn" looks uneconomical to code; (3) off-palette raster output → programmatic recolor pass, never prompt-re-roll for hex exactness (no model offers hex-locking).

## 6. Brand consistency across 100+ assets
Code-drawn = by construction, free · Recraft brand kits = per-gen approximation + QA · Nano Banana + refs = medium-high effort, drift correction · **LoRA = the only image-model option matching the tokens philosophy** (train once, outputs inherit) · post-process recolor = cheap universal backstop.

## 7. Recommendation
**Default stack:** 1) code-drawn SVG/JSX (primary — covers most needs) · 2) Lucide/Phosphor for standard icons · 3) Nano Banana as fallback raster (~$0.039/image) with recolor pass.
**Escalate:** Recraft for true-SVG-too-complex-to-code · Ideogram for baked-in text (rare — JSX text usually better) · LoRA on FLUX-schnell/klein-4B via fal.ai/Replicate at 100+ assets/mo · Firefly only if IP-indemnification is contractually needed.
**Do not pursue:** Stitch (no API, wrong register) · Midjourney (no API) · FLUX dev variants locally (license trap) · local GPU inference on this laptop.
**Open questions:** how many truly illustration-dependent scenes exist vs JSX-mockup scenes? · is there a canon style reference (Instructor-approved) to seed refs/LoRA? · any use case needing Adobe-grade indemnification?
