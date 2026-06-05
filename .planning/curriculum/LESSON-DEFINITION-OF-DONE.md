# Lesson — Definition of Done

A generated lesson is **not done** when the MP4 renders. It is done when it passes **four gates**.
The first two answer *"is it on-outline, current, and does it teach?"*; the third answers
*"does the finished video actually work and teach when watched?"* by having Claude **watch the MP4**;
the fourth — Gate L — machine-measures the render DOM for the typography/layout defect class that
human review caught on 2026-06-08 and the watch gate missed.

> Why this exists: schema ✓, render ✓, audio ✓, coverage ✓ all pass on "word soup" — facts in
> outline order that teach nobody, or a render with garbled on-screen text. None of those checks
> watch the result. The `/watch` gate does. (See the v1→v2 build feedback and
> `.claude/skills/lesson-plan/`.)

Run the gates in order. Each produces a written artifact under
`content/lessons/<id>/review/`. Do not say "done" until all three pass.

---

## Gate A — Fidelity · Provenance · Freshness  *(KEEP — `accuracy-sweep`)*
*Is it on-outline and current?*

- **Fidelity** — every script/deck block maps to an outline **row id** (from the lesson-plan).
- **Provenance** — every tool claim carries a **source ref**; enrichment added no scope.
- **Freshness** — model / price / capability facts are **dated and cited** against official docs.

→ Run the `accuracy-sweep` skill on the deck + script. Output: `FACT-CHECK-REPORT.md`.
Every ✗ fixed; every ⚠ ruled on by Instructor. **Blocks done until zero unresolved ✗.**

## Gate B — Teaching axis  *(NEW — verified against the lesson-plan)*
*Does it actually teach?* Check the lesson against its own `lesson-plan.md` acceptance checks:

- [ ] Opens on what the learner will be able to do, not on a feature list
- [ ] Teaches a transferable pattern, not just a list of examples
- [ ] Every learning objective in the lesson plan is addressed by at least one beat
- [ ] Each framework is introduced once, clearly, and used consistently
- [ ] Expectations set up front (what it **is** and **is not**); scaffolding holds (rests on prior lessons)
- [ ] No filler; the pacing respects the learner's time and intelligence
- [ ] Course-wide consistency: terminology stable, identical signposts, regular engagement beats

→ Output: `content/lessons/<id>/review/teaching-axis.md` (pass/fail per check + notes).
**Blocks done until every box is checked or a flagged revision is logged to `assumptions.md`.**

## Gate C — Watch gate  *(NEW — `/watch` on the rendered MP4)*
*Does the finished video actually work and teach when watched?*

This is the terminal gate the team asked for: before any lesson is called done, **Claude watches
the actual MP4** and verifies the output — catching render breakage, garbled/hallucinated on-screen
text, off-brand visuals, and audio drift that artifact-checks miss.

**Run:**
```bash
# Needs ffmpeg + yt-dlp on PATH (see security review).
python3 ".claude/skills/watch/scripts/watch.py" "out/<id>.mp4" --resolution 1024
```
(Use `--resolution 1024` so on-screen text is legible. Add `--start/--end` to zoom into a beat. A
Whisper key is optional — frames alone catch the visual failures; add a key to also verify narration.)

Then **Read every frame** the script lists and check the MP4 against the lesson-plan:

- [ ] **Renders & plays** — non-blank frames throughout; no frozen/black/corrupt stretches
      (this subsumes `npm run verify:render`, and goes further by actually viewing frames)
- [ ] **On-screen text is correct** — titles, lesson numbers, captions match the script; **no
      garbled, clipped, or hallucinated text** introduced in render
- [ ] **Typography integrity** *(added after the 2026-06-08 PASS→FIX downgrade)* — multi-line
      titles show clean leading (no ascender/descender collision, no "line through letters");
      quote marks are matched (opening AND closing); no glyph spills its box or collides with
      neighbors; spacing reads on the 4px scale; nothing crosses the safe area
- [ ] **Brand compliance visible** — Syne, warm-linen `#EDE8E3` + crimson `#8B2635`, 4px radius;
      smooth motion (no choppy slide transitions)
- [ ] **Signposts legible** — progress map, expectations, delivery-type cues, engagement beats
      appear where the plan places them
- [ ] **No AI hallucinations on screen or in narration** — every visible/spoken claim traces to the
      sourced lesson-plan (cross-check anything new against Gate A)
- [ ] **Audio aligns** (if a Whisper key is set) — narration matches the on-screen beat at its timestamp

→ Output: `content/lessons/<id>/review/watch-gate.md` — verdict, the frame timestamps inspected, and
any defect with its `t=MM:SS`. **Blocks done until clean (or defects logged + re-rendered).**

## Gate L — Layout integrity  *(NEW 2026-06-09 — automated, `gate:layout`)*
*Is the render geometrically sound?* DOM measurement inside the real render (Remotion renders real
DOM in headless Chrome) at one settled frame per scene:

- **No clipping** — no element's content overflows a box that cuts it off
- **No text outside the safe area** — `SAFE_AREA` inset from `src/brand/tokens.ts`
- **No text-on-text overlap** — unrelated text leaves may not materially intersect
  (decorative `data-decor` elements are exempt)

**Run:** `npm run gate:layout -- <id>` → writes `content/lessons/<id>/review/layout-gate.md`
(Verdict: PASS|FIX) + evidence stills in `out/verify/layout/`. Exit 0 only on PASS.
This gate exists because schema/render/brand checks all passed on a video with an unclosed quote
glyph overflowing into the eyebrow and colliding title lines — geometry has to be measured, not assumed.

## Gate T — Timing integrity  *(NEW 2026-06-11 — automated, `gate:timing`)*
*Is the rendered video close enough to the planned lesson length?* Compares ffprobe duration against
`lesson.minutes` from `course-map.json` (the top-level integer — NOT the sum of row minutes, which
includes live-class rows not in the recorded video):

| Zone | Condition | Verdict |
|---|---|---|
| PASS | 75% ≤ ratio ≤ 120% | PASS |
| WARN-low | 60% ≤ ratio < 75% | WARN |
| WARN-high | 120% < ratio ≤ 130% | WARN |
| FAIL-low | ratio < 60% | FIX |
| FAIL-high | ratio > 130% | FIX |

**Run:** `npm run gate:timing -- <id>` → writes `content/lessons/<id>/review/timing-gate.md`
(Verdict: PASS|WARN|FIX). Exits 0 on PASS or WARN, exits 1 on FIX.
`Verdict: WARN` is not matched by `parseGateState`'s `/pass|fix|fail/` regex, so WARN counts as
not-green for `canPublish` — it blocks publish just as FIX does, but the script exits 0 so CI/CD
can distinguish an informational undershoot from a hard failure.

---

## Done =
`lesson-plan.md` approved  →  MP4 rendered  →  **Gate A ✓ · Gate B ✓ · Gate C ✓ · Gate L ✓ · Gate T ✓**  →
publish to Teachable. Record the five artifacts under `content/lessons/<id>/review/` and link them
from the lesson's status. Anything short of five green gates is **in review**, not done.

> Note: `module-1` is a website-walkthrough reel (#53), not a course lesson. Keep
> `topic-1-lesson-1` clearly labeled as the first outline-led draft so the two never blur — the gates
> apply to outline-led lessons.
