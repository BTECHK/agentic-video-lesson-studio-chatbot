# 08 · Simulated-Screen Contract (mock computers, click-throughs, tool windows)

How we animate "in-tool" moments — dashboards, builders, page-throughs, anything that shows a
screen being used. Owner decision 2026-06-10: the visual register is **Anthropic-YouTube-style
stylized animation** (colorful, caricaturized screens; gliding cursors; buttons that visibly
click), NOT photoreal screen mockups.

## The three fidelity tiers

| Tier | What | When to use |
|---|---|---|
| **A — cartoon** (default) | Flat brand-warm mock window; abstracted UI shapes; springy cursor | Everything, unless B's condition is met |
| **B — hybrid** | Stylized monitor/browser frame echoing the *real tool's layout* (recognizably a given tool's builder), still drawn in our style | Only where layout recognition IS the teaching point (e.g. an assistant builder's left-form/right-preview split) |
| **C — real** (screenshots/recordings) | Real assets embedded | **Out of scope for launch.** Future upgrade via the per-sceneType swap seam; never a blocker |

Components carry a `fidelity: 'cartoon' | 'hybrid'` knob so A and B render from the same step data.

## Window chrome spec

- Generic frame: title bar (28–36px), traffic-light dots or minimal tab hint, 4px outer radius
  (14px allowed for chat/demo cards per the brand system), Card White `#FDFBF9` surface on the
  warm-linen stage, 1px `rgba(28,28,28,.10)` border.
- **Never a pixel-perfect vendor clone.** No real product chrome, logos only from the approved
  registry, color accents stay in-palette (vendor color may appear only as a small identity chip).
- A small caption chip may label the tool ("Assistant — Builder") — set in Syne, eyebrow scale.

## Cursor & interaction grammar

- Cursor is a brand-accent pointer (crimson `#8B2635`), moves on **spring glide** per the motion
  contract (no linear tweens, no teleporting).
- Rhythm per action: **glide → dwell (~300–450ms) → click pulse (scale dip + ring) → UI responds**.
  The dwell-before-click is what makes the action legible at lesson pace.
- Typing renders character-streamed into a field (existing ChatDemo idiom), never instant-paste.
- One action on screen at a time; the UI's response must complete before the next glide starts.

## Honesty rule (inherited from the production model)

Animate the interaction **faithfully**: real feature names, real flow order, real outcomes —
verified by Gate A like any claim. Outputs shown in mock UIs are clearly stylized (tiles,
skeleton blocks, abstracted text) — never fabricated content presented as a real product
response. If the real flow can't be verified on an official source, soften or cut the step.

## Timing

Scene duration stays **audio-authoritative** (narration drives length; visuals stretch to fit).
Steps distribute across the scene's `durationInFrames` proportionally to their `dwell` weights.
Demo beats are deliberately multi-step — a build/click-through should run at walkthrough pace
(this is how demo rows earn their outline minutes), not montage pace.

## Gate coverage

Simulated screens are ordinary scenes: Gate L measures them (no clip/overlap/safe-area), Gate C
watches them (legible steps, brand, no garbled text), Gate A verifies any claim they animate.
