# Sample Academy — AI Content System

## Project Context

An AI content production system for Sample Academy, a learner-focused AI education platform. Produces animated video lessons (MP4) from structured content for Teachable LMS delivery. Container-first, stakeholder-demo quality.

**Stack:** Remotion v4, TypeScript, Docker (node:22-bookworm-slim), FFmpeg, Zod
**Brand:** Syne font, #EDE8E3 base, #8B2635 accent, 4px radius everywhere

## Planning

All planning docs live in `.planning/`. Start with `.planning/ROADMAP.md` for the phase structure.

- `.planning/ROADMAP.md` — phase structure (5 phases)
- `.planning/REQUIREMENTS.md` — 27 v1 requirements with traceability
- `.planning/config.json` — workflow preferences
- `.planning/research/` — domain research (stack, features, architecture, pitfalls)

## Hard Rules

- **No choppy slide transitions.** Animations must be smooth, flowing, spring-physics. Reference: Anthropic Cowork video aesthetic.
- **Container-first.** Docker from day 1. Keep the project on a native Linux filesystem (WSL2 on Windows) for bind-mount performance.
- **TDD approach.** Write tests before implementation. Never report "complete" without tests passing — enforced by the Stop-hook script `.claude/hooks/stop-gate.py` when wired in via `.claude/settings.json`: typecheck + lint + test must pass on the changed slice before a turn can end. CI (`.github/workflows/ci.yml`) re-runs the same checks plus full builds at push time.
- **Vertical slices.** Build one slice end-to-end (data → logic → UI, ending green with render/screenshot proof) before expanding sideways. No horizontal half-built layers — they are where phantom progress hides.
- **Visual verification.** Every rendered scene needs human-reviewable screenshots. Headed mode for development. `npm run verify:render` probes a composition for non-blank frames.
- **Brand compliance.** Syne font, warm linen palette, 4px radius — no exceptions.
- **Official sources only.** AI tool claims must reference vendor docs, not training data.
- **Teachable constraints.** Output is MP4 video (1080p, 30fps, <2GB). No HTML embeds.

## Workflow

Mode: YOLO (auto-approve). Research + plan check + verifier enabled. Quality model profile (Opus).
Use `/gsd-progress` to check status. Use `/gsd-plan-phase N` to plan a phase.

## Content Delivery (Google Drive)

Finalized, gate-green lesson artifacts are delivered to the shared Google Drive — NOT through git
(MP4s too big). Local sync path: `<DRIVE_ROOT>\Content Development\Curriculum`
(Drive folder id `<DRIVE_FOLDER_ID>`; also reachable via the Google Drive MCP connector).

- Structure: `00 — START HERE/` (course overview + promo sizzle) · `Module N — <title>/Lesson N.M — <title>/`.
- Exec-facing naming is **Module/Lesson** (repo keeps `topic-N-lesson-M`); per lesson ship exactly
  three artifacts: `N.M Video.mp4` · `N.M Script.pdf` · `N.M Lesson Plan.pdf`. Learning material only —
  never JSON, code, or internal planning docs.
- A lesson may only be dropped here when `npm run gate:status -- <id>` exits 0 (A·B·C·L all green).
- **Publish step (cross-machine):** `npm run publish:drive -- <lessonId>` copies the gate-green
  Video + Lesson Plan (+ Script reference) into the right `Module/Lesson` folder (matched by number
  prefix, tolerant of title punctuation). The Drive root is a **per-machine variable** — one mount per OS. Set `DRIVE_CURRICULUM_DIR` env **or** `drive.local.json`
  (git-ignored; copy `drive.config.example.json`). Refuses unless gates are green (`--force` overrides)
  and fails loudly with guidance if Drive is unmounted, the path moved, or the mount is read-only.
  **Run this as the final step of every full lesson build.**

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **agentic-video-lesson-studio-chatbot** (4453 symbols, 7248 relationships, 231 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

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
