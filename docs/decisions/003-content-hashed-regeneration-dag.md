# ADR-003: A small content-hashed DAG rebuilds only what changed

- **Status:** Accepted and implemented. The engine and the per-lesson graph first appear in the history on 2026-05-23; the two-pass build was added later to fix two recorded staleness bugs.
- **Scope:** incremental regeneration of a lesson: plan, per-scene speech, alignment, render.

## Context

The product promise is that a lesson is data: change a tool fact, a script line or a reviewer comment
and the affected audio, timing and video follow
([design spec](../superpowers/specs/2026-05-23-codified-lesson-pipeline-design.md), "Core value"). The
alternative is rebuilding a whole lesson for every edit, and the expensive parts are expensive: speech
synthesis for every scene, then a render that the error log puts at hours for a batch of lessons.

Two environmental facts shaped the design. The artifacts live on Docker bind mounts, where file
modification times are not reliable. And one of the pipeline's steps, script generation by a language
model, cannot run unattended from a CLI, so it cannot be an ordinary build step.

## Decision

Write a small purpose-built engine, [`src/lib/build-dag.ts`](../../src/lib/build-dag.ts) (131 lines), and
describe each lesson as a graph over it in [`src/lib/regen-graph.ts`](../../src/lib/regen-graph.ts).

**Engine rules**

- A node is `{ id, deps, inputs(), output, version, run() }`. Its **cache key is the SHA-256 of the step
  version plus the SHA-256 of each input's content**. Content, never mtime.
- `inputs()` is read lazily at run time so a node sees the freshly rebuilt outputs of its dependencies.
- A node is skipped when its stored key equals the current key and its output file exists; otherwise it
  runs and the change cascades to dependents, because their inputs include the rebuilt output.
- `version` is bumped to force a rebuild when a step's logic changed but its inputs did not.
- On failure the node's cache entry is deleted (so the next run retries it) and every dependent is
  marked `skipped` instead of running on stale inputs.
- `topoSort` throws on a cycle or an unknown dependency. `--dry` reports what would rebuild without
  running or writing anything.

**Graph rules (per lesson)**

```
plan  ->  tts:<sceneId> (one per narrated scene)  ->  align  ->  render
```

- `plan` hashes `outline.json` and `script.json`.
- Each `tts:<sceneId>` node hashes only that scene's narration text, so editing one scene resynthesizes
  one WAV.
- `align` hashes the WAV and word-timing files, **not** `lesson.json`, because `align` rewrites that file
  in place and hashing its own output would make it perpetually stale.
- `render` hashes `lesson.json`; its `version` is 2 because an earlier version rendered the wrong
  lesson's data (a fix recorded in the file).
- **Script generation is not a node.** It is a Claude passthrough step. Instead `script.json` is an input
  to `plan`, so a person, or the AI-edit step that applies a reviewer comment
  ([`ai-regen.ts`](../../src/lib/ai-regen.ts)), edits it and the next `regenerate` cascades.
- **Two passes.** `runLessonRegen` runs `plan` first, then builds the remaining nodes from the freshly
  planned `lesson.json`.

The per-lesson cache is `content/lessons/<id>/.regen-cache.json`
([`scripts/regenerate.ts`](../../scripts/regenerate.ts)). The console triggers the same script through a
validated argument builder ([`regen-trigger.ts`](../../chatbot/src/lib/regen-trigger.ts)).

## Consequences

Positive:

- Editing one scene's narration rebuilds one speech node, then `align` and `render`; a second run with no
  changes rebuilds nothing. Both behaviours are tests in
  [`test/regen-graph.test.ts`](../../test/regen-graph.test.ts).
- The engine is pure orchestration with injected `inputs()` and `run()`, so it is tested with an
  in-memory store and no real tools ([`test/build-dag.test.ts`](../../test/build-dag.test.ts)): stable keys,
  changes on input or version change, no collision when input boundaries shift, cycle and unknown-dependency
  errors, cascade to dependents, unrelated siblings left fresh.
- The two-pass build removed two documented bugs: narration edits shipping stale audio in one pass, and
  scenes added or removed by `plan` leaving missing or orphaned nodes. Both have regression tests.
- On this public copy `npx tsx scripts/regenerate.ts topic-1-lesson-1 --dry` exits 0 and reports nine nodes
  that would rebuild (one plan, six speech nodes, align, render), because the audio artifacts are not
  included.

Costs and known gaps:

- **Correctness depends on declaring inputs.** `render` hashes `lesson.json` only, so a change to a scene
  component or a design token does not invalidate a render; someone must bump `version` (as was done once)
  or delete the cache. `tts:*` hashes narration text only, so switching voice or engine does not rebuild.
  This is the same class of problem the gates hit with stale verdicts (ADR-004).
- **Render granularity is the whole lesson.** Any change re-renders the full video; per-scene render
  caching does not exist.
- **Single-machine, file-based cache.** There is no shared or remote cache.
- The engine does not run steps in parallel; nodes execute in topological order.

## Alternatives considered

- **Modification-time (make-style) freshness.** Rejected in the source: mtimes are unreliable on the mounts
  the artifacts live on.
- **Building every node from one snapshot of `lesson.json`.** This was the first implementation and is
  what the two-pass build replaced after the two bugs above.
- **Rebuilding the whole lesson per change.** The pre-DAG situation the design spec was written against.
- **Making script generation a DAG node.** Not possible unattended, because generation is a Claude
  passthrough; hashing `script.json` as an input gets the same cascade without pretending otherwise.

## Evidence

- Code: [`build-dag.ts`](../../src/lib/build-dag.ts), [`regen-graph.ts`](../../src/lib/regen-graph.ts),
  [`regenerate.ts`](../../scripts/regenerate.ts), [`ai-regen.ts`](../../src/lib/ai-regen.ts),
  [`tts-adapter.ts`](../../src/lib/tts-adapter.ts)
- Tests: [`test/build-dag.test.ts`](../../test/build-dag.test.ts), [`test/regen-graph.test.ts`](../../test/regen-graph.test.ts),
  [`test/ai-regen.test.ts`](../../test/ai-regen.test.ts)
- Design: [`wiki/concepts/codified-lesson-pipeline.md`](../../wiki/concepts/codified-lesson-pipeline.md)
- Sequence diagram: [ARCHITECTURE section 5](../ARCHITECTURE.md#5-sequence-the-regeneration-dag)
