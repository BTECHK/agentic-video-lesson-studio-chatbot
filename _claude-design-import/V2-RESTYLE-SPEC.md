# v2 Facelift — Scene Restyle Spec (READ FIRST)

You are restyling existing **Remotion** lesson scene components to the "v2"
Claude Design look. This is a **render-layer facelift only**. Repo root:
`C:/Users/dev/OneDrive/Desktop/github/agentic-video-lesson-studio-chatbot`

## Absolute rules (violating any of these breaks the pipeline)

1. **NEVER change** a scene's content schema, its `content-types` shape, the
   component's props/signature, or anything about timing **durations**. Audio is
   pre-aligned to current durations — durations must stay identical.
2. **Only edit the scene file(s) assigned to you.** Do not touch tokens.ts,
   primitives.tsx, shared.tsx, other scenes, or any test/script.
3. Keep ALL text inside the safe area. `SceneFrame` already pads correctly —
   keep content within it; don't reposition things toward the frame edges.
   `gate:layout` measures every text node and fails text outside x:96/y:54.
4. Scenes are **long** (20–60s, narration-driven). All entrance motion must
   **settle within the first ~7s, then HOLD at rest** — the layout/visual still
   is sampled at 80% into the scene. Use fixed scene-relative frame delays for
   intro beats; never scale a hold to the full duration.
5. Animate only `transform`/`opacity` (springs/interpolate). Frame-driven only
   (`useCurrentFrame`); never CSS `transition`/`animation` (won't render in
   headless capture).

## The design tokens (from `src/brand/tokens.ts`)

```
BRAND.colors: bgBase #EDE8E3 (linen), bgAlt #F7F4F0, bgCard #FDFBF9 (card-white),
  bgDark #E3DED9 (deeper linen / table headers), text #1C1C1C, textMuted (60%),
  textDim (33%), accent #8B2635 (crimson), accentSoft (10%),
  border (8%), borderStrong (15%)
BRAND.radius = 4   (pills, chips, small dividers, table cells)
BRAND.radiusWindow = 14   (cards, chat/desktop windows, voice card)
BRAND.font.mono   (numeric captions only)
SHADOW.card    = resting card
SHADOW.cardHover = focused/active card (deeper)
SHADOW.window  = floating chat/desktop frame depth  ← the "alive" look
```

## What "v2" means (the delta from the old flat look)

The old scenes used a flat `#F7F4EF`, hard 2px borders, no shadow — that reads
"2D". v2 makes surfaces **float** and the accent **pop**:

- **Cards/windows:** background `bgCard`, `1px solid border`, `radiusWindow`
  (14), and a **shadow** — `SHADOW.window` for chat/desktop frames, `SHADOW.card`
  for content tiles. This depth is the single biggest upgrade.
- **Active/focused card:** accent border + `SHADOW.cardHover` + a small lift
  (`translateY(-6px)`), others slightly dimmed (opacity ~0.6). (focus beat)
- **Accent usage:** bold crimson on key words (use `renderAccented` for `*word*`),
  big crimson numerals (RecapGrid/FeatureGrid `01/02/03`), accent uppercase tags,
  accent "Best" pills, accent left-border on "Coming next" bands.
- **Pills/chips:** `radius` 4 (or full-pill for status), `bgDark` or `accentSoft`
  fills, never hard borders.
- **Dividers/tables:** `border`/`borderStrong` hairlines, header row `bgDark`.

## Reusable primitives available (from `./primitives`)

`Tether` (crimson draw-on connector), `Pinwheel` (thinking ring), `TypeOn`
(type-on text + caret), `PulseRing` (listening rings), `MockCursor`
({keys:[{frame,x,y}], clicks:[frame]}), `Window` (card-white frame w/ header +
optional composer), `Composer`. Helpers: `easeInOutCubic`, `typedCount`,
`cursorAt`. Use them where the scene's semantics call for it (see per-scene
notes from the orchestrator).

## Reference materials

- **Reference implementation (the v2 pattern, already merged):**
  `src/compositions/lesson-scenes/ComparisonChats.tsx` — copy its idioms.
- **Shared helpers you SHOULD use:** `src/compositions/lesson-scenes/shared.tsx`
  (`SceneFrame`, `Eyebrow`, `SceneTitle`, `SceneSub`, `useGlideIn`, `usePopIn`,
  `Glide`, `Pop`, `renderAccented`, `MUTED`, `HAIRLINE`, `GLIDE`).
- **The polished HTML design reference** for the original look the user loved:
  `_claude-design-import/sampleacademy/project/lesson-scenes.jsx` and
  `_claude-design-import/sampleacademy/project/animated-lesson-skill/references/03-scene-catalog.md`.
  Match the **visual output**, not the code structure. Read the section for your
  scene type to see intended layout/beats.
- Your scene's content shape: `src/compositions/lesson-scenes/content-types.ts`
  → `content/schemas/scene-types.ts`.

## Verification before you report done

- `npx tsc --noEmit 2>&1 | grep <YourFile>.tsx` → must show NO lines for your
  file(s). (Other files may show transient errors from concurrent edits — ignore
  anything not in your assigned files.)
- `npx eslint <your files>` → clean (no unused imports, etc.).
- Do NOT run the test suite or any render/gate — the orchestrator renders + gates
  all scenes after every restyle lands.

## Report back (concise)

For each scene file: one line on what you changed, which primitives/tokens you
used, and any uncertainty or place you couldn't match the reference. Note if any
scene already looked v2-correct and needed only minor/no change.
