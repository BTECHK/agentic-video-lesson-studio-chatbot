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

- _(none yet)_
