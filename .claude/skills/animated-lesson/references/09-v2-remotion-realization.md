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
through. Everything is frame-driven; motion settles in the first ~7s then holds
(scenes are narration-long; the layout gate samples at 80%).

## Hard constraints (enforced by gates)

- **Never change a scene's `duration`** — audio is pre-aligned to it. The
  facelift is render-layer only.
- All text must stay inside `SAFE_AREA` (x:96/y:54). `gate:layout` scans the
  whole document, chrome included.
- Render v2 to a side dir without clobbering v1: `RENDER_OUT_DIR=out/v2 npx tsx
  scripts/render-lesson.ts <ids>`. Publish beside v1: `npm run publish:drive --
  <id> --v2`.
