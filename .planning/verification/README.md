# Verification Evidence

Final launch-proof artifacts are written here.

## Final E2E Gate (#71)

Run from repo root:

```bash
npm run check:e2e
```

This runs Playwright against a fresh app server and writes a timestamped bundle to:

```text
.planning/verification/e2e/<timestamp>-<commit>/
```

Each bundle includes:

- `summary.json` (commit hash, command, status)
- `playwright.log` (full run output)
- `playwright-results.json` (machine-readable test report)
- `test-results/` (Playwright traces/screenshots on failures, plus attachments)

## Launch rule

A feature is not launch-complete until:

1. Its E2E scenario passes in the final gate.
2. Evidence for that run exists in this folder.
3. The commit hash in `summary.json` matches the shipped code.
