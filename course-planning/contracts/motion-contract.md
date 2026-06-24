# Motion Contract — course-wide

> **Why / Intent:** pins the easing model so motion is deterministic AND on-brand. The FaceliftV2
> remediation proved the failure mode: timing ported fine but *curves* drifted (springs felt floaty
> and never "landed"). This file pins the curve, not just the start frame. Shared by every lesson +
> sizzle. (Source: sizzle-v3 motion-contract + the FaceliftV2 fix now in `shared.tsx`.)

## Easing library (use these names everywhere)
| Name | Definition | Use for |
|---|---|---|
| `outCubic` | `Easing.out(Easing.cubic)` over an explicit duration | **Default entrance.** Accelerates out, lands hard on a known frame. |
| `inOutCubic` | `Easing.inOut(Easing.cubic)` | Line draws, wipes, dim sweeps. |
| `outBack` | `Easing.out(Easing.back(1.6))` | Genuine pops only: dots, badges, accent words. Lands at 1.0 (no asymptote). |
| `linear` | — | Continuous float/drift only. |

**Rule:** entrances are `interpolate(frame,[d,d+Δ],[0,1],{easing: outCubic})` over an explicit
duration — **NOT `spring()`**. Springs approach asymptotically and never "arrive"; that soft tail is
the v2 floatiness. Reserve overshoot for deliberate pops, and prefer `outBack` over a default spring.

## Per-element timing
Windows are `[startFrame, endFrame]` at 30fps, relative to each scene's start, recorded in each
lesson's `scene-contract.json` → `scenes[].motion`. That JSON is authoritative; this doc explains intent.
Typical: title 0.7s (21f), sub 0.6s (18f), eyebrow 0.5s (15f), cards stagger 6f.

## Travel distances (hero moves more, small copy less)
- Hero headline: y 30–38px. Small copy / captions: y 12–18px. Cards: y 18–24px.

## Continuous life (no frozen frames)
Every scene runs an ambient drift (`SceneAmbient`) behind content so a narration-long hold never
reads as a still. After an element lands, optional idle float: `y += sin((frame-land)*0.035 + phase) * 7px`
(`phase` a fixed per-element constant — never random). Enforced by `gate:motion` (activePct ≥ 0.6,
no still > 2.5s).

## Determinism
No `Math.random` (seed it), no wall clock — every motion value is a function of `useCurrentFrame()`.
Stagger = `index * step` (integer frames).
