# Issue #61 Verification (2026-05-28)

Issue: `#61 [SECURITY] Rate-limit access/session/chat + operator endpoints`

## Command

```bash
npm --prefix chatbot run test -- rate-limit-routes.test.ts idempotency-routes.test.ts
```

## Result

- Exit code: `0`
- Test files passed: `2`
- Tests passed: `7`

Covered behaviors:

- Access endpoint burst -> structured `429` with `RATE_LIMITED` + `scope=access`
- Session endpoint burst -> `429`
- Chat endpoint burst (per session) -> `429`
- Operator endpoint burst -> `429` before auth checks
- Idempotency replay confirmed for:
  - `/api/generate`
  - `/api/ingest`
  - `/api/regen`

## Conclusion

Rate limiting and idempotency protections are enforced by automated route tests and reproduce the acceptance criteria for #61.
