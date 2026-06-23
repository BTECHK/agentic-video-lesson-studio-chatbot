# Prompt to paste into Claude Design (with the upload / zip)

> **Pre-finding (verified — do NOT re-investigate):** the core brand palette is **byte-identical sRGB hex** on both sides — `#EDE8E3` linen, `#8B2635` crimson, `#1C1C1C` charcoal, `#D97757`/`#20B8CD`/`#0f0f0f` tool colors. No OKLCH/Display-P3 → sRGB flattening here, and an uncompressed renderStill measured **ΔE ≈ 0** vs the design hexes. So **do NOT chase color tokens or color-space conversion** — not the cause. Only minor color items exist: accent **gradient stops** (e.g. the Gemini blue→purple→pink) and dark-mode rose.

---

You designed the original Sample Academy animated-lesson system as a self-contained **HTML artifact** (React+Babel CDN, warm-linen + crimson Syne brand system, spring-physics motion). We re-implemented it in **Remotion (React/TSX)** to render to **H.264 / yuv420p / BT.709 / 1920×1080 @ 30fps** MP4 for a Teachable LMS. The MP4 reads **softer, duller, and less crisp** than your HTML. Diagnose the delta and return a prioritized, actionable fix list.

I've uploaded (`design-side/` = your originals, `code-side/` = the Remotion port, `frames/` = paired stills):
- `frames/<scene>__renderstill-uncompressed.png` (true-color Remotion render) and `frames/<scene>__mp4-encoded.png` (same frame, post-H.264) for `cover`, `feature-grid`, `journey-map`.
- `design-side/Module-1-Animated-Lesson__DESIGN-reference.html`, `lesson-template.html`, `lesson-renderer.jsx`, `animations.jsx`.
- `code-side/brand-tokens.ts`, `Cover.tsx`, `FeatureGrid.tsx`, `JourneyMap.tsx`, `shared.tsx`.

Focus on the three real causes, **in priority order**:

**1. Resolution / DPI (likely the biggest).** Your HTML renders at the display's `devicePixelRatio` (retina ≈ 2×); the Remotion output is a flat **1920×1080 raster**. Quantify how much perceived crispness is just pixel density, and give the render-side fix (render at 2×/4K then downscale — SSAA — and/or a `scale` factor).

**2. Codec / encode loss (MP4 only).** Diff each `*__renderstill-uncompressed.png` vs its `*__mp4-encoded.png`. Attribute to **4:2:0 chroma subsampling** (worst-case on saturated `#8B2635` crimson against `#EDE8E3` linen), **CRF/bitrate quantization** (ringing on Syne edges), **range/BT.709 tagging**. Say which are intrinsic (mitigate) vs fixable, and the exact encode settings to change.

**3. Implementation + motion parity (fixable to parity).**
   - *Static:* diff `design-side/*` vs `code-side/*` for **box-shadow blur/spread/opacity**, **gradient stops/banding** (incl. the Gemini gradient hex divergence), **SVG stroke widths / vector AA**, exact **px sizes, letter-spacing, radii (4/14px)**, and **font hinting/AA** (Remotion bundled-TTF Syne vs CDN Syne).
   - *Motion (stills CANNOT show this — read the CODE):* compare your `animations.jsx` easing/durations/delays against the Remotion `spring({damping,mass,stiffness})` and `interpolate(...)` calls in the `.tsx`. List every divergence in easing, duration, delay, and spring stiffness/damping/mass.

## Output
A **prioritized punch list ordered by visual impact** (resolution → codec → implementation → motion). Each item: **cause → evidence (file/frame) → exact Remotion-side fix**, with **exact value vs exact value + a corrected value** wherever a real value diverges (gradient stop, shadow, spring config, easing curve). End with the **single highest-leverage change**. Judge color/sharpness from the **PNGs only**; judge motion from the **code only**.
