# Wiki Log

Append-only chronological record of operations on the wiki. Each entry begins with `## [YYYY-MM-DD] <op> | <description>` so it's parseable with `grep "^## \[" log.md | tail -N`.

Operations:
- `ingest` — a source was processed into the wiki.
- `query` — a question was answered against the wiki (typically only logged when the answer was filed back as synthesis).
- `lint` — a health check was run.
- `schema` — the schema was modified.
- `shard` — an index was sharded.

---

## [2026-05-26] schema | Set wiki purpose: architecture decisions, API behaviors, domain knowledge for the Sample Academy AI Content System.
## [2026-05-26] ingest | Project README → project overview and source summary.
## [2026-05-26] ingest | Codified Lesson Factory design spec → source [[codified-lesson-pipeline-design]], concepts [[codified-lesson-pipeline]] + [[timing-inversion]].
## [2026-05-26] ingest | Studio Generate design spec → source [[studio-generate-design]], concept [[studio-generate]].
## [2026-06-22] ingest | Claude Design ⇄ Remotion fidelity diagnosis → concept [[design-fidelity-html-vs-mp4]]; learnings.md updated (design-sync N/A, codex-sandbox -1073741502, drive-date quirk).
## [2026-06-26] ingest | Video output-surface accounting → concept [[video-output-map]] (out/* lessons+sizzle vs output/video/* walkthrough+showcase; search BOTH); learnings.md updated. Trigger: platform-walkthrough reported "missing" 3× because it lives in output/video/, not out/.
## [2026-07-02] ingest | v3 render corpus accounting refresh → updated [[video-output-map]] with the `out/v3/` status, the Drive publish state and the in-progress `BUILD-walkthrough-v3` task (so the walkthrough path doesn't go missing a 4th time). Verified against the filesystem (`out/v3/*.mp4` timestamps) and git log, not asserted from the prompt alone.
## [2026-07-04] ingest | Fable e2e pre-UAT audit COMPLETE → updated [[video-output-map]]: a batch of lessons plus the walkthrough re-rendered with audit fixes (systemic bottom-band collision, DemoCue freeze, narration defects), re-published to Drive; walkthrough now BT.709+audible+alive, published to 00 — START HERE. Full report: artifacts/verification/fable-e2e-audit/AUDIT-REPORT.md (owner flags recorded there). learnings.md +7 ops entries (dockerInference, audio freshness, OneDrive root-loss, EBUSY, archive guard, font CDN, SceneFrame centering).
