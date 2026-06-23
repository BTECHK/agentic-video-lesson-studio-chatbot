# 09 · v2 facelift — how the design system is realized in Remotion

The production pipeline is **Remotion** (`src/`), not the HTML/JSX prototypes in
this skill's `templates/`/`examples/`. Those remain the *design reference*; the
list below is where each piece actually lives and renders to MP4. As of the v2
facelift (2026-06), the design system (this skill's `01-brand-system.md` +
`02-motion-contract.md`) is fully realized in these files. **A new lesson needs
no extra styling work** — author the content JSON and the scene components below
already render the v2 look.

## Where the system lives

| Design concept | Remotion file |
|---|---|
| Brand tokens (colors, radii, `SHADOW` depth, mono) | `src/brand/tokens.ts` (`BRAND`, `SHADOW`, `LEADING`, `SAFE_AREA`) |
| Shared scene scaffolding (SceneFrame, Eyebrow, Title, glide/pop, `renderAccented`) | `src/compositions/lesson-scenes/shared.tsx` |
| Motion primitives (`Tether`, `Pinwheel`, `TypeOn`, `PulseRing`, `MockCursor`, `Window`, `Composer`) | `src/compositions/lesson-scenes/primitives.tsx` |
| Persistent chrome (wordmark, scene label, progress dots, mono counter) | `src/compositions/lesson-scenes/LessonChrome.tsx` |
| The 17 scene-type components (one per `03-scene-catalog.md` type) | `src/compositions/lesson-scenes/*.tsx` (dispatched by `register.ts`) |
| Composition (lays scenes on a `<Series>`, audio + captions + chrome) | `src/compositions/LessonVideo.tsx` |
| Content schema (the JSON you author per lesson) | `content/schemas/scene-types.ts`, `content/schemas/lesson.ts` |

## The v2 look in one paragraph

Card-white `#FDFBF9` surfaces float on linen `#EDE8E3` via the three-level
`SHADOW` system (`SHADOW.window` is the floating-frame depth). Windows/cards use
`radiusWindow` (14px); pills/chips/dividers use `radius` (4px). Accent crimson is
used boldly on key words (`*word*` → `renderAccented`), big numerals, uppercase
tags, "Best" pills, and the hand-drawn `Tether`. Loading is semantic
(`Pinwheel`/`PulseRing`/`TypeOn`), and simulations show a `MockCursor` clicking
through. Everything is frame-driven; per-element entrance motion settles in the
first ~7s then holds (scenes are narration-long; the layout gate samples at 80%) —
**but the frame is never frozen**: `SceneFrame` renders a `SceneAmbient` layer
(drifting + breathing warm light, behind the content) so every scene stays alive
through its hold. That ambient layer moves no text, so the layout gate is
unaffected. See `.planning/MOTION-CONTRACT.md`.

## Hard constraints (enforced by gates)

- **Never change a scene's `duration`** — audio is pre-aligned to it. The
  facelift is render-layer only.
- All text must stay inside `SAFE_AREA` (x:96/y:54). `gate:layout` scans the
  whole document, chrome included.
- Render v2 to a side dir without clobbering v1: `RENDER_OUT_DIR=out/v2 npx tsx
  scripts/render-lesson.ts <ids>`. Publish beside v1: `npm run publish:drive --
  <id> --v2`.

## Color encoding — MUST be BT.709 (the "no pop" defect)

The palette is correct sRGB, but the **encode** is what makes colors pop or look
faded. Remotion's default h264 export tags `color_space=bt470bg` (BT.601/PAL) with
`yuvj420p` full-range and unknown primaries/transfer — players desaturate that, so
the video looks dull/low-contrast even though the source PNGs are vibrant. This bit
the first v2 pass: every visual check used `renderStill` PNGs (true color), never
the actual MP4.

- `scripts/render-lesson.ts` passes `colorSpace: 'bt709'` to `renderMedia`; for the
  CLI use `--color-space=bt709`. Correct output is `color_space=bt709`,
  `color_primaries=bt709`, `color_transfer=bt709`, `pix_fmt=yuv420p`, range `tv`.
- **Always verify the encoded MP4, not a still.**

## Gate M — media integrity (`npm run gate:media -- <file.mp4>`)

Probes the real MP4 and fails on: no audio stream, effectively-silent audio
(peak < −30 dBFS), or `color_space != bt709`. This is the gate that would have
caught both first-pass defects (silent sizzle + bt470bg color). Run it on every
delivered MP4 (lessons AND sizzle) before publishing.

## Gate Mo — motion / liveliness (`npm run gate:motion -- <file.mp4>`)

The "not a slideshow" gate. Samples the encoded MP4 and fails if fewer than 60% of
frames show any change (`activePct`) or any still is held longer than 2.5s. This is
the gate that catches the v2 sizzle's original defect (fade in, then freeze) and the
lessons' "settle then hold" flatness. `publish-to-drive.ts` runs **both** Gate M and
Gate Mo on the source video and refuses to publish a silent/faded/static render
(override with `--force`). Full rationale + calibration: `.planning/MOTION-CONTRACT.md`.

## Audio

- **Lessons:** Gemini TTS per-scene narration (`content/lessons/<id>/audio/`),
  muxed by the `<Audio>` in `LessonVideo`. Already audible (~−5 dB peaks).
- **Sizzle:** ElevenLabs (the narrator voice) VO + music. The reusable track lives at
  `public/sizzle/original-sizzle-audio.m4a` (not included in this copy);
  `SizzleManifesto` plays it via `<Audio>`.

## The sizzle is `SizzleManifesto`, not `SizzleReel`

The canonical sizzle is `src/compositions/SizzleManifesto.tsx` — a faithful
Remotion rebuild of the hand-crafted "Sample Promo" manifesto (a sequence of
beats ending in a call to action), reusing the original VO. `SizzleReel.tsx` (the #74 montage) is superseded —
do not ship it as the sizzle. Render:
`npx remotion render src/index.ts SizzleManifesto out/v2/sizzle-16x9.mp4 --color-space=bt709`.
