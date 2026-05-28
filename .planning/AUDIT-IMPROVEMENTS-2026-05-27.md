# Agentic Video Lesson Studio + Chatbot Audit and Improvement Plan

Date: 2026-05-27

Scope: read-only audit of `C:\Users\dev\OneDrive\Desktop\github\agentic-video-lesson-studio-chatbot`.

I did not change application source code. I did create this audit file because the requested deliverable was an improvement and suggestions file. I also did not run the full test/build suites during the audit because several configured commands write local artifacts; the findings below come from inspecting code, scripts, CI, local logs, planning docs, Git history, GitNexus metadata, and Claude worktree state.

## Input Gap

No external guide was available for this pass, so the repo's own guidance (`CLAUDE.md`, `AGENTS.md`, `.planning/*`) plus general vibe-coding and security-audit principles was used. The strongest tenets were: freeze the blueprint before implementation, verify claims with commands instead of trusting AI summaries, do impact analysis before edits, and treat security/auth/data-flow claims as untrusted until proven.

## Executive Diagnosis

The project has a strong quality intent, but the current gates mostly prove that isolated code compiles and mocked units behave. They do not prove the learner-facing platform works end to end. This explains the false-positive pattern: `check` can pass while chat/RAG, content freshness, generation, rendering, ingestion, or admin workflows are broken.

The highest-risk issue is that public-facing and operator-facing capabilities are mixed in the same Next app without a real admin/auth boundary. A deployment with trigger flags enabled could expose write, ingest, generate, cancel, and apply operations to any caller who can reach those endpoints.

The second highest-risk issue is the generation pipeline. Local runtime state currently records a failed generate job, and logs show repeated failures parsing model output. The tests do not cover that real path. The repo also documents an `anthropic-api` backend, but the headless generator exits with "not implemented" for that backend.

The third pattern is stale state. GitNexus was indexed at `dd3f89d`, while local HEAD is `5c34927`. There are stale Claude worktrees with dead PIDs. Planning docs, old audits, root README, chatbot README, and runtime status disagree about what is actually done.

## P0 Findings

### P0.1 False-positive gates are too shallow

Evidence:

- Root `package.json` defines `check` as typecheck + lint + unit tests.
- Root `check:all` runs root `check` and chatbot `check`.
- `.github/workflows/ci.yml` runs root and chatbot checks/builds, but does not run Playwright e2e, content validation, render verification, or a real generation workflow.
- `.claude/hooks/stop-gate.py` runs `npm run check` for changed slices, but not builds or live workflow checks.
- `chatbot/e2e/smoke.spec.ts` explicitly checks page rendering and says it does not verify the RAG chain.
- `test/pipeline.test.ts` heavily mocks Remotion bundle/render/verify/gallery/compare.

Why this matters:

The green signal is not testing the user-visible promises. A test can pass while the app cannot answer with grounded RAG, generate a usable script, render a video, ingest fresh content, apply edits, or cancel jobs cleanly.

Improvements:

- Define separate gates with honest names:
  - `check:fast`: typecheck, lint, unit tests.
  - `check:build`: root build + chatbot build.
  - `check:content`: `validate:content` plus source/freshness warnings.
  - `check:e2e`: Playwright with a fresh server.
  - `check:workflow`: one real generate/render/verify path against controlled fixtures or a deterministic provider.
- Make CI run `check:fast`, `check:build`, and `check:content` on every PR.
- Run `check:e2e` at least on PRs that touch `chatbot/**`, content, or pipeline APIs.
- Run `check:workflow` nightly or before client delivery.
- Rename reports so "passed" means the exact layer passed, not "the platform works."

### P0.2 Hardcoded/default access code remains

Evidence:

- `chatbot/src/lib/access.ts` falls back to `demo-access-code` when `ACCESS_CODE` is missing.
- `chatbot/.env.example` documents the same value.
- `docker-compose.chatbot.yml` also defaults to the same code.
- `.planning/AUDIT-PHASE-5.md` already flagged the hardcoded access code on 2026-05-14.

Why this matters:

This is a known unresolved security issue. Any public/client deployment that forgets to override the variable inherits a predictable access code.

Improvements:

- Remove the fallback from code.
- Fail startup when `ACCESS_CODE` is missing outside local development.
- Put an obviously invalid placeholder in examples, such as `change-me`.
- Add a unit test that production mode without `ACCESS_CODE` fails closed.
- Document a local-only developer bypass that cannot be enabled in production by accident.

### P0.3 Admin/operator endpoints lack a real auth boundary

Evidence:

These API routes accept write or operator actions but rely mainly on environment gates, schema validation, or local filesystem state:

- `chatbot/src/app/api/comments/route.ts`
- `chatbot/src/app/api/edits/route.ts`
- `chatbot/src/app/api/edits/apply/route.ts`
- `chatbot/src/app/api/generate/route.ts`
- `chatbot/src/app/api/generate/cancel/route.ts`
- `chatbot/src/app/api/generate/apply/route.ts`
- `chatbot/src/app/api/ingest/route.ts`
- `chatbot/src/app/api/regen/route.ts`

Why this matters:

If `REGEN_TRIGGER_ENABLED` or `INGEST_TRIGGER_ENABLED` is enabled on a reachable deployment, a caller can trigger regeneration/ingest, write staged edits/comments, promote generated scripts, or cancel jobs. That is not a client-safe boundary.

Improvements:

- Split learner and operator surfaces:
  - Learner app: chat, lesson viewing, read-only content.
  - Operator app/service: Studio, ingestion, regeneration, apply/cancel endpoints.
- Add real server-side auth for operator endpoints.
- Add CSRF/origin protection for browser-triggered state changes.
- Add route-level authorization tests for every write endpoint.
- Consider deploying operator routes only on a private host or behind VPN/SAML/OAuth.

### P0.4 Generation backend and parse path are unreliable

Evidence:

- `logs/pipeline/generate-2026-05-26.jsonl` shows repeated `no JSON object found in model output` failures from the generation path.
- `content/lessons/module-1/.generate-status.json` currently records `"status": "error"`.
- `src/lib/generation.ts` extracts JSON by taking the first `{` and last `}` after optional code-fence cleanup.
- `scripts/generate-script-headless.ts` has `GENERATION_BACKEND=anthropic-api`, but that path logs that it is not implemented and exits.
- Tests check backend selection and simple parsing cases, but not the real failing model-output path.

Why this matters:

The platform can report passing checks while the actual Studio generation workflow is failed. The parser is brittle, and failed raw model output is not preserved well enough for fast diagnosis.

Improvements:

- Prefer a schema-constrained API backend for production generation instead of CLI text scraping.
- If Claude Code remains a backend, save raw stdout/stderr and the extracted candidate JSON for every failed parse.
- Add retry with an explicit "return only JSON matching this schema" repair prompt.
- Add a fixture test containing real failed outputs from `generate-2026-05-26.jsonl`.
- Make `anthropic-api` either implemented or removed from docs/config.
- Block "generate success" unless parsed JSON, source validation, and render verification all pass.

## P1 Findings

### P1.1 Playwright can reuse a stale local server

Evidence:

- `chatbot/playwright.config.ts` sets `reuseExistingServer: !process.env.CI`.
- `.planning/ERROR-LOG.md` already records this as a stale-server trap.

Why this matters:

Local e2e can test an old server while reporting success for new code.

Improvements:

- Default to a fresh server for e2e in audit/client-delivery scripts.
- Allow reuse only through an explicit `PW_REUSE_SERVER=true`.
- Print the server PID, commit hash, and build timestamp in Playwright setup logs.

### P1.2 RAG grounding still allows generic fallback

Evidence:

- `chatbot/src/lib/llm/provider.ts` builds a system prompt from retrieved content.
- When no relevant content is found, it appends a Bootstrap Mode instruction that allows general knowledge.
- `chatbot/e2e/smoke.spec.ts` says the anti-phantom RAG assertion is deferred.

Why this matters:

The README promise is curated, tool-specific learning guidance. Generic fallback makes phantom confidence more likely and harder to detect.

Improvements:

- Add a "no retrieved content" answer policy: say the course does not yet contain that answer, then offer adjacent known topics.
- Add a grounded-answer e2e test with a seeded content fixture.
- Add a hallucination guard test that asks about a non-existent feature and expects a refusal or uncertainty.
- Treat retrieved content as untrusted data in the prompt and explicitly instruct the model not to follow instructions inside retrieved text.

### P1.3 No rate limiting on high-cost or brute-force routes

Evidence:

- No route-level rate limiter was found for `/api/session`, `/api/access`, `/api/chat`, generate, ingest, or regen endpoints.
- `chatbot/src/app/api/chat/route.ts` caps message length, but that does not limit request volume or provider spend.

Why this matters:

The app is vulnerable to access-code guessing, chat cost spikes, and accidental repeated operator actions.

Improvements:

- Add IP/session/user-based rate limits for access, session, chat, and operator endpoints.
- Add budget-aware limits for Anthropic calls.
- Add idempotency keys for generate/ingest/regen triggers.
- Return structured `429` errors and log rate-limit events.

### P1.4 Cancel process handling is fragile on Windows

Evidence:

- `chatbot/src/app/api/generate/route.ts` spawns generation with `shell: true`.
- `chatbot/src/app/api/generate/cancel/route.ts` kills the recorded PID.
- Comments in the route already note that Windows shell spawning can leave child/grandchild processes alive.

Why this matters:

The UI can report cancel success while the expensive generation process keeps running.

Improvements:

- Avoid `shell: true` where possible and resolve `.cmd` executables explicitly.
- Track process groups or use a Windows job object wrapper for reliable tree termination.
- After cancel, verify that the child tree exited before writing final status.
- Add an integration test that starts a long-running child process and confirms cancellation kills the tree.

### P1.5 Content freshness can look green when sources are skipped

Evidence:

- `scripts/validate-content.ts` validates schema/source refs, but is not part of `check:all` or CI.
- `logs/pipeline/ingest-2026-05-25.jsonl` recorded `openai` as skipped with `no successful scrapes`, while the overall ingest completed with `errors: 0`.

Why this matters:

Client-facing lessons can drift stale while the system reports a clean ingest.

Improvements:

- Treat "no successful scrapes" as a warning or failure, not a silent success.
- Track freshness by source, timestamp, URL, and last successful scrape.
- Surface stale vendors/tools in the Studio UI.
- Add `validate:content` to CI and pre-delivery gates.

### P1.6 Provider configuration silently falls through

Evidence:

- `docker-compose.chatbot.yml` defaults `LLM_PROVIDER` to `claude-passthrough`.
- `chatbot/.env.example` says valid providers are `anthropic` and `mock`.
- `chatbot/src/lib/llm/provider.ts` defaults unknown providers to Anthropic behavior.

Why this matters:

Misconfiguration can look intentional and can accidentally call the paid provider.

Improvements:

- Validate `LLM_PROVIDER` at startup.
- Fail closed for unknown provider values.
- Align docker-compose, examples, README, and implementation.

## P2 Findings

### P2.1 Project state docs are contradictory

Evidence:

- `.planning/STATE.md` has newer handoff text and older "Current Position" text that disagree.
- `chatbot/README.md` still describes older landing-page and content-roadmap assumptions.
- Root `README.md` includes encoding artifacts such as `â€”` and `â†’`.
- Prior audits list issues that are now partly fixed, but some old P0 items remain unresolved.

Why this matters:

Future agents can optimize against stale plans and mark incomplete work as done.

Improvements:

- Create one canonical `CURRENT-STATE.md`.
- Move old audits to an archive section with explicit status: fixed, still open, superseded.
- Fix README encoding.
- Add a "known false positives" section documenting what each check does not prove.

### P2.2 GitNexus and Claude worktree state is stale

Evidence:

- `.gitnexus/meta.json` was last indexed at `dd3f89d`; local HEAD is `5c34927`.
- Two `.claude/worktrees/agent-*` directories are locked to dead PIDs.
- `.planning/STATE.md` already mentions a lingering worktree cleanup item.

Why this matters:

Impact analysis tools and future Claude handoffs may reason from stale graph/worktree state.

Improvements:

- Reindex GitNexus after local HEAD changes.
- Clean up locked Claude worktrees only after confirming no process is alive.
- Add a maintenance checklist before major edits: git status, GitNexus freshness, stale worktrees, latest planning state.

### P2.3 UI files are getting large enough to slow safe edits

Evidence:

Several UI/source files are above roughly 200 lines, including:

- `chatbot/src/app/marketing/page.tsx`
- `chatbot/src/components/studio/Timeline.tsx`
- `chatbot/src/components/studio/Inspector.tsx`
- `chatbot/src/components/studio/GeneratePanel.tsx`
- `chatbot/src/components/ComparisonTable.tsx`
- `chatbot/src/components/ChatWidget.tsx`

Why this matters:

Large mixed state/presentation components make future AI edits riskier and harder to review.

Improvements:

- Split only around real responsibilities:
  - data loading/state machine hooks
  - presentational components
  - route-level orchestration
  - reusable form controls
- Add component-level tests only where behavior is meaningful.
- Avoid broad rewrites until the P0/P1 gates are repaired.

## Recommended Anti-False-Positive Gate Matrix

| Gate | Purpose | Should run | Must prove |
| --- | --- | --- | --- |
| `check:fast` | Developer feedback | every edit/PR | typecheck, lint, unit tests |
| `check:build` | Bundle integrity | every PR | root Remotion bundle and chatbot Next build |
| `check:content` | Lesson integrity | every PR touching content/pipeline | schema, source refs, stale/skipped sources |
| `check:e2e` | Learner app behavior | chatbot/content PRs | fresh server, access/session, grounded answer, no-answer behavior |
| `check:studio` | Operator workflow | pipeline/studio PRs | generate, cancel, apply, status, persisted logs |
| `check:render` | Video output | nightly/pre-client | render still/video and verify output properties |
| `check:security` | Deployment safety | pre-client | no default access code, authz on write routes, rate limits, env validation |

The important change is semantic honesty: a green fast check means "fast checks passed," not "the platform works."

## Suggested Near-Term Remediation Order

1. Remove the default access code and fail closed in production.
2. Put all operator/write endpoints behind real admin auth, or deploy them separately from the learner app.
3. Implement or remove the `anthropic-api` generation backend, then preserve raw failed model output.
4. Add a real generation workflow test using a deterministic provider or captured fixtures.
5. Make Playwright start a fresh server for audit/client-delivery checks.
6. Add grounded and no-answer RAG e2e tests.
7. Add `validate:content` and stale-source reporting to CI.
8. Validate provider/env config at startup.
9. Reconcile `.planning/STATE.md`, root README, chatbot README, and old audits.
10. Reindex GitNexus and clean stale Claude worktrees after confirming locks are dead.

## Client-Work Definition of Done

For this project, "done" should require more than passing `npm run check`.

Minimum client-ready proof should include:

- Clean git status except intentional audit/generated artifacts.
- GitNexus/index state current with HEAD.
- `check:fast`, `check:build`, and `check:content` pass.
- Playwright e2e runs against a fresh server.
- One grounded chat answer test passes.
- One no-answer/hallucination guard test passes.
- One generation job succeeds from trigger to parsed script to verified render, or the feature is clearly disabled.
- Security check confirms no default access code and no unauthenticated write/operator endpoints.
- Runtime logs and UI status agree.

## Bottom Line

The codebase is not hopeless or unusually messy. The core problem is that its confidence system is out of sync with its product promises. Fix the gates first, especially auth boundaries and real workflow checks, then do smaller architecture cleanup. That will reduce the "tests passed but it does not work" loop much more than another broad refactor.

## Secondary Audit: Harness-Focused Root Cause Pass

After the first pass, an external agent-reliability review (phantom-code / verification-harness guidance) was folded in.

This does not replace any earlier findings. It strengthens the diagnosis: the project is suffering from a harness gap, not mainly a prompting gap.

### Additional P0.5: Missing harness architecture is the root cause

The external review frames "phantom code" as a trust-then-verify failure. The model is optimized to produce a complete-looking result, while the repo needs deterministic checks that make incorrect code unable to survive.

That maps directly to this codebase:

- The Stop hook exists, but it only runs fast `check` commands.
- CI builds root and chatbot, but does not prove real learner or Studio workflows.
- The e2e tests render pages but do not prove chat grounding, citations, generation, ingest, render, cancel, apply, or persistence.
- Tests frequently mock integration boundaries, so they prove local assumptions rather than actual product behavior.
- Runtime logs already show a failed generate status while the planning state implies the feature is further along.

Root cause:

The project has many quality artifacts, but too few executable product contracts. Instructions, planning docs, and AI summaries are carrying responsibilities that should be enforced by scripts, contracts, browser tests, and runtime evidence.

Improvement:

Create a first-class `proof/` or `scripts/proof-*` harness. The proof harness should run the actual app, drive real workflows, and save evidence. A feature is not done until its proof script passes.

Suggested proof scripts:

| Script | Purpose | Evidence required |
| --- | --- | --- |
| `proof:chat` | Tutor learner flow | fresh server, access/session, `/api/chat` network call, grounded answer, verified citation, no-answer guard |
| `proof:content` | Content library | 12 tools load, source refs valid, stale/skipped sources visible |
| `proof:compare` | Compare flow | user selects tools, comparison renders from real content data |
| `proof:studio` | Generate/edit/apply flow | deterministic generation, draft appears, apply writes script, render/verify runs |
| `proof:security` | Deployment safety | missing production `ACCESS_CODE` fails, write routes require admin auth, rate limits return `429` |
| `proof:render` | Video output | render still/video, non-blank frames, expected dimensions, readable screenshots |

### Additional P0.6: Tutor lacks executable product contracts

The product brief says the user-visible promise is an AI teaching assistant grounded in course content with source citations, plus a content library and tool comparison experience.

Current mismatch:

- `chatbot/e2e/smoke.spec.ts` does not prove grounded answers.
- The RAG path can fall back to generic Bootstrap Mode when no relevant content is found.
- Citation verification exists in code, but there is no end-to-end proof that a real learner question returns a cited answer from the course data.
- The content freshness system can treat skipped/no-success scrape cases as non-errors.

Root cause:

The product promise is not encoded as an invariant. It exists as copy and intent, not as a failing test or contract.

Improvement:

Define Tutor invariants as tests before further feature work:

- A known course question must produce an answer with at least one verified citation.
- A non-course question must decline or clearly state that the course does not contain the answer.
- A stale or skipped source must be visible to the operator.
- The answer must not cite sources that were not retrieved.
- The UI must show citation labels that map back to source records.

### Additional P1.7: Same-context builder/tester/reviewer flow is unsafe

The external review is blunt: do not let the same agent context implement, test, and approve. That creates self-confirming hallucinations.

Current repo pattern:

- Planning docs and historical Claude outputs often declare phases done based on local checks.
- Existing tests are useful, but many were authored in the same implementation flow and tend to check the implementation shape.
- There is no separate blind verifier step that attempts to break the feature from the product promise backward.

Improvement:

Adopt a four-role workflow for risky features:

1. Spec owner writes the contract: what must be true for the feature to count.
2. Builder implements the smallest vertical slice.
3. Reviewer inspects code and contracts in a clean context.
4. Verifier runs the app, captures evidence, and attempts adversarial cases.

For solo work, this can still be lightweight: run separate Claude/Codex sessions for build and review, and require the verifier session to run commands/browser checks instead of reading summaries.

### Additional P1.8: Evidence is not durable enough

The external review's strongest operational rule is "evidence, not claims." For this repo, the evidence trail is uneven:

- Generation logs show failures, but raw failed model output is not preserved well enough.
- Playwright is present, but traces/screenshots are not part of a product-level proof ledger.
- `.planning/STATE.md` can disagree with runtime status files.
- GitNexus state can be stale while docs still instruct agents to rely on it.

Improvement:

Add a durable verification ledger under `.planning/verification/`. Each client-facing feature should have a dated proof note with:

- commit hash
- commands run
- server URL and fresh-server confirmation
- screenshots or trace file paths
- key API responses or status JSON
- known gaps
- reviewer/verifier notes

This does not need to be fancy. It just needs to make "Claude said it worked" insufficient.

### Additional P1.9: Hooks are a good start, but the wall is incomplete

The existing `.claude/hooks/stop-gate.py` is directionally correct: it uses a Stop hook, honors `stop_hook_active`, and blocks on failing fast checks. The problem is scope.

Missing layers compared to the external recommendations:

- No PostToolUse hook to format/typecheck immediately after edits.
- No pre-commit/pre-push gate such as Lefthook.
- No Playwright smoke/proof test in the Stop hook or pre-push gate.
- No contract or module-graph audit gate.
- No command that maps changed files to the relevant real workflow proof.

Improvement:

Keep the fast Stop hook, but add a second tier:

- Stop hook: fast, changed-slice `typecheck + lint + unit`.
- Pre-commit: format, typecheck, related tests.
- Pre-push/client-delivery: build, content validation, Playwright proof, render proof.
- Nightly/manual release: full generate/ingest/render workflow.

The key is not to make every edit painfully slow. The key is to prevent client-ready claims from relying on fast checks alone.

### Additional P2.4: CLAUDE.md is not the main bottleneck

The external review recommends keeping `CLAUDE.md` short and moving guarantees into hooks. This repo's root `CLAUDE.md` is already reasonably short. The problem is not instruction length; it is that some load-bearing rules are still prose.

Examples:

- "Vertical slices" is in `CLAUDE.md`, but the codebase history still shows horizontal phase accumulation.
- "Visual verification" is in `CLAUDE.md`, but `verify:render` is not a normal CI/client-delivery gate.
- GitNexus impact analysis is required in prose, but the MCP tools were not available in this audit context and the index was stale relative to HEAD.

Improvement:

Treat `CLAUDE.md` as a map, not a seatbelt. Anything that must never be violated needs an executable guard.

## Revised Root-Cause Tree

Symptoms:

- Tests pass while learner/studio workflows break.
- Features look present but are not fully wired.
- Planning state says complete while runtime status says failed.
- AI-written tests over-mock the failing boundary.

Immediate causes:

- E2E tests check page presence more than behavior.
- Real generation/render/ingest workflows are outside the default gates.
- Operator APIs have weak auth boundaries.
- Runtime evidence is not captured as a required artifact.
- Model output parsing is brittle and under-instrumented.

System causes:

- Verification lives too much in prompts, docs, and summaries.
- Product promises are not encoded as contracts.
- Horizontal phase planning delayed integration feedback.
- Builder and verifier roles are not separated enough.
- CI/local hooks do not all run the same meaningful proof set.

Root fix:

Move from "AI builds, then we ask if it worked" to "the repo defines contracts and proof scripts; AI code only survives if those pass."

## Recovery Plan: Harness First, Refactor Second

1. Define the five product contracts: access/session, grounded Tutor answer, content library freshness, compare tools, Studio generate-to-render.
2. Write or upgrade one proof script per contract.
3. Make each proof script start a fresh server or prove the server commit/build it is testing.
4. Add deterministic fixtures for chat, generation, and content freshness so the proofs can run without expensive or flaky provider calls.
5. Put auth/rate-limit checks into `proof:security` before any public/client deployment.
6. Only after those gates exist, refactor the large UI/pipeline files around the workflows the proofs protect.
7. Keep a verification ledger so every "done" claim has command output, screenshot/trace, or persisted artifact behind it.

## What Not To Do Next

- Do not add more broad unit tests and expect the false positives to disappear.
- Do not expand `CLAUDE.md` into a longer constitution.
- Do not let the same agent write a feature, write its tests, and declare it done in one saturated context.
- Do not refactor the UI first; it will make the code prettier without proving the product works.
- Do not treat "all checks passed" as meaningful until the check names map to product promises.

The larger fix is a confidence architecture. Once the harness exists, Claude/Codex becomes much safer: it can still generate wrong code quickly, but the repo will reject the wrongness before it reaches the client.

## Broader Best-Practices Addendum: Beyond the External Review

This section is not derived only from the external review. It is the broader engineering pass I would apply to a client-facing AI learning platform with a Next app, LLM calls, file-backed content, background generation, and Remotion rendering.

### Additional P0.7: The app needs an explicit security model, not just access codes

The current access model is closer to a demo gate than an application security boundary. `sessionId` is passed in request bodies, student mode is unlocked by a shared access code, and operator routes are controlled mostly by environment flags.

Best-practice target:

- Treat access code as enrollment/demo gating, not authentication.
- Use signed, httpOnly, sameSite cookies or a real auth provider for sessions.
- Define roles explicitly: anonymous/demo learner, student, operator/admin.
- Require admin authorization on every route that mutates content, launches jobs, applies drafts, cancels jobs, or writes comments/edits.
- Add CSRF/origin checks for browser-triggered mutations.
- Add a threat model document before any public/client deployment.

The key root-cause issue is ambiguous trust. Right now the codebase does not clearly separate "can view lesson content" from "can operate the production pipeline."

### Additional P1.10: Background jobs should be modeled as jobs, not inferred files plus PIDs

The Studio generation flow is implemented as a detached process with status inferred from a status file, PID liveness, and draft file timestamps. That is a pragmatic prototype, but it is fragile for client work.

Best-practice target:

- Introduce a real job model: `queued`, `running`, `succeeded`, `failed`, `cancel_requested`, `canceled`.
- Give every job a stable `jobId`, `lessonId`, `idempotencyKey`, timestamps, command, inputs hash, outputs, and error summary.
- Store job state in a durable store rather than only lesson-local status files.
- Write stdout/stderr and raw model output to per-job artifacts.
- Make cancellation cooperative first, then process-tree kill as fallback.
- Never infer success only from a file existing; verify output schema, freshness, source refs, and render proof.

SQLite would be enough at this project size. A full queue system is optional, but a job table/state machine is not.

### Additional P1.11: File-backed persistence should be intentional and bounded

File-backed JSON is fine for local demos and static course content. It becomes risky when used for mutable sessions, edits, job state, and operator workflows without locking, atomic writes, or migration rules.

Current examples:

- `chatbot/src/lib/session.ts` writes one JSON file per session.
- generation status/drafts live under `content/lessons/*`.
- comments and edits are staged in local stores.

Best-practice target:

- Keep canonical course content as versioned files when that is useful.
- Move mutable runtime state to SQLite/Postgres: sessions, access attempts, jobs, comments, staged edits, audit events.
- If files remain, use atomic temp-file plus rename writes and clear ownership rules.
- Add a cleanup/retention policy for sessions, job artifacts, screenshots, traces, and logs.

This is less about scale and more about eliminating ambiguous state, race conditions, and "works on my machine" behavior.

### Additional P1.12: Centralize environment and feature-flag validation

Environment behavior is currently spread across modules, and at least one provider value falls through silently to Anthropic.

Best-practice target:

- Add one server-only config module that parses environment variables with Zod at startup.
- Fail closed on missing production secrets, unknown providers, invalid feature flags, and unsafe dev bypasses.
- Separate public `NEXT_PUBLIC_*` variables from server-only secrets.
- Print a redacted config summary in development and CI.
- Add tests for production config failure modes.

The rule: invalid configuration should fail before the app accepts traffic or starts a costly job.

### Additional P1.13: Add request, retrieval, and job observability

AI systems need more than error logs. You need to know what content was retrieved, what source IDs were cited, what provider was called, what the model returned, what parser accepted, and what artifact was produced.

Best-practice target:

- Add request IDs to API responses/logs.
- Add job IDs to every generation, ingest, apply, cancel, and render event.
- Log retrieval scores, selected tool IDs, citation IDs, provider, model, latency, token/cost estimate, parse result, and validation result.
- Keep raw LLM outputs for failed generation/parsing in job artifacts.
- Redact secrets and access codes.
- Surface job timelines in Studio instead of only a single status.

This directly attacks the current debugging loop where "it failed" is visible, but the exact boundary failure is hard to reconstruct.

### Additional P1.14: Define API contracts for every route the UI depends on

The repo uses some Zod request schemas, which is good. The missing piece is complete request/response contracts and route-level contract tests.

Best-practice target:

- Every API route gets request and response schemas.
- UI code imports typed clients rather than hand-building `fetch` calls.
- Tests validate both success and error responses.
- Playwright tests assert that the UI action caused the expected network request and response.
- For LLM/provider boundaries, define provider contract tests that every provider implementation must pass.

This prevents "fake adapters" and "phantom passthroughs." If a provider is named, it must satisfy the same contract as the production provider or fail fast.

### Additional P1.15: Retrieval quality needs evaluation, not only keyword scoring

`findRelevantContent` uses straightforward keyword scoring. That is simple and transparent, but it is not enough for a teaching assistant promise.

Best-practice target:

- Build a small golden question set for each lesson/tool.
- Track expected retrieved tools/sources for each question.
- Measure retrieval precision and citation correctness in CI or pre-delivery checks.
- Add "no sufficient context" cases to prevent generic fallback.
- Consider a lightweight lexical index, embeddings, or hybrid retrieval only after the golden set exists.

Do not start with a more complex RAG stack. Start with evaluation. Without an eval set, a fancier retriever just fails more opaquely.

### Additional P1.16: Separate product surfaces by deployment risk

The app currently combines learner surfaces, marketing/demo surfaces, content library, compare, Studio, ingestion, regeneration, and pipeline triggers.

Best-practice target:

- Public learner app: read-only lessons, chat, content library, compare.
- Private operator console: Studio, ingestion, regenerate, apply, cancel, job logs.
- Pipeline worker: generation/render/ingest commands with no public HTTP surface.

This can still live in one repo. The important move is separating deployment exposure and permissions. Client-facing reliability improves when operational controls are not one route away from the public app.

### Additional P2.5: Create an architecture decision record trail

The planning docs are rich, but they mix current state, old state, research, and handoff notes. Best practice is to record decisions separately from plans.

Add lightweight ADRs under `.planning/adr/`:

- Why file-backed content is canonical or temporary.
- Why Studio is in/out of the learner app.
- Which auth model is used and why.
- Which generation backend is production-supported.
- Which checks define client-ready.
- Which retrieval strategy is accepted and how it is evaluated.

ADRs help future agents avoid reopening settled questions or preserving accidental architecture.

### Additional P2.6: Prefer small vertical modules over broad component refactors

The tempting move is to split every 250-line component. The better move is to split around workflows that have proofs.

Best-practice target:

- `chat` feature owns session creation, chat API client, chat UI, and chat proof tests.
- `studio-generation` owns job trigger/status/apply/cancel UI and proof tests.
- `content-library` owns source loading, freshness display, and proof tests.
- `compare` owns comparison data contracts and proof tests.

This feature-oriented structure is friendlier to AI agents because the files required for a task are naturally colocated around one vertical slice.

### Additional Client-Ready Operating Standard

Before using this for client delivery, the repo should be able to answer these questions with artifacts, not opinions:

- What exact commit was deployed or demoed?
- What product contracts passed on that commit?
- Which proofs were skipped, and why?
- Are operator routes inaccessible to learners?
- Which content sources are stale, skipped, or failed?
- Which model/provider/backend was used?
- Where are the screenshots, traces, logs, and rendered outputs?
- What is the rollback path?

This is the professional reliability layer the project is missing. It is also the layer that will make AI-assisted development feel dramatically less chaotic.
