# Issue #71(3) Coverage Gap Check (2026-05-28)

Purpose: audit current E2E proof coverage against issue #71 acceptance criteria.

## Commands Run

```bash
npm --prefix chatbot run test:e2e -- e2e/new-features.spec.ts
npm --prefix chatbot run check:e2e
```

## Gate Run Result

- `check:e2e` status: `PASS`
- Evidence bundle:
  - `.planning/verification/e2e/2026-05-28T18-19-27-831Z-d3e0012/`
- Stabilization done before rerun:
  - fixed flaky hydration race in `chatbot/e2e/new-features.spec.ts` for "Try Demo".

## Coverage Matrix vs #71 Acceptance

1. Access/session: valid code, wrong code, fail-closed when unset
   - **Current:** `PARTIAL`
   - Covered:
     - wrong code (`proof-api.spec.ts` / `/api/access`)
     - session creation (`proof-api.spec.ts` / `/api/session`)
   - Missing E2E proof:
     - valid student code path
     - fail-closed behavior when `ACCESS_CODE` is unset

2. Tutor: grounded answer + citation, labeled general-knowledge fallback, prompt-injection refusal
   - **Current:** `PARTIAL`
   - Covered:
     - grounded answer + citation (`tutor-rag.spec.ts`)
     - off-topic answer with fabricated citation stripped (`tutor-rag.spec.ts`)
   - Missing E2E proof:
     - explicit "general guidance / not course-sourced" fallback label check
     - prompt-injection refusal behavior

3. Content library: 12 tools load, stale/skipped sources visible
   - **Current:** `GAP`
   - Covered: none in current e2e suite.

4. Compare: selection -> comparison renders from real data
   - **Current:** `GAP`
   - Covered: none in current e2e suite.

5. Studio: generate -> draft -> apply -> render -> MP4
   - **Current:** `GAP`
   - Covered: timeline page render only (`new-features.spec.ts`).

6. Ingestion: run trigger + freshness surfaced
   - **Current:** `PARTIAL`
   - Covered:
     - panel freshness/schedule renders (`new-features.spec.ts`)
     - unauthorized trigger behavior captured (`proof-api.spec.ts`)
   - Missing E2E proof:
     - successful queued trigger on pipeline-enabled env

## Async Work Queue (next hour)

1. Add E2E specs for `/content` and `/content/compare` with real-data assertions.
2. Add chat security scenario for prompt-injection refusal (or explicitly prove current expected behavior if decision differs).
3. Add operator-enabled ingestion trigger proof (queued response path).
4. Decide whether studio full pipeline proof will run as:
   - true end-to-end (host pipeline enabled), or
   - a separate operator-host gate outside standard Playwright run.
