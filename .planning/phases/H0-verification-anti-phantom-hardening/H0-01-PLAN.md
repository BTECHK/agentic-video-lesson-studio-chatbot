---
phase: H0-verification-anti-phantom-hardening
plan: H0-01
wave: 1
autonomous: true
status: in-progress
created: 2026-05-23
source: .planning/PROJECT-PLAN-2026-05-23.md §4, §7
req_ids: [VERI-01, VERI-02, VERI-03, VERI-04, INFRA]
---

# H0-01 — Verification & Anti-Phantom Hardening

## Objective

Pour a structural anti-phantom foundation so every later phase (C-2 → G) proves
itself instead of producing finished-looking-but-broken chains. Adopted from the anti-phantom-code thesis. Right-sized for the current stage
(solo, no users, local-first): two enforcement walls (Stop hook + CI) plus real
render proof. Enterprise tail (Lefthook, PostToolUse, fallow, act, full Playwright
suite) is explicitly backlogged.

This is a **lightweight-GSD** plan: a single sequential plan executed inline (no
subagents/waves), per the decision recorded for this phase.

## Locked decisions (from §7, 2026-05-23)

- Harden FIRST, then resume production (C-2 + D parallel → E → F → G).
- Two enforcement walls + render proof now; skip the enterprise tail.
- Move the prose "never report complete without tests" rule into the Stop hook
  so it is enforced, not requested.

## Tasks

1. **Root tooling scripts** — add `typecheck` (`tsc --noEmit`), `lint`, and a
   combined `check` to root `package.json`; add `typecheck` + `check` to
   `chatbot/package.json` (chatbot already has `lint`).
   - verify: `npm run check` exits 0 at root and in chatbot.

2. **Stop hook** — `.claude/hooks/stop-gate.py`: exits 2 until the changed slice
   passes typecheck + lint + test; `stop_hook_active` guard against loops;
   "AUTOMATED QUALITY GATE" wording. Wire via `.claude/settings.json`.
   - verify: hook runs the checks and blocks (exit 2) on injected breakage,
     passes (exit 0) on a clean tree.

3. **GitHub Actions CI** — `.github/workflows/ci.yml` running the *same* checks
   plus full builds (push-time safety net; build lives in CI, not the Stop hook,
   to keep the inner loop fast — deviation from §7 noted below).
   - verify: workflow YAML is valid and mirrors the local check commands.

4. **Render verification** — `scripts/verify-render.ts`: render a short probe of
   a real Remotion composition, assert non-blank frames, capture screenshots.
   Makes VERI-01..04 real (currently only partially so).
   - verify: script renders frames from `BrandShowcase`, fails on blank output.

5. **Vertical-slice rule** — add to `CLAUDE.md`: build one DB→logic→UI slice
   end-to-end (green + proof) before expanding sideways.
   - verify: rule present in CLAUDE.md.

6. **Playwright** — install `@playwright/test` in chatbot; one smoke test as the
   pattern (drive localhost, assert a real chain). Grow per-feature later.
   - verify: smoke test file exists and is runnable.

7. **Remotion best-practices skill** — install
   `skills.sh/remotion-dev/remotion-best-practices` for the C-2/E build sessions.
   - verify: skill present in the skills directory.

## Deviations from §7 (deliberate, right-sizing)

- **Build is CI-only, not in the Stop hook.** `next build` + `remotion bundle`
  are ~30–60s each; running them on every turn-end would tax the inner loop.
  The Stop hook runs the fast trio (typecheck + lint + test, changed-slice
  aware); CI runs the full `build && typecheck && lint && test`. This preserves
  the anti-phantom guarantee at push time while keeping local iteration fast.
- **Pre-existing baseline bugs fixed to make the gate real:**
  `scripts/ingest.ts:283` duplicate `mode` property (TS2783) removed;
  `chatbot/.../page.tsx` mount-animation `setState` given a scoped
  `eslint-disable` (intentional pattern, behavior preserved).

## Must-haves (verification targets)

- [ ] `npm run check` green at root and chatbot
- [ ] Stop hook blocks broken code (exit 2) and is wired in settings.json
- [ ] CI workflow present and mirrors local checks
- [ ] Render-verification script produces non-blank frames + screenshots
- [ ] Vertical-slice rule in CLAUDE.md
- [ ] One Playwright smoke test present
- [ ] Remotion best-practices skill installed
