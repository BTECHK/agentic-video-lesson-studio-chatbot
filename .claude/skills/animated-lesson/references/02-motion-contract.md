# 02 · Motion contract

The five rules that make an animated lesson feel like an animated lesson. Every motion you script in JSON or code must pass all five.

These are derived from a deconstruction of Anthropic's product demo videos and Big Tech (Apple/Google) feature animations. See `07-industry-research.md` for the source observations.

---

## 1. Fluid physics

**Rule:** All motion uses natural easing curves. Nothing snaps abruptly into place. Nothing moves at constant velocity unless it's a literal scrub or a system metric (e.g. a timer).

**In practice:**
- Use `Easing.easeOutCubic` for entrances and `Easing.easeInCubic` for exits.
- Use `Easing.easeOutBack` for pop-in moments (pills, "you are here" badges, count-ups arriving at their target).
- For draw-on paths (the tether squiggle, journey-map progress line), use `Easing.easeInOutCubic`.
- Avoid `easeOutElastic` and `easeInOutBack` — they read as "bouncy" and break the warm-minimalist tone.

**Anti-example:** A card that pops into place with `transition: transform 0.2s` and default `ease`. Looks fine in isolation, looks cheap next to glide-easing siblings.

---

## 2. Object permanence (the tether method)

**Rule:** When information moves from one location, screen, or component to another, draw a continuous visual element that physically connects them. The user's eye follows the line; their brain doesn't have to reconcile "where did that thing go".

**Canonical implementation:** the hand-drawn squiggle `<Tether>` component. SVG path with `stroke-dasharray` animation creating a "drawing-in" effect over 1–1.4s.

**When to use:**
- Same prompt going into 3 different AI tools → tether connects all three input fields.
- Data flowing from chat → document → back to chat.
- A user's action triggering downstream consequences across the canvas.

**When NOT to use:**
- Inside a single component (it's overkill for a card flipping or a number incrementing).
- For purely decorative connections (don't draw a line just because two things are on the same slide).

**Rate limit:** **One tether per scene, max.** If you need two, the scene is doing too much — split it.

---

## 3. Semantic micro-interactions

**Rule:** Loading and processing states must be *semantic* — they communicate what's happening, not just "we're waiting".

**Replace generic spinners with:**

| Generic | Semantic |
|---|---|
| Wheel spinner | `<Pinwheel>` — 8 dots in a ring with stagger fade. Reads as "thinking" because dots are turning over one at a time, like attention sweeping. |
| Progress bar (% complete) | `<DrawLine>` — line draws across a track with `easeInOutCubic`. Reads as forward motion. |
| Dots-loading (...) | `<TypeOn>` — character-by-character text with a blinking caret. Reads as composition. |
| "Recording" red dot | `<PulseRing>` — concentric rings expanding outward. Reads as listening. |

**Why this matters:** users spend a lot of perceived time in loading states. A semantic micro-interaction makes the wait feel productive, not blocked.

---

## 4. Sequential staging

**Rule:** Choreograph animations as a four-beat sequence:

1. **Container in.** The frame for the action arrives (chat window glides in, table fades in, setup card appears).
2. **Action triggers.** Something the user "did" plays out (prompt types in, cursor moves to a button).
3. **Processing state.** Semantic micro-interaction holds the beat (pinwheel spins, line draws).
4. **Result resolves.** The output reveals, also progressively if it's text (typing-on rather than a paste).

**Beat timing baseline (in seconds, per beat):**
- Container in: 0.5–0.8
- Action: 1.5–2.5 (typing a prompt)
- Processing: 1.5–2.5 (long enough to feel like work, short enough not to bore)
- Result: 2.0–4.0 (typing-on a response)

**Total scene budget:** 8–17 seconds. Anything longer needs to be split.

**Anti-pattern:** all four beats firing at once with stagger of 0.1s each. Looks busy. The whole point is the user's attention being walked through the steps.

---

## 5. Purpose-driven motion

**Rule:** Every animation must do one of:

- **Teach** — show how a feature works (cursor walks down the list, pinwheel shows processing).
- **Guide** — direct attention (active card lifts, others dim).
- **Confirm** — provide feedback that a state changed (checkmark appears, "Done" pill swaps in).

If a motion isn't doing one of those three, cut it. Motion for its own sake is decoration; this is a learning platform.

**Test:** for every animated element, write one sentence: "This moves because…". If the sentence is "…it looks nice", cut.

---

## Accessibility default

Honor `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

The `animations.jsx` Stage component already respects this for the auto-play loop (no auto-play if reduced motion is preferred — user can still scrub manually).

For tethers and complex sequenced motion, degrade gracefully to opacity cross-fades only. Don't try to compress 6 seconds of choreography into 6 milliseconds — just stop animating and show the final state.

---

## Performance defaults

- **Animate only `transform` and `opacity`.** Never animate `width`, `height`, `margin`, `padding`, `top`, `left`. Use `transform: translate()` and `transform: scale()` instead.
- **`will-change: transform, opacity`** on any element animating per-frame.
- **Stage canvas is 1920×1080**, scaled to viewport via a single `transform: scale()` on the canvas root. Never re-layout the canvas at viewport size.
- **One requestAnimationFrame loop** for the whole stage (the engine handles this — don't spawn your own).
