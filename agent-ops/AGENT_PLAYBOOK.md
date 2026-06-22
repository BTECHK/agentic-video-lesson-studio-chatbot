# Agent Build Playbook — Two-Model (Claude + Codex), Proof-Gated

Operating manual for the autonomous build system launched by `/goal`. The Claude
orchestrator and both subagents follow this exactly. It is the source of truth;
`/goal` is intentionally short and defers detail here.

What changed in this version: a second, independent model (Codex) now reviews at
the gates, and "done" is defined by **falsifiable proof**, not by the agents
agreeing.

---

## 0. The two models and the roles

- **Claude Code = lead implementer + orchestrator.** The premium orchestrator model
  (efficient-fable) keeps the hard calls. Subagents: `builder` (writes/fixes code,
  ponytail style), `checker` (runs checks + captures proof artifacts). Drop subagents to
  a cheaper tier to save budget.
- **Codex = independent reviewer + verifier.** A different model family, so it
  catches what a single model misses. Invoked via `codex exec` (read-only) at the
  gates. **Nothing pinned** — Codex uses its current best default per task (a strong
  reasoning model for reviews, a coding-optimized one when delegated) and delegates basic
  passes to cheaper models natively. Reach for higher reasoning effort on milestone audits.

Keep the writer and the certifier separate, AND keep them from sharing a model.
The builder/checker split alone failed because both share Claude's blind spots;
Codex is the fix.

---

## 1. The one rule

**Do not mark work "complete" by agreement or assertion. Mark it complete with
falsifiable proof. Agreement is weaker than artifact-based proof.** Every
completion satisfies the Completion Contract (section 6 / `docs/ACCEPTANCE.md`).

Division of labor, decided: **plan together, write once, review twice.** Both
models harden the SPEC before code; Claude is the single writer; both models
review the result. Do NOT have them co-write the same code.

---

## 2. The flow (per feature)

1. **Spec gate (`/spec`).** Claude writes `docs/PLAN.md` + `docs/ACCEPTANCE.md`
   (expected UX, files touched, falsifiable acceptance criteria, test plan, visual
   checklist). Codex adversarially reviews the SPEC before any code. Claude
   reconciles every blocking point and locks the plan (`spec_locked: true`).
2. **Implement.** `builder` implements exactly the locked spec, ponytail style.
   No "done" without the proof bundle.
3. **Verify gate (`/verify`).** (a) `checker` runs all checks and captures real
   artifacts; assembles the Completion Contract bundle. (b) Codex independently
   reviews the diff against the acceptance criteria. **Done only if the contract
   is satisfied AND Codex returns PASS.** Any BLOCK or missing artifact -> back to
   builder.

The per-feature inner loop (build -> check -> fix) still applies inside step 2,
with the same retry rules (section 5).

---

## 3. Discovering the work (scope)

**Build only what is confirmed.** On first run (empty `tasks`), assemble the list
from real sources of truth: issues labeled planned/slated/accepted/ready, a
`ROADMAP.md` / `TODO.md` / "Unreleased" changelog / project board, and
partially-built features clearly meant to ship. **Leave untouched:** anything
marked unconfirmed, backlog, maybe, proposal, RFC, icebox, "still deciding."
Ambiguous status -> treat as out of scope, record under `left_in_backlog`. Write
in-scope tasks to STATE.json with `scope_status: "confirmed"`.

---

## 4. Priority and ordering — you decide

Work autonomously. Default order: (1) unblockers / API + data plumbing first,
(2) finish partially-built slated features, (3) high-value well-specified
features, (4) risky/uncertain items get bounded attempts then deprioritize,
(5) quick wins interleaved. Re-evaluate as you learn; a discovered dependency
outranks the prior plan.

---

## 5. Retry -> deprioritize -> revisit -> blocked

A single stuck item must never stall the loop. Per task: count each build->check
pair as one iteration. **At 10 iterations** still failing -> `deprioritized`, set
`cooldown_until`, log why, move on. **Revisit** after cooldown with a FRESH
approach (re-read the real error; new hypothesis). **At 3 revisit rounds** with no
progress -> `blocked`, write a human-handoff note, stop spending on it. The loop
ends only when all confirmed tasks are `done`, or at the deadline. `blocked` items
are reported, not blockers.

---

## 6. The Completion Contract (definition of done)

A task may not be `done` unless ALL SIX exist (full text: `docs/ACCEPTANCE.md`):
1. Files changed (exact paths).
2. Tests run — exact commands + real output; new behavior has a test that fails
   without the change.
3. Acceptance criteria — each MET/UNMET with evidence.
4. Visual/functional proof for any UI/route/endpoint — artifact under
   `artifacts/verification/<task-id>/` (Playwright screenshots before/after, exact
   route + viewport, element assertions). No artifact = automatic fail.
5. Remaining risks.
6. Independent cross-model review — one adversarial Codex pass per
   `docs/REVIEW_CHECKLIST.md`, blocking issues resolved. Unresolved disagreement =
   not done.

---

## 7. The verify gate in detail (+ Codex budget)

`/verify` runs the gate. Order matters for budget:
1. **Claude proof first.** `checker` runs everything and captures artifacts. If
   any acceptance criterion is UNMET or an artifact is missing, fail locally and
   send back to `builder` — do NOT call Codex on incomplete work.
2. **Then Codex, once.** `codex exec --sandbox read-only` reviews the diff against
   `docs/ACCEPTANCE.md` + `docs/REVIEW_CHECKLIST.md`, adversarial, BLOCK/PASS.
3. **Verdict by proof.** PASS + contract satisfied -> `done` + record artifacts and
   Codex verdict in STATE.json + checkpoint-commit. BLOCK -> not done; each finding
   becomes a builder fix packet; re-run the gate. Never override a Codex BLOCK with
   Claude's own opinion.

**Codex budget.** Codex usage draws on the ChatGPT/Codex plan (limited on Plus).
Spend it where it counts: gates and milestones, NOT every micro-task. Track
`meta.codex_calls_used` against `meta.codex_call_budget` in STATE.json. If the
budget is exhausted during an unattended run, do NOT hang and do NOT fail open:
mark affected tasks `awaiting_codex_review`, keep building other work, and queue
those for a single human-run Codex pass. Never put Codex inside a tight unattended
loop (it can drain the plan fast).

---

## 8. Build style and commits

- **ponytail.** Least code that fully works; native/standard solutions over new
  deps or abstractions; no speculative generality; no unrequested refactors. Wire
  features for real — real endpoints, real handlers, no dead buttons.
- **Checkpoint commits, never push.** Branch `agent/overnight-<date>`. After a task
  passes the verify gate, checkpoint-commit (`feat|fix: <task> [agent-overnight]`).
  Never `git push`.

---

## 9. Reliability: logging, errors, timeouts, heartbeat, continuity

- **Logging.** One structured timestamped line per event to
  `agent-ops/logs/run-<date>.log` (task picked, builder dispatched, checker
  result, codex verdict, decision, state change, error, commit).
- **Heartbeat.** Update `meta.last_heartbeat` + `meta.current_task` at the start of
  every task and after every checker/codex result. Stale heartbeat = stall.
- **Continuity.** This process can be killed and relaunched anytime. Load
  STATE.json at the start of EVERY run, resume from it, persist after every task.
  STATE.json + the repo + the log are the only durable state.
- **Timeouts/stalls.** Bound anything that can hang (dev servers, installs, e2e,
  `codex exec`) and treat a timeout as a failure to log and route around. Give
  `codex exec` its own timeout — a hung review must not stall the loop.
- **Errors.** Catch, log, update STATE.json, continue. One failure never aborts the
  session.

---

## 10. Wrap-up (all confirmed work done, or at the deadline)

In order: (1) `ponytail-audit` skill across the repo, address reasonable findings;
(2) `checker` re-run to confirm still-green; (3) a final **Codex adversarial pass
on the whole branch** (`codex exec --sandbox read-only "Adversarially review this
branch against docs/ACCEPTANCE.md; report blocking issues and unverifiable
completions; BLOCK or PASS."`); (4) final checkpoint commit — **do not push**;
(5) `visual-recap` skill in local-files mode on the branch diff; (6) write
`agent-ops/WRAP_UP.md` (Added / Changed-Fixed / Deprecated-Removed / Outstanding
[deprioritized+blocked+awaiting_codex_review, with why] / Left in backlog);
(7) create `agent-ops/.DONE`.

---

## 11. Deadline and token stance

- **Hard deadline: 2026-06-21 10:00 local.** Check `date` between tasks; near it,
  finish/checkpoint the current task and run wrap-up so there is always a clean
  commit + recap.
- **Tokens.** Claude token spend is fine; hanging is not — favor liveness. Codex
  spend is the constrained one — gate it (section 7).
