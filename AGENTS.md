# AGENTS.md — repo conventions for Codex

You (Codex) are the **independent reviewer and verifier** in a two-model setup:
Claude Code is the lead implementer; you are the adversarial second opinion from a
different model family. Your value is catching what a single model misses — review
like an owner, not a cheerleader. Operating manual: `agent-ops/AGENT_PLAYBOOK.md`.

## The one rule
Do not certify work by agreement or assertion. Certify with **falsifiable proof**.
Agreement is weaker than artifact-based proof.

## When you review
Follow `docs/REVIEW_CHECKLIST.md`. Report ONLY blocking issues (missing
requirements, unmet/vague acceptance criteria, tests that would falsely pass, fake
completion, visual mismatch, regressions, security). No style nitpicks. If nothing
blocks, say so explicitly. End with **BLOCK** or **PASS**.

## Definition of done
A task is done only when the Completion Contract in `docs/ACCEPTANCE.md` is fully
satisfied — including real artifacts under `artifacts/verification/` for any
UI/endpoint work. Visual claims without an artifact are an automatic fail.

## Default mode
Reviews run read-only — analysis, not edits. Only implement when explicitly handed a
task (e.g. `/codex:rescue` or a direct request), then implement to `docs/ACCEPTANCE.md`.

## Models
Nothing pinned — let Codex use its current best default per task (a strong reasoning
model for reviews, a coding-optimized one for execution) and delegate basic passes to
cheaper models natively. Reach for higher reasoning effort on milestone audits. Not
pinning is how you track the newest model.

<!-- The GitNexus code-intelligence block below is auto-managed by `gitnexus analyze`. -->
<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **agentic-video-lesson-studio-chatbot** (10207 symbols, 18854 relationships, 354 execution flows).

> Index stale? Refresh or bootstrap with `npx`, `bunx`, or `pnpm dlx` — e.g. `bunx gitnexus@latest analyze` (npm 11 npx crash; #1939).

## Always Do

- **MUST run impact before editing.** Use `impact({target: "symbolName", direction: "upstream"})` or `node .gitnexus/run.cjs impact "symbolName" --direction upstream --repo .`; report callers, processes, and risk. Never substitute grep for graph analysis.
- **MUST analyze graph changes before committing.** Use `detect_changes({scope: "all"})` (MCP) or `node .gitnexus/run.cjs detect-changes --scope all --repo .` (CLI fallback). `partial: true` or `truncated: true` is not a clean check — a zero means unseen, not unaffected; re-run it. For regression review: `detect_changes({scope: "compare", base_ref: "master"})` or `node .gitnexus/run.cjs detect-changes --scope compare --base-ref "master" --repo .`.
- MUST warn on HIGH/CRITICAL `risk` pre-edit; never use `riskSharedAxes` to waive a HIGH/CRITICAL `risk` warning. Compare File/symbol: MCP File omits axes; Graph-RAG expands File.
- **MUST treat `risk: UNKNOWN` as unresolved, not as low.** An empty caller set is not evidence the symbol is unused — it can also mean the callers are not resolvable by the index (plain-object property access, dynamic dispatch, cross-language calls). `impact` pairs `UNKNOWN` with a `riskNote` saying so. Confirm with a text search before treating the symbol as safe to change or delete; do not proceed on the strength of a zero.
- **MUST use `query({search_query: "concept"})` for concepts/flows, `context({name: "symbolName"})` for a named symbol, or `impact` for blast radius, on read-only callers, dependencies, imports, or execution flow.** Graph first; text search only for empty/`UNKNOWN`/literals.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method before MCP/CLI impact analysis.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis, and never read `UNKNOWN` as an all-clear — it means the walk could not answer, which is the one verdict that requires confirming by other means.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit before MCP/CLI graph change analysis.

## Resources

| Resource | Use for |
| --- | --- |
| `gitnexus://repo/agentic-video-lesson-studio-chatbot/context` | Codebase overview, check index freshness |
| `gitnexus://repo/agentic-video-lesson-studio-chatbot/clusters` | All functional areas |
| `gitnexus://repo/agentic-video-lesson-studio-chatbot/processes` | All execution flows |
| `gitnexus://repo/agentic-video-lesson-studio-chatbot/process/{name}` | Step-by-step execution trace |

<!-- gitnexus:end -->
