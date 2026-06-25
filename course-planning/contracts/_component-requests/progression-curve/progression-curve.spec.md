# Component request — `progression-curve` (the 18th scene type)

**Why this exists:** a course-opening progression beat needs stage chips *stepping up a rising path* with
a "you are here?" engagement marker. `feature-grid` is a flat numbered grid and can't carry the rising-curve
metaphor, so this is a genuine new-component request (the only one in the whole course). It's **reusable** for
any levels / maturity / progression beat. Open `progression-curve.reference.html` for the on-brand visual
contract; build the Remotion component to match it.

## 1. Catalog entry (add to `contracts/scene-type-catalog.md`, "Data / framework" group)
| sceneType | Renders | Use when… |
|---|---|---|
| `progression-curve` | Labelled stage chips on a smooth rising path (optional dip), with an optional self-locating marker | "levels", "maturity model", any low→high progression |

## 2. Schema patch (`contracts/scene-contract.schema.json`)
Add `"progression-curve"` to `scenes.items.properties.sceneType.enum` (the 18th value). Without this,
`validate.mjs` rejects any lesson that uses it. (Suggest also documenting it in `planning-to-render.md`.)

## 3. Render `content` shape (the STRICT shape the build step produces)
```ts
type ProgressionCurveContent = {
  eyebrow: string;
  title: string;
  stages: { tier?: string; label: string }[];   // 3–8, ordered low→high
  curve?: "steady" | "dunning-kruger";           // path shape; default "steady"
  destination?: string;                          // optional flag past the last node, e.g. "→ and beyond"
  marker?: string;                               // optional held engagement prompt (self-locate; NOT pinned to a node)
};
```
Design-altitude `copy` in `scene-contract.json` maps 1:1 (eyebrow→eyebrow, title→title, stages→stages,
curve→curve, destination→destination, marker→marker). See `content/lessons/_scene-preview/lesson.json` for a filled example.

## 4. Layout & brand (matches the reference; all from `brand-tokens-ref.md`)
- 1920×1080, linen `--bgBase #EDE8E3`. Safe-area inset ~96–110 × 54–64.
- Eyebrow Syne 600 / 20px / .14em uppercase / crimson `#8B2635`. Title Syne 700 / ~66px / tracking −0.025em / charcoal.
- **Curve:** crimson stroke (~5px), smooth cubic through the stage nodes. For `dunning-kruger`, the first three
  nodes trace a confidence **bump (peak) → dip** before the steady climb; for `steady`, monotonic rise.
- **Nodes:** 9px dots — filled crimson for "passed" stages, card-white with crimson ring for upcoming. Each node
  has a 1px `--dim` leader to its chip.
- **Chips:** card-white `#FDFBF9`, 1px `--line` border, 4px radius, tier number (crimson, 14px) + label (Syne 600 / 21px).
  Alternate above/below the curve to avoid collisions.
- **Destination flag:** crimson-on-`--accentSoft` pill past the final node.
- **Marker (optional):** a dashed crimson ring with "?" + a "you?" tag and a dotted drop line to the baseline —
  placed in the early/relatable zone, **not** pinned to a node (the viewer self-locates). Slow pulse only.
- Geometry 4px; flat-on-linen; shadows charcoal & low (never glow).

## 5. Motion (maps to the scene's `motion[]`)
1. `path` — the rising curve draws left→right (inOutCubic, ~0.8–1.2s).
2. `stages` — chips reveal stepping UP the curve in a stagger (`step` per chip, outBack).
3. `marker` — fades in, then HOLDS with a slow pulse + idle drift for the rest of the scene (the engagement beat
   must stay alive, not freeze — see `motion-contract.md`).
- **Reduced-motion / print / PDF:** the visible END pose is the base state (the reference is built this way) — all
  stages, curve, marker present; only ambient motion is gated on `prefers-reduced-motion: no-preference`.

## 6. Accessibility / honesty
- Stage labels are the source of truth (the curve is decorative emphasis). Don't encode meaning in color alone —
  "passed vs upcoming" is also conveyed by fill vs ring.
- The marker is a *question*, not an answer — never auto-place "you" at a fixed node.

## 7. First use
A course-opening lesson's progression beat (a seven-stage example lives in
`content/lessons/_scene-preview/lesson.json`).
— Claude Design · 2026-06-25
