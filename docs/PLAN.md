# PLAN — Facelift V2

Canonical plan: **[.planning/FACELIFT-V2.md](../.planning/FACELIFT-V2.md)** (diagnosis,
two identities, phased fixes, decisions). Live status: `agent-ops/STATE.json`.
Requirements catalogue: `agent-ops/FACELIFT-V2-MASTER-LIST.md`. Acceptance: `docs/ACCEPTANCE.md`.
(Supersedes the prior `sizzle-v2.3-fidelity` plan — that task is DELIVERED, recorded in STATE.json.)

## Build order (dependency-aware)
1. **FV2-0** render foundation — independent, highest leverage, verifiable via renderStill dims (no full render).
2. **FV2-1** font integrity — unblocks the sizzle's Playfair.
3. **FV2-2** lesson parity — shares `shared.tsx` with FV2-3; do first, then 3.
4. **FV2-3** motion parity — `shared.tsx` easing swap.
5. **FV2-5** guardrails — lock 2/3 in with a test so they can't regress.
6. **FV2-4** sizzle lean — needs fonts+parity+motion landed; full MP4 in render batch.

## Gate strategy
- Per phase: builder implements locked spec → checker runs `check:fast` + captures renderStill proof → assemble contract.
- Codex: attempt once at the consolidated verify gate (after FV2-0/1/2/3 land) and again on the full branch at wrap-up. Known Windows env-death → `awaiting_codex_review`, continue.
- Renders (FV2-4 MP4 + one lesson regression) batched near the end, run ALONE, gated AFTER.

## Spec-gate note
.planning/FACELIFT-V2.md was authored from the full Parity Punch List diagnosis + both code sides. Codex adversarial plan-review attempted at run start; on env-death the plan is self-locked with that recorded (same fallback as the prior sizzle task, whose PLAN earned a real Codex PASS before the VERIFY-side env failure).
