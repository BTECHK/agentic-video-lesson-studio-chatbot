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

This project is indexed by GitNexus as **agentic-video-lesson-studio-chatbot** (8021 symbols, 11919 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/agentic-video-lesson-studio-chatbot/context` | Codebase overview, check index freshness |
| `gitnexus://repo/agentic-video-lesson-studio-chatbot/clusters` | All functional areas |
| `gitnexus://repo/agentic-video-lesson-studio-chatbot/processes` | All execution flows |
| `gitnexus://repo/agentic-video-lesson-studio-chatbot/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
