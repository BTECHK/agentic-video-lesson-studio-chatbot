# Decisions Ledger — MVP1 Launch Push

Single place recording decisions for the audit-remediation + MVP1 launch run. Reversible calls I make autonomously are logged at the bottom so they can be reviewed/undone. Started 2026-05-27.

## Launch definition (MVP1)

- **Target:** MVP1 for an internal **leadership meeting**. Presenting the whole platform.
- **Deployment:** **Local host we control. NOT publicly reachable.** No public internet exposure required for Friday.
- **Drop-dead date:** **Friday 2026-05-29.** Fallback if the website can't be made fully working: switch to producing physical lesson plans manually, no website.
- **Launch bar:** all bug fixes fixed · edge cases handled · testing · logging · security · proper API auth where necessary · all website features working · **issue board cleared**.
- **Constraint:** **No paid services** by default. Paid API keys only where genuinely crucial, called out and added to the board for explicit approval.

## Locked decisions (from owner, 2026-05-27)

| # | Decision | Choice |
|---|----------|--------|
| Scope | What "launch" is | Internal MVP1, local host, not public |
| Security threat model | Public-internet vs internal | Internal/local — but security + auth still on the bar |
| Bootstrap RAG fallback | Refuse vs answer-from-general-knowledge | **Answer from general knowledge, clearly labeled** ("not in our content, but generally…"). Never hard-refuse. |
| Studio generation | In/out of scope | **IN scope.** Must work end-to-end (generate → apply → render). |
| Generation engine | Free CLI vs paid API | **Claude Code (`claude -p`) is the primary engine.** No paid key for generation. Stop over-engineering front-end generation. |
| Tutor chat engine | API key vs free CLI vs mock | **Option B — build a free Claude-Code-CLI chat provider** (`claude -p`). No paid key. Accept higher latency / no streaming. Build it swappable so an API provider can drop in later. |
| Access gate | Keep/remove | Keep access code as enrollment gating; **remove hardcoded fallback, fail-closed when unset.** |
| Branch/PR model | PRs vs master | **Commit straight to master.** Stop-hook gates still enforce green. |
| Autonomy | Ask vs proceed | **Use best judgment, log every reversible call here, proceed. Stop only for irreversible / cost-incurring decisions.** |
| Verification | Trust tests vs prove | **Prove it. Do not trust "test passed."** Review the actual test output / run the real app / inspect results and demonstrate correctness with evidence. (Counters AI self-sycophancy.) |
| Instructor content | Hands-off vs develop | **Develop it.** Author Lesson 1 from `original background content/sample-course-outline.docx` + `Module 1 Slides`, shaped by Instructor's simple Module 1. Use everything in `content/` + `original background content/`. |
| Tracker | Jira vs GitHub | **GitHub Issues = the board, and the single source of truth going forward.** Everything tracked in one visible place. |
| State docs | Reconcile | **Reconcile** STATE.md / READMEs into one current-state doc; board is canonical. |
| Cadence | Big-bang vs agile | **Agile small batches.** Plan a small group (1–3 related items) → execute → PROVE done correctly → next. Incremental, trackable wins. |

## Paid API keys — RESOLVED: none needed

- Tutor live chat: **Option B chosen** — build a free Claude-Code-CLI chat provider. **No `ANTHROPIC_API_KEY` required.**
- Generation: **free** (claude-code CLI). No key.
- TTS / alignment / ingestion: **free** (Kokoro/Chatterbox/stable-ts/Cheerio). No key.

Net: the entire MVP1 runs with **zero paid services**, consistent with the hard constraint.

## Deferred to post-launch (tracked as an epic, not done by Friday)

- Physical learner/operator deployment separation (logical separation via auth + env-gating suffices for local).
- Job state machine + SQLite migration + full request/job observability.
- ADR trail; large-component refactors.

## Reversible-call log (autonomous decisions, newest first)

- **#68 curriculum + Lesson 1.1 authored (2026-05-28):** Authored Topic 1 Lesson 1.1 "How This Course Works" as a real pipeline bundle (`content/lessons/topic-1-lesson-1/`) from Instructor's actual Module 1 slides — not the engineer strawman in `module-1/`. It has a handful of scenes, all existing scene components, concept-only so fact-check passes with **zero** unverifiable refs. Picked Lesson 1.1 as the first vertical slice because it's the first lesson AND pure 🟦 slide content (no tool/price/model facts → sidesteps the freshness-grounding that later lessons carry). **Pipeline change (TDD):** added optional `content` to `OutlineBeatSchema`; `buildSceneContent` (scene-planner) now returns a beat's explicit `content` verbatim when present, else the prior grounding/default. Rationale: the outline is the human curriculum layer and must own slide copy (STRATEGY.md) — without this the planner emitted its hardcoded placeholder journey instead of the course's real journey. Additive + back-compatible: `module-1` output is byte-identical (planner test still green). Proven: fact-check clean, `plan-lesson` writes a LessonSchema-valid `lesson.json` (~138s), and all rendered stills are non-blank + brand-correct (Syne, linen, #8B2635). Left `module-1/` strawman untouched (separate concept reel) rather than mutating it.

- **#67 cancel process-tree (2026-05-28):** `chatbot/src/lib/process-tree.ts` — `killProcessTree` (Windows `taskkill /PID <pid> /T /F` for the whole tree; POSIX negative-pid process-group kill with bare-pid fallback) + `waitForExit`. Cancel route now tree-kills the recorded pid and **verifies exit before** writing `canceled`, so it can't report success while the real `tsx/claude` grandchild keeps running. Chose tree-kill over the "resolve .cmd / drop shell:true" alternative — keeps the proven cross-platform npx spawn intact. Real-process integration test proves a detached shell child is actually terminated.

- **#60 operator auth boundary (2026-05-28):** Added `requireOperator`/`isOperatorAuthorized` (`chatbot/src/lib/operator-auth.ts`) — **deny-by-default** on all 8 write/operator routes (generate, generate/cancel, generate/apply, ingest, regen, edits POST/PATCH, edits/apply, comments POST/PATCH). Fail-closed: with no `OPERATOR_TOKEN` set and no dev bypass, every write route returns **401**. Accepts a timing-safe `x-operator-token` header; local dev/demo authorizes via `NEXT_PUBLIC_DEV_BYPASS=true` (NODE_ENV-gated, ignored in prod — mirrors `access.ts`). **GET reads** (comments/edits list, generate/status poll) left open — low-sensitivity staging reads, can tighten post-launch (#70). For the local internal demo: set `NEXT_PUBLIC_DEV_BYPASS=true` (also unlocks student access) — the console then works without wiring a token into client JS. Physical learner/operator split stays deferred (post-launch), per the launch definition.

- **#66 generation hardening (2026-05-28):** Root cause of the logged `no JSON object found` failures = the model returned prose (a clarifying question) and the raw output was never persisted, so it was undiagnosable. Added `generateScriptObject` + `buildRepairPrompt` (`src/lib/generation.ts`): on any failed parse it persists the raw stdout to `content/lessons/<id>/.generate-failures/` and retries once with a JSON-only repair prompt; throws (never "succeeds") if all attempts fail. Fixture `test/fixtures/generate-2026-05-26-prose-failure.txt` pins the failure mode. Did NOT change the `shell:true` spawn (pre-existing; #67's process-tree scope) and did NOT commit the regenerated `script.draft.json` (proof-run side-effect). Live `claude -p` run succeeded: 9 blocks, 56 refs verified, factCheckOk.

- **#64/#65 Tutor e2e + fresh server (2026-05-28):** Found a real gap — the chat route returned *unverified* citations and `CitationBadge` ignored the `verified` flag, so a fabricated source would render. Fixed: added `keepGroundedCitations` (citations.ts) and the route now drops any citation whose tool wasn't retrieved (hallucination guard). E2E (`e2e/tutor-rag.spec.ts`) drives the **mock** provider (deterministic, no live claude/paid calls) — grounded Q → verified citation; off-topic Q → answered + fabricated citation stripped. Playwright now defaults to a **fresh** server on a dedicated port (`PW_PORT`, default 3201), reuse only via `PW_REUSE_SERVER=true`; `e2e/global-setup.ts` logs the commit under test. **Stopped the stale :3100 `next dev` (PID 24896) from the prior session** so the fresh server could boot (Next 16 allows one dev server per project) — restart with `npm run dev -- -p 3100` for manual checks, but it must be down when running e2e.

- **#63 chat provider (2026-05-28):** Built `ClaudeCodeProvider` (`chatbot/src/lib/llm/claude-code-provider.ts`) — free Tutor chat via headless `claude -p --output-format json`, prompt fed on stdin (no shell injection), injectable runner for tests, 120s timeout. Reuses the proven spawn pattern from `scripts/generate-script-headless.ts`. `claude-code` requires no key. **docker-compose default stays `mock`** (the container image has no `claude` CLI / authed session); `claude-code` is the host/demo provider — set `LLM_PROVIDER=claude-code` in `chatbot/.env` for the live demo. Full route E2E proof deferred to #64.

- **#57 config (2026-05-28):** Canonical `LLM_PROVIDER` set = `mock | anthropic` for now; `claude-code` added by #63. Unset `LLM_PROVIDER` now defaults to **`mock`** (was `anthropic`) so an unconfigured deploy can't accidentally bill the paid API. `anthropic` fails closed (throws) when `ANTHROPIC_API_KEY` is missing, unconditionally (not NODE_ENV-gated) — choosing the paid provider without a key is always a misconfig. docker-compose default `claude-passthrough` (invalid, silently hit Anthropic) → `mock`. Validation lives in `chatbot/src/lib/config.ts` (`loadLLMConfig`).
