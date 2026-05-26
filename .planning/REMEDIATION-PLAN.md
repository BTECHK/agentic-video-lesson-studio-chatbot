# Feedback-Batch Remediation Plan

**Branch:** `fix/feedback-batch-remediation` (off `master` @ a6e9313)
**Created:** 2026-05-26
**Mode:** Autonomous. One PR at the end. Atomic commits per issue, gate-green throughout (typecheck + lint + test on changed slice, enforced by Stop hook).
**Scope (owner-approved):** "Everything possible incl. #28 skeleton."

## Owner decisions baked in (from 2026-05-26 question round)

- **Sourcing (#35/#36):** Vendor-official sources for capability claims; third-party benchmark aggregators (LMSYS Arena, Artificial Analysis) kept **with explicit per-metric attribution** for ELO/Quality/Speed rows that vendors don't publish.
- **#28 Teachable:** No programmatic upload exists (API read-only + paywalled $189+/mo → violates no-paid-services). Build a **manual export/staging step**: finished lessons render into `publish/<id>.mp4` ("ready-for-upload"). Human drags into Teachable. No API integration.
- **#28 Architecture:** Keep ONE Next.js app. Reframe `/` as the internal ops home (folds into #32). Keep marketing content as a surface. No repo split, no auth provider this run.
- **#28 HTML deck:** Rename/rebrand as platform-walkthrough demo; strip "Module 1 lesson" framing. Do NOT delete.
- **#28 walkthrough scenes:** Intentional demo set — document, don't remove.
- **#28 lesson scenes:** 9/14 built. Build the remaining 5.
- **Workflow:** Fresh branch off master, single PR at end.

## Execution order

### Phase 1 — #28 decomposition (foundations, low-risk)
1. **#28a** Rename/rebrand HTML deck `module-1-slides.html` → walkthrough-demo framing. Update any references.
2. **#28b** Build 5 remaining lesson scene components (`comparison-chats`, `demo-cue`, `dig-deeper`, `setup-checklist`, `voice-demo`) using `remotion-best-practices` skill + existing `lesson-scenes/` primitives. TDD + visual stills.
3. **#28c** Teachable manual export/staging: `publish/` staging convention + `scripts/publish-lesson.ts` that copies a validated final MP4 to `publish/<id>.mp4`. Document the upload handoff.
4. **#28d** Document walkthrough demo scenes as intended (README/comment in `src/compositions/scenes/`).

### Phase 2 — Data (#36 → #35)
5. **#36** Vendor-official market research via market-research skill (parallel agents per vendor group). Output → research dataset feeding tool JSONs + benchmarks.
6. **#35** Refresh `chatbot/src/lib/benchmarks.ts` to current models; add per-metric source attribution; surface provenance on the compare UI.

### Phase 3 — UI / IA (#32 → #33 → #34)
7. **#32** IA restructure: left-hand sidebar; `/` becomes internal ops home; Lesson Planning hub (Studio/Generate/Menu); Repository hub (Tool Repository/Comparison); Ingestion as subpage. Marketing content preserved as a surface.
8. **#33** Studio: collapse Script + Captions tracks into one **Narration** row; surface the outline (objectives/beats).
9. **#34** Studio: Cancel button to abort an in-flight Generate.

### Phase 4 — Deferred infra (error-log items)
10. **#20** Auto-create `.env` from `.env.example`.
11. **#21** POSIX paths in host→container TTS.
12. **#22** CPU-only torch for TTS sidecar.
13. **#23** Batch TTS scenes, bake spaCy model.
14. **#18** Phase G polish: wavesurfer peaks + scene thumbnails + AI-regen wiring.

## Cannot do autonomously (Instructor/owner-blocked — left untouched)
- #2 Module 1 animation (awaiting Instructor final content)
- #12 Stakeholder demo animation (blocked)
- #14–17 Content integration (need Instructor materials/decisions)
- #31 Curriculum review (Instructor annotates)
- #28e Re-baseline README status table — done last, reflecting actual delivery.

## Verification bar
- Every code change: gate-green (`npm run check:all` root + chatbot).
- UI changes: Playwright screenshot on :3100.
- Scene components: rendered stills via `render-lesson-stills.ts`.
