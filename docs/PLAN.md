# PLAN — Sizzle reel: fidelity restore + colored icons + smooth float + color quality + data-driven storyboard

**Task id:** `sizzle-v2.3-fidelity`

## Context / why
The v2 `SizzleManifesto` rebuild drifted from the original hand-crafted sizzle
(`00 — START HERE/Sample Academy — Sizzle Reel.mp4`, 6/15): monochrome icons instead of brand
colors, only 2 of 3 transform columns (Unchecked→Gated dropped — 3rd report), changed "what we
do" copy, dropped "closing-line" tagline, and a choppy icon float. Root cause: no canonical
visual spec, so each rebuild loses pieces. User also wants color/aesthetic quality to match the
Claude **design** (HTML) and asked whether the **MP4 encode** is degrading color vs HTML.

Canonical source of truth: `…/Archive/sizzle-reel (source)/` (reel.html, SCRIPT.md,
voice/timeline.json) + colored vendor logos in `_claude-design-import/.../templates/lesson-template.html`.

## Expected UX (what the viewer sees in the rendered MP4)
- "How it works" chips show **brand-colored** tool icons: Claude `#D97757`, ChatGPT
  `#0f0f0f`, Gemini **blue→purple→pink gradient**, Perplexity `#20B8CD` — and the chips **float
  smoothly** (no stair-step judder).
- "What it does" copy reads: *Render lessons straight from data · Check every render with automated gates · Built
  by practitioners, for learners*.
- The dark transform scene shows **3** columns: Manual→Automated (How it gets made) ·
  One-off→Repeatable (How it scales) · **Unchecked→Gated (How it ships)** — plus the tagline
  *"Turn a structured outline into a finished, gate-checked video lesson."*
- Color/contrast visibly closer to the Claude design HTML; no washed-out look.

## Approach
1. **Data-driven storyboard** — `src/compositions/sizzle.storyboard.ts` (typed, commented = the
   contract). Content (copy, tools+colors, transform cols, tagline) lives here; `SizzleManifesto.tsx`
   renders FROM it (replaces hardcoded arrays). Companion `sizzle.storyboard.md` explains the contract.
2. **Full-fidelity content restore** into the storyboard (copy, 3rd column, tagline) — verbatim from
   the original. Do NOT change beat structure, timings, or the audio track (65.6s).
3. **Colored icons** — new sizzle-local `src/compositions/ColoredToolMark.tsx`: render a DISTINCT
   per-tool glyph (reuse `ToolMark`'s recognizable glyph paths — exact vendor pixel-logos NOT
   required; user confirmed the shapes are fine) with brand FILLS: Claude `#D97757`, ChatGPT
   `#0f0f0f`, Perplexity `#20B8CD`, Gemini an inline `<linearGradient>` blue→purple→pink.
   `ToolMark.tsx` (lessons) untouched.
4. **Smooth float** — the sine is already smooth; the judder is rasterization. Fix in `Float`:
   `translate3d(0,y,0)` + `willChange:'transform'` + tune amp≈10–12 / speed≈0.85 (supra-pixel).
5. **Color/encode quality** — probe the original 6/15 MP4 encode (`ffprobe`); sweep `--crf` (default
   18 vs ~8–10) and pixel format (yuv420p vs yuv444p) at `--color-space=bt709`. Objective metric
   (`scripts/_sizzle-color-de.ts`): mean CIE2000 **ΔE** between the encoded MP4 frame and the true-color
   `renderStill` PNG over fixed brand-color patches — accept the encode only at mean ΔE ≤ 6, and use it to
   separate **encode loss** (PNG≈design, MP4 drifts) from **value drift** (PNG itself off the design
   hexes). Keep it Teachable-playable (h264; `yuv444p` only if it still plays). Light depth pass vs the design.

## Files likely touched
`src/compositions/sizzle.storyboard.ts` (new), `sizzle.storyboard.md` (new),
`src/compositions/ColoredToolMark.tsx` (new), `src/compositions/SizzleManifesto.tsx`,
`test/sizzle-storyboard.test.ts` (new), the sizzle render command (encode knobs).

## Execution (this repo's two-model system)
`/spec` (this) → builder implements 1–5 (ponytail) → `/verify`: `checker` runs tsc/eslint/test +
renders + gates + captures frame artifacts, THEN independent `codex exec` adversarial review vs
`docs/ACCEPTANCE.md`. Done only on proof + Codex PASS. **Never gate/test while a render is live**
(ERROR-LOG #8); render alone, gate after.

## Test plan
- `test/sizzle-storyboard.test.ts`: asserts `transform.cols.length === 3`, every tool has a color,
  `tagline` present (the invariants that regressed before).
- `tsc --noEmit` + `eslint` clean; `vitest run` green.
- Render both formats (bt709) **alone**; `gate:motion` + `gate:media` PASS.
- Frame extracts (ffmpeg) at the different (~24s) and transform (~50s) beats as artifacts.
- Color: MP4 frame vs `renderStill` PNG — objective CIE2000 ΔE ≤ 6 (`_sizzle-color-de.ts`).
- **Integrity (no drift):** ffprobe duration = 65.6s; `git diff` shows `MANIFESTO_BEATS` /
  `SIZZLE_DURATION` / the `<Audio src>` unchanged; `git diff --name-only` is sizzle-scoped only
  (no shared lesson files); one `topic-1-lesson-1` frame before/after via `pixelmatch` ≤ 0.1%.
