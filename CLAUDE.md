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
