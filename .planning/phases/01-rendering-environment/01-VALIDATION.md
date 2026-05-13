---
phase: 1
slug: rendering-environment
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-13
---

# Phase 1 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.6 |
| **Config file** | vitest.config.ts (Plan 01 Task 1) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds (except Docker integration tests, see note below)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | INFRA-01 | -- | N/A | integration | `docker compose run render node -e "require('@remotion/renderer')"` | N/A (Docker) | pending |
| 01-01-02 | 01 | 1 | INFRA-02 | -- | N/A | integration | `docker compose config --quiet && docker compose up -d --wait` | N/A (Docker) | pending |
| 01-01-03 | 01 | 1 | INFRA-03 | -- | N/A | smoke | `docker compose run render ffmpeg -version` | N/A (Docker) | pending |
| 01-01-04 | 01 | 1 | VERI-02 | -- | N/A | smoke/manual | `docker compose up dev -d` + manual browser check at localhost:3000 | Manual | pending |
| 01-02-01 | 02 | 2 | INFRA-05 | -- | N/A | unit | `npx vitest run test/render.test.ts` | Plan 02 Task 2 | pending |
| 01-02-02 | 02 | 2 | VERI-01 | -- | N/A | unit | `npx vitest run test/render.test.ts` | Plan 02 Task 2 | pending |
| 01-03-01 | 03 | 2 | INFRA-06 | -- | N/A | unit | `npx vitest run test/validation.test.ts` | Plan 03 Task 1 | pending |
| 01-04-01 | 04 | 3 | INFRA-04 | -- | N/A | unit | `npx vitest run test/determinism.test.ts` | Plan 04 Task 1 | pending |
| 01-04-02 | 04 | 3 | VERI-03 | -- | N/A | unit | `npx vitest run test/gallery.test.ts` | Plan 04 Task 1 | pending |
| 01-04-03 | 04 | 3 | VERI-04 | -- | N/A | unit | `npx vitest run test/pipeline.test.ts` | Plan 04 Task 2 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

All test files are created by their respective plans (no orphan test files):

- [x] `vitest.config.ts` -- Plan 01 Task 1
- [ ] `test/render.test.ts` -- Plan 02 Task 2 (covers INFRA-05, VERI-01)
- [ ] `test/validation.test.ts` -- Plan 03 Task 1 (covers INFRA-06)
- [ ] `test/determinism.test.ts` -- Plan 04 Task 1 (covers INFRA-04)
- [ ] `test/gallery.test.ts` -- Plan 04 Task 1 (covers VERI-03)
- [ ] `test/pipeline.test.ts` -- Plan 04 Task 2 (covers VERI-04)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Remotion Studio accessible at localhost:3000 | VERI-02 | Requires browser interaction and visual confirmation | 1. Run `docker compose up dev` 2. Open browser to localhost:3000 3. Verify Remotion Studio UI loads with composition list |

---

## Docker Integration Test Latency Note

Tasks 01-01-01 through 01-01-04 are Docker integration tests with expected latency of 2-5 minutes on first run (image build). This exceeds the 30-second feedback target but is acceptable for one-time infrastructure verification. Subsequent runs use Docker layer cache and complete faster.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references -- every test file mapped to a plan
- [x] No watch-mode flags
- [x] Feedback latency < 30s (except Docker integration tests, documented above)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
