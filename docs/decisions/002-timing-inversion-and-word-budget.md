# ADR-002: Narration audio drives scene duration, and script length is budgeted at three layers

- **Status:** Accepted and implemented. Timing inversion first appears in the history on 2026-05-23; the word budget and the timing gate on 2026-06-11.
- **Scope:** how scene durations are computed, and how script length is controlled before an expensive render.

## Context

Each scene is narrated by synthesized speech. Originally a scene's `duration` (in frames) was authored
by hand and a validator only checked that scenes were contiguous
([spec section 3.2](../superpowers/specs/2026-05-23-codified-lesson-pipeline-design.md)). That breaks
the moment narration changes: the audio and the animation drift apart, and someone has to re-time
frames by hand.

Making audio authoritative has a second-order effect. If duration follows audio, then **the number of
words in the script is the length of the video**. Rendering is the slow step (the project's error log
records a batch of lessons, over an hour of video, taking roughly two to three hours to render
serially), so discovering a script that is too short only after a render is expensive. A script that
"summarizes instead of teaching" was the observed failure: the test suite names it "the 2-minute-lesson
failure mode".

## Decision

### A. Timing inversion

Durations are computed in three passes:

1. **Pre-audio estimate** for previews. [`scene-planner.ts`](../../src/lib/scene-planner.ts) estimates
   frames from word count (150 words per minute at 30 fps, plus a 0.6 second settle), floored by a
   per-scene-type minimum so a reveal animation can always finish.
2. **Authoritative pass.** After synthesis, [`align-lesson.ts`](../../scripts/align-lesson.ts) measures
   each WAV and [`timing.ts`](../../src/lib/timing.ts) replaces the estimate with
   `ceil((measured seconds + 0.6) or the type floor, whichever is larger, x fps)`. Scenes with no
   measured audio keep their estimate.
3. **Recompute the timeline.** Starts are made contiguous and `lesson.duration` becomes the last scene's
   end. `LessonSchema` (ADR-001) then re-validates, so the contiguity check that used to be a lint is now
   the guarantee the generator must satisfy. `applyMeasuredTimings` is pure and returns a new lesson.

### B. Word budget at three layers

[`word-budget.ts`](../../src/lib/word-budget.ts) converts an outline's minutes into word limits:
`minutes x 60 x 2.96 words per second`, with an authoring target of 85 percent, a floor of 75 percent
and a ceiling of 120 percent. The floor and ceiling deliberately mirror Gate T's pass band so a script
that passes pre-flight cannot fail Gate T on length. The same constraint is enforced three times:

| Layer | When | Where | Behaviour |
|---|---|---|---|
| 1. Generation prompt | Authoring | `renderLengthBudget` in [`script-prompt.ts`](../../src/lib/script-prompt.ts), wired in [`scripts/generate-script.ts`](../../scripts/generate-script.ts) | States target, floor, ceiling and a per-beat allocation as a hard constraint |
| 2. Pre-flight check | Seconds after generation | `generate-script.ts --check`, using `checkScriptLength` | Exits 1 if the script is under the floor (`SHORT`); a script over the ceiling only warns; skipped with a warning if the lesson is not in the course map |
| 3. Timing gate | After render | [`gate-timing.ts`](../../src/lib/gate-timing.ts), [`scripts/gate-timing.ts`](../../scripts/gate-timing.ts) | ffprobe duration divided by `lesson.minutes x 60`: `PASS` from 75 to 120 percent, `WARN` from 60 to 75 or 120 to 130, `FIX` outside. `WARN` is not green for publishing |

The pace constant is documented in the source as measured, not guessed: the comment records
thousands of words across a batch of lessons shipped at that time (about 2.96 words per second, or roughly
178 words per minute). That corpus is not part of this public copy, so the figure cannot be re-derived
here.

## Consequences

Positive:

- Changing a line of narration moves the scene's on-screen time automatically; captions, audio and
  animation stay aligned without manual re-timing, and the schema guarantees a contiguous timeline.
- A too-short script fails in seconds at layer 2 instead of after a render at layer 3.
- The logic is pure and covered by unit tests
  ([`test/timing.test.ts`](../../test/timing.test.ts), [`test/word-budget.test.ts`](../../test/word-budget.test.ts),
  [`test/gate-timing.test.ts`](../../test/gate-timing.test.ts)).

Costs and known gaps:

- **Layer 1 is not applied on every generation path.** The web-driven headless generator,
  [`scripts/generate-script-headless.ts`](../../scripts/generate-script-headless.ts), calls
  `buildScriptPrompt` without a budget, so on that path only layers 2 and 3 catch a short script. No
  unit test in this checkout references `buildScriptPrompt`, so layer 1's wiring is untested.
- **Two different pace constants.** The planner's preview estimate uses 150 words per minute; the
  budget uses the measured 2.96 words per second. This is harmless because the estimate is always
  replaced by the authoritative pass, but the numbers disagree.
- **Words are a proxy for minutes.** Demo-heavy scenes with long dwell times can drift from a
  words-based estimate; that is what the Gate T warning band is for.
- **Durations cannot be final before audio exists.** The workflow needs a synthesis step before
  timing is trustworthy.
- **Per-type floors are hand-set numbers**, defined for 10 of 18 scene types.

## Alternatives considered

- **Keep hand-authored durations with a contiguity validator.** The starting point; it does not survive
  narration edits.
- **Enforce length only after the render (Gate T).** The source comments give the reason this was not
  enough: the feedback arrives after a render of about half an hour per lesson.
- **A single layer of enforcement.** The layers catch different failures: the prompt prevents the
  problem, the pre-flight check catches a model that ignored it, the gate catches everything else,
  including scenes whose dwell time changed the real length.

## Evidence

- Code: [`timing.ts`](../../src/lib/timing.ts), [`scene-planner.ts`](../../src/lib/scene-planner.ts),
  [`assemble.ts`](../../src/lib/assemble.ts), [`align-lesson.ts`](../../scripts/align-lesson.ts),
  [`word-budget.ts`](../../src/lib/word-budget.ts), [`script-prompt.ts`](../../src/lib/script-prompt.ts),
  [`generate-script.ts`](../../scripts/generate-script.ts), [`gate-timing.ts`](../../src/lib/gate-timing.ts)
- Design: [`wiki/concepts/timing-inversion.md`](../../wiki/concepts/timing-inversion.md),
  [`docs/superpowers/specs/2026-05-23-codified-lesson-pipeline-design.md`](../superpowers/specs/2026-05-23-codified-lesson-pipeline-design.md)
- Incident record: [`.planning/ERROR-LOG.md`](../../.planning/ERROR-LOG.md) (entry 8)
- Reproduce the pre-flight: `npx tsx scripts/generate-script.ts module-1 --check` (module-1 is not in
  the sample course map, so the length check is reported as skipped)
