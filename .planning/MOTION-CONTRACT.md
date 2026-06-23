# Motion Contract — every delivered video must stay alive

**Status:** active as of 2026-06-20. Supersedes the implicit "settle then HOLD" habit
that turned the v2 sizzle into a recorded slideshow.

## The rule

Every MP4 we ship (sizzle **and** lessons) must pass **two** MP4-probe gates, on the
actual encoded file, before it goes to Drive:

- **Gate M — media** (`npm run gate:media -- <mp4>`): audio stream present, peak ≥ −30 dBFS
  (not silent), `color_space=bt709` (HD sRGB, the "pop").
- **Gate Mo — motion** (`npm run gate:motion -- <mp4>`): the video actually animates
  *throughout*, not just at cuts.

Both are enforced at the publish boundary — `publish-to-drive.ts` now probes the source
video and refuses (without `--force`) if either fails. The artifact gates (A·B·C·L·T)
never looked at the encoded video; that blind spot is how a silent/faded/static render
shipped in the first v2 pass.

## How Gate Mo decides (and why this metric)

Sample low-res grayscale frames at 2 fps, take the mean absolute luma diff between each
adjacent pair (`src/lib/media-probe.ts` → `probeMotion`), then (`src/lib/gate-motion.ts`):

- **`activePct`** — fraction of frame-pairs that show any change (≥ `FROZEN_THRESHOLD` 0.0005).
  Must be **≥ 0.6**.
- **`longestFrozenRunSec`** — longest unbroken stretch with no visible change. Must be **≤ 2.5s**.

`meanMotion` is reported but is **not** a pass criterion: a fast-cut slideshow scores a high
mean (big spikes at every hard cut) while sitting frozen between them — the mean rewards the
exact defect we catch. `activePct` is the honest "is it alive" signal, and it separates static
from alive identically for a 65s promo and a 40s narrated lesson, so one threshold serves both.

### Calibration (measured on real renders)

| clip | activePct | longestFrozen | verdict |
|---|---|---|---|
| old static sizzle | 0.12 | 14.5s | FAIL ✓ |
| old lesson (1.1 / 1.3) | 0.37–0.38 | 3–6.5s | FAIL ✓ |
| **rebuilt sizzle 16:9 / 9:16** | **0.88 / 0.91** | **1.0s** | PASS |
| **lesson 1.1 after fix** | **0.77** | **1.0s** | PASS |

A truly static hold reproduces *identical* frames (diff exactly 0.0000); a continuously
animated render never drops below ~0.0003. The thresholds sit cleanly between.

## The v1 → v2 sizzle delta that triggered this

The v2 `SizzleManifesto` rebuild used a single helper (`useFade` — opacity + a one-time
translateY); every beat faded in over ~1s then froze. v1 (`SizzleReel` + its scene
components) had ~12–15 animated elements per scene and motion across 65–95% of runtime
(typing chats, thinking pinwheels, gliding cursors, live tables, draw-ons). The rich
vocabulary already existed (`TypeOn`, `Pinwheel`, `Tether`, `MockCursor`, `ToolMark`,
`Glide`/`Pop`, `DrawLine`) — the sizzle just imported none of it. Root cause: the v2
facelift's "settle in ~7s then HOLD at rest" rule (so the still-frame layout gate samples
a settled frame at 80%) leaked into the promo, and no gate measured motion.

## What the rebuilt sizzle animates, per beat (`src/compositions/SizzleManifesto.tsx`)

Two motion layers run **continuously across every beat** so nothing ever freezes:
1. `AmbientGlows` — warm radial light that drifts + breathes (opacity + position, with a fast
   ripple so it never flatlines).
2. `Chrome` — the active progress dot breathes.

On top of that, each beat plays staged + semantic motion:

| beat | staged motion |
|---|---|
| hook | quote **types on** (`TypeOn`) under a glide-in eyebrow |
| promise | wordmark **pops**, line glides, accent underline **draws on** |
| different | items **stagger in** over **drawing** left-rules; struck items get an **animated strikethrough**; tool chips **pop in with `ToolMark` icons** and **float**, a crimson connector **draws** beneath |
| master | list items + crimson numerals **stagger/pop** down a **drawing** rule |
| transform | old state **struck through** → ↓ → payoff word **pops** (easeOutBack); columns **float**; top rule **draws** |
| cta | wordmark **pops**, line glides, accent line **draws on** |

## The lesson fix (one edit, all lessons)

`SceneFrame` (used by all 16 lesson scenes) now renders a `SceneAmbient` layer — the same
breathing warm light, behind the content. It moves no text, so `gate:layout` (which measures
text rects on an 80% still) is unaffected; it just lifts every lesson from "settle then hold"
to continuously alive. Measured effect on lesson 1.1: activePct 0.38 → 0.77, longestFrozen
3s → 1s. Per-scene staged motion (the scene-catalog beats) is unchanged.

## Run it

```
npm run gate:motion -- out/v2/<id>.mp4      # one video
npm run gate:media  -- out/v2/<id>.mp4
npm run publish:drive -- <lessonId> --v2    # now refuses a silent/faded/static video
```
