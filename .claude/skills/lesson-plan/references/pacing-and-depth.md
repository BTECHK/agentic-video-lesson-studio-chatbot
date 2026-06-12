# Pacing & depth — the word-budget discipline

Why this exists: lessons need enough narration to teach each concept, so length is budgeted from a words-per-minute target.

## The math (measured, not guessed)

Duration is **audio-authoritative** (timing inversion): the narration's length IS the video's
length. Our measured TTS pace across the shipped corpus is **2.96 words/sec ≈ 178 wpm** (±10%).
So for a lesson whose course-map row allots **M minutes**:

| Quantity | Formula | 8-min example |
|---|---|---|
| Authoring target | `M × 60 × 2.96 × 0.85` | ~1,208 words |
| Hard floor (Gate T fails below) | `M × 60 × 2.96 × 0.75` | 1,066 words |
| Ceiling | `M × 60 × 2.96 × 1.20` | 1,705 words |

These are enforced mechanically — you cannot skip them:
1. `generate-script <id>` embeds the budget in the prompt (hard constraint section).
2. `generate-script <id> --check` **fails** a SHORT script before any render.
3. `gate:timing` (Gate T) fails the rendered MP4 outside 75–120% of outline minutes.

## Per-beat allocation (do this in the lesson plan's §4 beat table)

Distribute the lesson target across beats **by each beat's row minutes** — add a "~words" column
to the beat table. Demo beats get MORE than their share, not less: a demo narrates input → output →
what to notice at walkthrough pace (a 4-minute demo row ≈ 600 words across multiple scenes, one
scene per demo moment). Engagement beats include the doing-instruction at full length.

## Depth, not padding (how to spend the words)

If a beat lands far under its allocation, it was **summarized, not taught**. Expand with teaching
moves — never filler:
- the worked example, run end-to-end (not "you could, for example…")
- a vetted story or example from the lesson's source notes
- the contrast ("here's what most people do instead — and why it fails")
- the mistake-to-avoid / honest caveat (paid-tier notes, verification habits)
- the mini-recap + so-what before the transition

**Calibration:** a single concept needs a setup, an example and a recap. When in doubt, compare against a comparable finished lesson and match its dwell, not its filler.

## Smell tests

- Script done but `--check` says SHORT → you compressed rows; reopen the beats furthest under
  allocation and teach them (don't sprinkle words everywhere).
- A "10-minute lesson" script of ~250 words is a 2.5-minute video. Every time. The math has no
  exceptions — catch it at the plan, not at the render.
