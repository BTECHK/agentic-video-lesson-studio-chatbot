# Keyframe QC Review — prompt for Claude Design (self-contained)

You are doing a **fast visual QC pass** on rendered Sample Academy lesson videos. Per lesson you are given
one **settled keyframe PNG per scene** (the exact pixels from the final 1920×1080 MP4, grabbed after each
scene finished animating in) plus a self-contained **`review.html`** contact sheet that lays out every
keyframe next to its scene type, timing, and narration. Your job is to catch **layout, spacing,
typography, and brand defects** that slipped through — the kind a still-frame gate misses. You are NOT
reviewing teaching content or narration quality; only what the eye sees. **Review and write feedback only
— do NOT re-render, regenerate, or modify any video, MP4, or lesson file. Feedback is written notes.**

## Inputs & locations (you are connected to BOTH the repo and the Drive)
- **OPEN THIS per lesson:** the contact sheet `review.html` — renders in a browser, shows the whole lesson.
  - Repo: `artifacts/keyframes-review/<topic>/<id>/review.html` (e.g. `…/topic-3/topic-3-lesson-1/review.html`)
  - Drive: `keyframes-review/Module N — …/<id>/review.html`
- Individual keyframes: the `NN-<type>-<id>.png` files in the same folder (full-res, for close inspection).
- Lesson design source (if you want to trace an issue to its data): `content/lessons/<id>/lesson.json`
  (scene `type` + strict `content` + `narration`). The scene components live in
  `src/compositions/lesson-scenes/` — name the component when an issue is a shared-component bug.
- This contract: `00-KEYFRAME-QC-PROMPT.md` (this file), in the Drive `keyframes-review/` root.

## The brand + layout contract (what "correct" looks like)
- **Palette:** warm linen background `#EDE8E3` (cards `#FDFBF9`), crimson accent `#8B2635`, charcoal ink
  `#1C1C1C`. Flat-on-linen; shadows are charcoal & low (NEVER glow). Geometry radius **4px** everywhere
  (only genuine window chrome — chat/voice/browser mocks — may use ~14px).
- **Type:** Syne. Eyebrow = 600, .14em uppercase, crimson. Titles = 700 (NEVER 800/extraBold). Body/labels
  600. Tracking tight on titles (~−0.025em).
- **Safe area:** content lives inside ~96–110px side insets / ~54–72px top-bottom. A persistent narration
  caption chip sits along the bottom (~y 865–905) — **nothing may overlap it**; keep ≥30px clearance above it.
- **Motion:** scenes are alive (subtle ambient drift) — a keyframe is one settled moment; don't flag motion.

## What to hunt for (the defect classes)
1. **Cramped / uneven spacing** — elements too close together or to a neighboring row; items that should be
   evenly distributed but aren't; inconsistent vertical rhythm between an eyebrow, its title, and a tag.
   *(Known example already flagged on `journey-map`: the per-stop label stack (TOPIC eyebrow → title →
   "YOU ARE HERE" tag) sits too tight under the node row, and the multi-line stop titles make the
   horizontal spacing read as uneven/cramped. Flag every instance of this class you see.)*
2. **Overlap / collision** — any text touching or sitting on top of the bottom caption chip, another label,
   a card edge, or the "Sample Academy" watermark. Multi-line labels colliding with their neighbor.
3. **Off-safe-area / clipping** — text or a card running past the safe inset or off-frame; a glyph that
   looks cut (note: Syne's lowercase `g` descender is intrinsically short — NOT a clip; don't flag it).
4. **Typography drift** — a title that looks heavier than 700; a full-pill (rounded 999) tag where a 4px
   radius is expected; inconsistent sizes for the same role across scenes.
5. **Brand violations** — non-linen backgrounds (a genuinely dark widget like a waveform player is OK; a
   dark *scene background* is not), glows, wrong accent color, off-palette fills.
6. **Density / balance** — a scene that's lopsided (all content jammed left, huge empty right), or a grid
   row pushed tall by one wrapping card crowding the row below.

## How to report (per lesson)
For each lesson folder, output:
```
### <lessonId> — <title>
- <NN-scene>.png : <PASS | ISSUE> — <one-line description + which defect class + a concrete fix>
```
Then a 1-line lesson verdict (CLEAN / N issues). Be specific and surgical ("increase the node-row→label gap
by ~24px and reduce stop-title to one line or widen the column" beats "spacing looks off"). Prioritize
issues that a stakeholder/learner would notice. If a frame is clean, say PASS — don't invent problems.

## Output
A single markdown report: per-lesson sections + a top summary table (lesson · #issues · worst class).
These become surgical fixes applied at the **component/token** level (fix once → re-render all), so call out
when an issue is clearly a shared-component bug (e.g. journey-map spacing) vs a per-lesson content choice.
