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

## Synthesis

(populated as query answers are filed back)
