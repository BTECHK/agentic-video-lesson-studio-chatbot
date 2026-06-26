# Wiki Index

The catalog of all pages in this wiki. Each entry: a wikilink to the page and a one-line summary. The LLM reads this first when answering queries to identify candidate pages.

Keep summaries tight — one line each. The index is engineered to be cheap to read; a fat index defeats its purpose.

When this file exceeds ~300 lines or the wiki passes ~150 pages, shard into `wiki/indexes/<type>.md` and replace this file with a directory of shards. See the `scaling-playbook.md` reference in the `llm-wiki` skill for the migration procedure.

---

## Sources

- [[codified-lesson-pipeline-design]] — 2026-05-23 design spec for the lesson factory (the 6-stage generation DAG, PR #37).
- [[studio-generate-design]] — 2026-05-24 design spec for website-driven generation (GenerationProvider, draft→Apply flow).

## Concepts

- [[codified-lesson-pipeline]] — lesson-as-data architecture; the 6-stage content-hashed generation DAG.
- [[timing-inversion]] — narration audio length drives scene duration (the pipeline's conceptual core).
- [[studio-generate]] — web-driven generation front door; GenerationProvider backends + draft→Apply gate.
- [[architecture-decisions]] — running ADR log + ELI5: why each tool/architecture was chosen (Claude-as-engine, the 3 gates, Remotion video, Playwright capture, course-map, engine-agnostic verification). Stakeholder-defensible.
- [[layout-integrity-gate]] — Gate L: DOM-measured no-clip/safe-area/overlap; the 4th gate (DoD now A·B·C·L).
- [[standalone-bot]] — student-facing Tutor bot (bot/): Telegram-first, Gemini-free, Cloud Run webhook; channel-adapter seam + citation guard.
- [[design-fidelity-html-vs-mp4]] — why the Remotion MP4 reads softer/duller than the Claude Design HTML: resolution/DPI → codec → implementation/motion (color is byte-identical); the renderStill-vs-MP4 diagnostic seam + the 2× SSAA fix.
- [[video-output-map]] — the two rendered-video trees: `out/*` (lessons+sizzle, with v2/v3 subdirs) vs `output/video/*` (platform-walkthrough + brand-showcase, separate compositions). Search BOTH when auditing.

## Synthesis

(populated as query answers are filed back)
