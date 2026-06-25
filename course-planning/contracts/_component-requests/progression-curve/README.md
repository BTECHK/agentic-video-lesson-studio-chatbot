# progression-curve — new-component request (READ ME)

Approved by the owner. The one genuinely-missing scene component in the course: a rising **progression curve**
with stage chips + a "where are you?" marker. `feature-grid` can't carry the rising metaphor.

## Files here
- **`progression-curve.spec.md`** — the build contract: catalog entry, schema patch, render `content` shape,
  props, layout/brand, motion, a11y, and the first use.
- **`progression-curve.reference.html`** — the on-brand visual reference. **Open it in a browser** to see the
  exact target pose (1920×1080, scales to fit; the still in the reference IS the end-state).

## To ship it (3 steps, in the repo / Codex session)
1. Add `"progression-curve"` to the `sceneType` enum in `contracts/scene-contract.schema.json` (+ a row in
   `scene-type-catalog.md`).
2. Build the Remotion component to match `progression-curve.reference.html` (props = the `content` shape in
   the spec). Register it in `src/compositions/lesson-scenes/register.ts`.
3. Use it in a lesson's scene contract (swap a `feature-grid` scene for `progression-curve` and fill in the
   copy). Then `validate.mjs` passes.

Until step 1 lands, keep using the `feature-grid` version, which stays validator-green.

— Claude Design
