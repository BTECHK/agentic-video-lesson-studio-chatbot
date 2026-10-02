# ADR-007: "Done" is enforced by a stop hook, CI and a completion contract, with a second model as reviewer

- **Status:** Accepted. The stop hook first appears on 2026-05-23 (with CI the same day); the completion contract and the two-model playbook on 2026-06-22. The hook's registration was removed from the committed settings on 2026-09-30 (see Consequences).
- **Scope:** how this repository keeps AI-assisted work honest.

## Context

Most of this system was written with an AI coding assistant working in long, largely autonomous
sessions (379 of the 454 replayed commits carry an AI co-author trailer). That setup fails in a predictable way:
the assistant reports work as finished when it is not, or when only a friendly test passes. The
repository records several near misses: a review reported complete when only a fraction of lessons had run, a render that
"passed" every artifact gate while being silent and static, and gate verdicts that stayed green after the
code they judged had changed.

Prose instructions did not hold. The hook's own docstring says it moves the "never report complete
without tests" rule "out of CLAUDE.md prose into an actual gate".

## Decision

Enforce completion mechanically, in three layers, and add an independent reviewer.

1. **A Stop hook blocks the turn.** [`.claude/hooks/stop-gate.py`](../../.claude/hooks/stop-gate.py) (138
   lines) reads the hook payload, honours `stop_hook_active` to avoid a re-trigger loop, and works out which
   slice changed from `git diff --name-only HEAD` plus untracked files: the root package, the console
   package, or both. Code files and package or tool configuration count; documentation-only changes do not.
   For each triggered slice it runs `npm run check` (typecheck, lint, tests). On failure it exits 2 and
   returns the last 40 lines of output to the assistant, which must fix them before it can stop. Full builds
   are left to CI to keep the inner loop fast.
2. **CI re-runs the same checks on every push**, plus a build for both packages and content validation for
   the root package ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)). Scripts are named for what
   they prove: `check:fast` is typecheck, lint and unit tests; `check:content` validates data; `check:build`
   proves the bundle compiles. A green `check:fast` is documented as *not* meaning the platform works.
3. **A Completion Contract defines done.** [`docs/ACCEPTANCE.md`](../ACCEPTANCE.md) requires, per task: exact
   files changed; tests run with real output; each acceptance criterion marked met or unmet with evidence; a
   visual or functional artifact for any UI or endpoint work (screenshots with route and viewport under
   `artifacts/verification/`); remaining risks; and one independent adversarial review. Acceptance
   criteria are written to be falsifiable, for example "computed contrast at least 7:1, proven by a unit test
   that fails on regression".
4. **A different model family reviews at the gates.** [`agent-ops/AGENT_PLAYBOOK.md`](../../agent-ops/AGENT_PLAYBOOK.md)
   assigns Claude as lead implementer and Codex as reviewer, following "plan together, write once, review
   twice": both models harden the spec, one writes the code, both review it. The reviewer contract is in
   [`AGENTS.md`](../../AGENTS.md) and [`docs/REVIEW_CHECKLIST.md`](../REVIEW_CHECKLIST.md): report only
   blocking issues, try to falsify the claim of completion, end with `BLOCK` or `PASS`. A `BLOCK` is never
   overridden by the implementer's own opinion. The playbook also fixes the retry policy (after 10 failed
   build-check iterations a task is deprioritised; after 3 revisit rounds it is marked blocked and handed
   off) and a review budget, with a fail-safe: if the reviewer cannot run, the task is marked
   `awaiting_codex_review`, never silently passed.
5. **Tests guard values, not just behaviour.** Examples: [`test/parity.test.ts`](../../test/parity.test.ts)
   pins typographic weights, radii and shadow rules against the design references;
   [`test/contrast.test.ts`](../../test/contrast.test.ts) computes contrast ratios from the real tokens;
   [`test/font-loader.test.ts`](../../test/font-loader.test.ts) asserts that a font that fails to load
   cancels the render instead of falling back.

## Consequences

Positive:

- "Green" has a narrow, checkable meaning. Typecheck, lint and 915 tests pass across the three packages
  (602 root, 274 console, 39 bot; run for this document).
- The second model produced at least one change that is visible in code: the rule that a gate verdict must
  be the first non-empty line of its artifact is attributed in comments and in a test name to an
  independent-model review finding dated 2026-07-15.
- The contract makes gaps explicit instead of hiding them: the run's state ledger (not included in this public copy)
  listed finished tasks separately from those still awaiting the independent review, with the reason.

Costs and known gaps:

- **The hook is not registered at this commit.** A 2026-09-30 commit removes its entry from
  `.claude/settings.json` because the registered command called bare `python`, which does not exist on the
  macOS development machine. The script is still in the repository; re-registering it with `python3` is a
  one-line change to make first.
- **The hook and CI cover the root package and the console only.** The bot has its own check
  (`npm --prefix bot run check`) that neither the hook nor the CI matrix runs.
- **Lint is deliberately lenient.** Unused variables are warnings, so `eslint .` exits 0 with 13 warnings at
  the root and 2 in the console.
- **The second-model step was operationally flaky.** In the recorded run the independent-review step returned
  no output on the development machine several times; those tasks were queued, never waived. The run's state
  ledger that recorded this is not included in this public copy. Eighteen commit messages mention Codex, but the
  individual PASS or BLOCK transcripts are not part of the repository, so the process is documented more fully
  than its outcomes are provable.
- **Test-first ordering cannot be proven from history.** What is enforced mechanically is that the changed
  slice passes its checks before a turn ends, not the order in which tests and code were written.

## Alternatives considered

- **Instructions in CLAUDE.md only.** The starting point; superseded by the hook.
- **CI only.** Too late: it runs at push time, after the assistant has already declared the work finished.
- **A single model checks its own work.** Rejected in the playbook because the writer and checker share blind
  spots; keeping them on different model families is the stated fix.
- **Enabling the reviewer plugin's automatic gate in unattended runs.** Explicitly ruled out in
  [`CLAUDE.md`](../../CLAUDE.md); the playbook adds that the reviewer must not sit inside a tight unattended
  loop because it can drain the plan quickly, and that a hung review must not stall the loop.

## Evidence

- Enforcement: [`.claude/hooks/stop-gate.py`](../../.claude/hooks/stop-gate.py), [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml),
  [`package.json`](../../package.json) scripts `check`, `check:fast`, `check:build`, `check:content`, `check:all`
- Contract and process: [`docs/ACCEPTANCE.md`](../ACCEPTANCE.md), [`docs/REVIEW_CHECKLIST.md`](../REVIEW_CHECKLIST.md),
  [`AGENTS.md`](../../AGENTS.md), [`agent-ops/AGENT_PLAYBOOK.md`](../../agent-ops/AGENT_PLAYBOOK.md)
- Guard tests: [`test/parity.test.ts`](../../test/parity.test.ts), [`test/contrast.test.ts`](../../test/contrast.test.ts),
  [`test/font-loader.test.ts`](../../test/font-loader.test.ts), [`test/gate-status.test.ts`](../../test/gate-status.test.ts)
