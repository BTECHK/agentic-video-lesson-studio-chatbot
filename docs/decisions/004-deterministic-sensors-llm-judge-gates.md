# ADR-004: Deterministic sensors plus an LLM judge, with a fail-closed definition of done

- **Status:** Accepted and implemented. The gate aggregator first appears on 2026-06-08 (three gates), the geometry gate on 2026-06-09, the timing gate on 2026-06-11, the media and motion gates on 2026-06-20 to 2026-06-23, and the corpus ledger on 2026-07-15.
- **Scope:** what "a lesson is done" means and how it is decided.

## Context

Passing schema validation, rendering, and having audio does not mean a lesson is good. The project's
definition-of-done document says such checks pass "word soup": correct facts that teach nobody, or a
render with garbled on-screen text ([`.planning/curriculum/LESSON-DEFINITION-OF-DONE.md`](../../.planning/curriculum/LESSON-DEFINITION-OF-DONE.md)).
Real defects then shipped past the first gates:

- Overlapping and overflowing typography passed the watch gate on 2026-06-08
  ([`wiki/concepts/layout-integrity-gate.md`](../../wiki/concepts/layout-integrity-gate.md)).
- A promo render shipped as a slideshow, silent and tagged with the wrong colour space, because nothing
  inspected the encoded file ([`.planning/MOTION-CONTRACT.md`](../../.planning/MOTION-CONTRACT.md)).
- During a proof of a two-path setup, a cheaper multimodal model wrongly claimed a tool capability,
  which is why a sensor model is never allowed to be the judge
  ([`wiki/concepts/architecture-decisions.md`](../../wiki/concepts/architecture-decisions.md), ADR-002).
- A multi-lesson review was reported complete when only a subset of lessons had run (the corpus rules in
  [`CLAUDE.md`](../../CLAUDE.md)).

## Decision

1. **Five gates, each a file.** A: fidelity, provenance and freshness (`FACT-CHECK-REPORT.md`); B: does it
   teach (`teaching-axis.md`); C: a judge watches the MP4 (`watch-gate.md`); L: geometry
   (`layout-gate.md`); T: timing (`timing-gate.md`). Each artifact's **first non-empty line** is
   `Verdict: PASS` or `Verdict: FIX` (`WARN` for the timing band).
2. **Sensors are deterministic and dumb; the judge is an LLM; a sensor model is advisory.**
   - Geometry: [`LayoutProbe.tsx`](../../src/compositions/lesson-scenes/LayoutProbe.tsx) runs inside the real
     render DOM and reports `getBoundingClientRect` for text leaves and clipped boxes; the pure analyzer
     [`gate-layout.ts`](../../src/lib/gate-layout.ts) applies three rules (clip, safe area, overlap).
   - Timing: ffprobe duration against outline minutes ([`gate-timing.ts`](../../src/lib/gate-timing.ts)).
   - Media and motion, on the encoded file ([`gate-media.ts`](../../src/lib/gate-media.ts),
     [`gate-motion.ts`](../../src/lib/gate-motion.ts), probes in [`media-probe.ts`](../../src/lib/media-probe.ts)):
     audio stream present with peak at or above -30 dBFS; `color_space` equal to `bt709`; at least 60
     percent of sampled frame pairs show change; no still longer than 2.5 seconds.
   - Judgement: [`claude-judge.ts`](../../src/lib/claude-judge.ts) runs headless `claude -p` with the
     prompt on stdin and web tools allowed so vendor documentation can be fetched. Gate C's audio
     transcript comes from a sensor model and is labelled advisory in the judge prompt
     ([`gate-lesson.ts`](../../src/lib/gate-lesson.ts)). Sensor backends are configured in
     [`scripts/review-providers.json`](../../scripts/review-providers.json).
3. **Fail-closed parsing.** [`parseGateState`](../../src/lib/gate-status.ts) returns `pass` only if the
   first non-empty line is a PASS verdict. Missing file is `missing`. A file with no parseable verdict is
   `fix`. `WARN` is not green. Judges that wrap output in preamble are normalised at write time by
   `stripJudgePreamble` so the parser can stay strict.
4. **Stale verdicts do not count.** Gates C, L and T judge the rendered MP4; if their artifact is older than
   the MP4, `gate:status` reports it stale, which is not green.
5. **The publish boundary re-checks the real file.** [`publish-to-drive.ts`](../../scripts/publish-to-drive.ts)
   requires all five artifacts green, probes the source MP4 for media and motion, and refuses without an
   explicit `--force`.
6. **Batch claims are counted.** `npm run corpus:ledger` enumerates lessons from the filesystem, prints one
   row per lesson and an `N/N` line, and exits non-zero unless all are green
   ([`corpus-ledger.ts`](../../src/lib/corpus-ledger.ts)).
7. **A human keeps the publish click.** The gates decide whether publishing is allowed, not whether it
   happens.

## Consequences

Positive:

- Every completion claim is an artifact with a machine-readable first line; the decision logic is pure
  and unit-tested ([`test/gate-status.test.ts`](../../test/gate-status.test.ts),
  [`gate-layout`](../../test/gate-layout.test.ts), [`gate-timing`](../../test/gate-timing.test.ts),
  [`gate-media`](../../test/gate-media.test.ts), [`gate-motion`](../../test/gate-motion.test.ts),
  [`gate-review`](../../test/gate-review.test.ts), [`claude-judge`](../../test/claude-judge.test.ts)).
- The strict first-line rule came from an independent-model review finding recorded in the code, and
  the regression test is named after it.
- The geometry gate found a corpus-wide problem when it was re-run: the ambient-glow layer overflowed a
  clipped box on every scene, and the fix was to mark decorative overflow with `data-decor` (recorded in
  the wiki page above).
- The ledger reports a count with per-lesson state (for example "N/M lessons fully green"), not a bare "done".
- The judge and sensors are replaceable: gate artifacts are plain files, so another agent can produce them.

Costs and known gaps:

- **LLM judges are slow, non-deterministic and need a logged-in CLI.** Each call has a ten-minute
  timeout, and the verdict is only as good as the checklist in the definition-of-done file.
- **The motion gate can be satisfied by background motion alone.** The project's own audit notes that a
  drifting ambient layer raises the changing-frame fraction on its own
  ([`docs/PLAN.md`](../PLAN.md), finding 5). It proves "not a frozen slideshow", not "meaningful foreground
  animation". Its thresholds were calibrated on a handful of renders (table in the motion contract).
- **Stale-check asymmetry.** `gate:status` applies the modification-time rule; `publish:drive` builds the
  same summary without file times, so run `gate:status` first.
- **Portability.** [`scripts/gate-lesson.ts`](../../scripts/gate-lesson.ts) spawns `python` for its frame and
  transcript sensors, and the judge spawns `claude` through a shell. A machine that exposes only `python3`
  needs an alias. The Stop-hook registration was removed for the same reason (ADR-007).
- **This public copy cannot exercise the gates end to end.** There are no renders or review bundles, so
  `npm run gate:status -- topic-1-lesson-1` reports all five gates as not run and exits 1, and
  `npm run corpus:ledger` prints `CORPUS: 0/2 lessons fully green`. The pure logic is covered by tests.
  `ffmpeg` and `ffprobe` are required for the timing, media and motion gates and are not bundled.

## Alternatives considered

- **Trust a single multimodal model as judge.** Rejected after the wrong-capability claim above.
- **Rely on schema, render and audio checks.** Rejected: these pass content that teaches nothing.
- **Auto-publish when green.** Rejected in the decision log: production-grade output keeps a human in the
  loop.
- **Judge geometry by eye or with the watch gate alone.** Rejected after the 2026-06-08 defects; measuring
  the DOM is cheaper and more reliable, and is possible only because the video is rendered from real DOM.
- **Trust cached verdicts.** Rejected: a code change can invalidate every cached geometry verdict while a
  status command still reports the old pass. The wiki calls this the stale-artifact trap.

## Evidence

- Code: [`gate-status.ts`](../../src/lib/gate-status.ts), [`gate-review.ts`](../../src/lib/gate-review.ts),
  [`gate-lesson.ts`](../../src/lib/gate-lesson.ts), [`claude-judge.ts`](../../src/lib/claude-judge.ts),
  [`gate-layout.ts`](../../src/lib/gate-layout.ts), [`gate-timing.ts`](../../src/lib/gate-timing.ts),
  [`gate-media.ts`](../../src/lib/gate-media.ts), [`gate-motion.ts`](../../src/lib/gate-motion.ts),
  [`media-probe.ts`](../../src/lib/media-probe.ts), [`corpus-ledger.ts`](../../src/lib/corpus-ledger.ts)
- Scripts: [`scripts/gate-status.ts`](../../scripts/gate-status.ts), [`scripts/gate-layout.ts`](../../scripts/gate-layout.ts),
  [`scripts/gate-timing.ts`](../../scripts/gate-timing.ts), [`scripts/publish-to-drive.ts`](../../scripts/publish-to-drive.ts)
- Docs: [`.planning/curriculum/LESSON-DEFINITION-OF-DONE.md`](../../.planning/curriculum/LESSON-DEFINITION-OF-DONE.md),
  [`.planning/MOTION-CONTRACT.md`](../../.planning/MOTION-CONTRACT.md),
  [`wiki/concepts/layout-integrity-gate.md`](../../wiki/concepts/layout-integrity-gate.md)
- Sequence diagram: [ARCHITECTURE section 6](../ARCHITECTURE.md#6-sequence-the-gate-flow-to-publish)
