# Sample Academy — Consolidated Project Status & Reorg Plan

**Date:** 2026-05-23
**Purpose:** One place to see where every piece stands, what's blocked and why, where documents live for review, and how we harden against phantom progress (broken chains) before building more. Triggered by an external agent-reliability review + the Remotion best-practices skill.

---

## 1. Phantom-progress reality check (what's real vs not)

The anti-phantom-code thesis: AI agents produce *finished-looking* output, not *verified* output; chains break at links 2 and 4 while 1/3/5 look done. Honest audit of THIS repo:

| Claim | Status | Evidence / gap |
|-------|--------|----------------|
| Pipeline data spine (outline→script→lesson.json) | **Verified** | CLIs actually ran: `generate-script --check` (36 refs, 0 flags), `plan-lesson` (valid lesson.json). Not just tests. |
| 243/243 tests pass | **True but narrow** | Unit/schema/logic only (Zod, fact-check, planner math). Prove no rendering, no wiring, no UI. |
| Module 1 renders to video | **Not built** | No scene components (Phase C-2), no MP4. Honestly scoped, not claimed done. |
| Website (chatbot) works | **Unverified this session** | Phase 7.1 marked shipped, but not re-verified: no build/run/screenshot here. |
| Chatbot RAG grounding (CHAT-01/02) | **Phantom-risk (pre-existing)** | REQUIREMENTS says "scaffold only — RAG not wired." UI exists, backend chain incomplete. |
| Structural anti-phantom layer | **Absent** | No `.claude/hooks/`, no CI, no Lefthook, no Playwright, no root `typecheck`/`lint`. |

**Conclusion:** No false "done" claims were made, but we have **zero structural guarantees** preventing them. That is the highest-leverage thing to fix.

---

## 2. Document map — what to review when everything's done

| # | Document | Path | What it is | Review when |
|---|----------|------|-----------|-------------|
| 1 | Pipeline design spec | `docs/superpowers/specs/2026-05-23-codified-lesson-pipeline-design.md` | The full lesson-factory architecture | Now / anytime |
| 2 | Pipeline research brief | `.planning/research/ai-lesson-pipeline-research.md` | TTS/alignment/Remotion findings + licenses | Reference |
| 3 | Studio UI contract | `.planning/research/studio-timeline-ui-spec.md` | The CapCut-style control plane design | Before Phase G |
| 4 | This plan | `.planning/PROJECT-PLAN-2026-05-23.md` | Status + reorg (you're reading it) | Now |
| 5 | Pipeline build handoff | `.planning/PIPELINE-HANDOFF.md` | Phase-by-phase remaining build (C-2→G) | Reference |
| 6 | Instructor voice guide | `content/teaching/STYLE.md` | Their teaching voice, mined from transcripts | **Review for accuracy** |
| 7 | Module 1 outline | `content/lessons/module-1/outline.json` | Lesson structure (human-directed) | **Review/approve** |
| 8 | Module 1 script | `content/lessons/module-1/script.json` | The talk track in Instructor's voice | **Review/approve** (the gate that matters most) |
| 9 | Module 1 lesson (planned) | `content/lessons/module-1/lesson.json` | Scenes + timing + narration, schema-valid | After Phase C-2 (visual) |
| 10 | The rendered video | `out/module-1.mp4` *(not built yet)* | The deliverable | After Phase E |
| 11 | Requirements (updated) | `.planning/REQUIREMENTS.md` | v1 reqs incl. promoted pipeline group | Reference |
| 12 | Roadmap | `.planning/ROADMAP.md` | Phase structure | Reference |

**Studio control plane (Phase G) is the eventual home for reviewing #6–#10 visually** — the multi-track timeline where you see script/animation/voice/captions stacked and comment on any element.

---

## 3. Whole-project status & what's blocked (and why)

Everything in motion, one table. "Blocked" = cannot start until dependency exists.

| Area | Item | State | Blocked by / why | Next step |
|------|------|-------|------------------|-----------|
| **Pipeline** | A: schemas + STYLE + outline | ✅ Done | — | — |
| | B: script gen + fact-check | ✅ Done | — | — |
| | C-1: scene planner → lesson.json | ✅ Done | — | — |
| | C-2: 9 Remotion scene components + LessonVideo | ⬜ Ready | Nothing — ready to build | Build (quality-sensitive) |
| | D: free/local TTS sidecar | ⬜ Ready | Needs Docker+Python+model download (heavy setup, not a blocker) | Build sidecar |
| | E: align + timing + **MP4** | ⏭ Downstream (not stalled) | Sequential: needs **C-2** (components) + **D** (audio) done first — you can't render a video without them | After C-2 + D |
| | F: regeneration DAG | ⏭ Downstream | Sequential: caches A–E artifacts | After E |
| | G: Studio timeline UI | 🟡 Partial-ready | Can show script+animation now; voice/caption tracks need D+E | First version after C-2 |
| **Chatbot** | CHAT-01/02/06: RAG grounding + citation verify | 🚨 Scaffold only | RAG never wired — **pre-existing broken chain** | Verify + wire (vertical slice) |
| | CHAT-04/05: Office Hours + SQLite persistence (Phase 8) | ⬜ Not started | — | Plan when prioritized |
| **Content** | CONT-07/08: comparison feature + labels (Phase 6) | ⬜ Pending | — | Plan when prioritized |
| **Ingestion** | Phase 8.5: Ingestion Control Panel | ⬜ Scoped only | Needs discuss-phase | Plan when prioritized |
| **Demo** | DEMO-01: stakeholder demo animation (Phase 10) | ⬜ Pending | Benefits from pipeline (C-2/E) | After pipeline proven |
| **Infra** | Anti-phantom verification + CI (NEW) | ⬜ Not started | — | **Recommend FIRST** (see §4) |

---

## 4. NEW Phase H0 — Verification & Anti-Phantom Hardening (recommended FIRST)

Adopted from an external anti-phantom-code review. Highest ROI: makes every later phase self-verifying so we don't iterate over broken chains. Cheap (≈1–2 focused sessions), then reused forever.

| Layer | What | Why it kills phantoms | Cost |
|-------|------|----------------------|------|
| **Root tooling** | Add `typecheck` (`tsc --noEmit`) + `lint` scripts to root + chatbot | Today nothing typechecks the whole repo | XS |
| **Stop hook** | `.claude/hooks/stop-gate.py` exits 2 until `build && typecheck && lint && test` pass on the changed slice (+ `stop_hook_active` guard, "AUTOMATED QUALITY GATE" wording) | Agent literally cannot end a turn with broken code → no phantom "done" | S |
| **PostToolUse hook** | format + incremental typecheck on every Edit/Write | Catches breakage at write time | S |
| **Lefthook pre-commit** | lint + typecheck + `vitest related` on staged; pre-push runs Playwright smoke | Can't commit/push broken code | S |
| **Playwright (local, free, OSS)** | One smoke test per real feature: drive localhost, click the button, assert the chain fires. Start with the chatbot (does a question actually hit RAG?) and the Studio | **The anti-phantom-wiring tool** — proves UI↔backend connect | M |
| **GitHub Actions CI** | `.github/workflows/ci.yml` runs the *same* `npm run check` as the Stop hook | No "works locally, fails CI" drift | S |
| **Render verification** | A check that actually renders Module 1 to MP4 + captures per-scene screenshots (satisfies existing VERI-01..04, which are currently only partially real) | Proves the video pipeline produces frames, not just valid JSON | M |
| **Vertical-slice rule** | Add a "build one DB→logic→UI slice end-to-end before expanding" rule to CLAUDE.md | Stops horizontal half-built layers | XS |

**Note on CLAUDE.md:** the PDF says keep it ≤120 lines, facts not personality, hooks for guarantees. Our current `CLAUDE.md` is fine on length; we should move *guarantees* (TDD, "never report complete without tests") from prose into the **Stop hook** so they're enforced, not requested.

Tooling to adopt (all free/OSS, fits "no paid services"): **Lefthook**, **Playwright** (already implied by our VERI reqs), **GitHub Actions + act** for local CI, optionally **fallow** (module-graph audit for unresolved imports/dead code). superpowers (TDD gate) is already installed.

---

## 5. Remotion best-practices adoption (from the skill Instructor sent)

`skills.sh/remotion-dev/skills/remotion-best-practices` is an installable skill (like superpowers) covering 30+ rules: audio sync, `calculateMetadata`, sequencing, captions, audio visualization, AI voiceover, deterministic rendering. Plan:

1. **Install the skill** so it's loaded during Phase C-2/E execution (the build sessions that touch Remotion).
2. Our research brief (§4) already captured the load-bearing rules — fold them into Phase C-2/E as hard requirements:
   - `calculateMetadata` reads `lesson.json` → `durationInFrames` (JSON stays single source of truth).
   - `<Audio>` inside each scene `<Sequence>`; per-scene audio (never one monolithic file).
   - `@remotion/captions` `Caption[]` from stable-ts alignment; `createTikTokStyleCaptions` for paging.
   - `@remotion/media-utils` `getAudioDurationInSeconds` for audio-authoritative timing.
   - Deterministic rendering (already an INFRA req) — seed/cache so re-renders are stable.
3. Add a Remotion-specific Playwright/Studio smoke: render a 1-second probe of `LessonVideo` and assert non-blank frames (ties to render verification in §4).

---

## 6. Recommended sequencing (the reorg)

```
NOW ──▶ Phase H0: Verification & Anti-Phantom Hardening   (cheap, do first — protects everything after)
        │  hooks · Lefthook · Playwright smoke · CI · render-verify · typecheck/lint
        ▼
        Verify existing claims with the new gates:
          • Does the chatbot actually build/run? (screenshot)
          • Is RAG (CHAT-01/02) really wired, or scaffold? (Playwright smoke) ← likely a real fix
        ▼
        Resume pipeline as VERTICAL SLICES (each ends green + screenshot/render proof):
          C-2 (scene components, install Remotion skill) ─▶ D (TTS) ─▶ E (MP4) ─▶ F (regen) ─▶ G (Studio)
        ▼
        Then the parked tracks by priority: Phase 8 (chatbot), 8.5 (ingestion panel), 6 (comparison), 10 (demo)
```

**Why H0 first:** every pipeline phase from here (components, audio wiring, render, Studio UI) is exactly the kind of multi-link chain that breaks silently. Pouring the verification foundation once means C-2→G each *prove* themselves, and you review a trustworthy artifact at the end instead of debugging phantoms.

---

## 7. DECISIONS (2026-05-23)

- **Sequencing:** Harden FIRST (Phase H0), then resume production (C-2 + D in parallel → E → F → G).
- **"Blocked" clarified:** E/F/G are not stalled — they're *downstream* of C-2 + D. The ready work is C-2 and D.
- **H0 right-sized for stage (solo, no users, local-first)** — two enforcement walls + real render proof, skip the enterprise tail:

  **H0 — do now (crucial):**
  1. Add `typecheck` (`tsc --noEmit`) + `lint` + a combined `check` script (root + chatbot).
  2. **Stop hook** `.claude/hooks/stop-gate.py` — exit 2 until `build && typecheck && lint && test` pass; `stop_hook_active` guard; "AUTOMATED QUALITY GATE" wording. Wire via settings.json. (Move the prose "never report complete without tests" rule into this hook.)
  3. **GitHub Actions CI** `.github/workflows/ci.yml` running the same `check` (push-time safety net; shipping-relevant).
  4. **Render verification** script: render a short probe of a Remotion composition, assert non-blank frames + capture screenshots → makes VERI-01..04 real. Expand to full Module 1 after C-2.
  5. **Vertical-slice rule** added to CLAUDE.md (build one end-to-end slice before expanding sideways).
  6. **Playwright**: install + ONE smoke test as the pattern; grow per-feature later.
  7. **Install the Remotion best-practices skill** for the C-2/E build sessions.

  **H0 — backlog (revisit at collaborators / users / scale):**
  - Lefthook pre-commit · PostToolUse format hook · `fallow` module-graph audit · `act` local CI runner · full per-feature Playwright suite

- **Chatbot re-verify:** **Not now** — stay focused on the pipeline; audit chatbot RAG (CHAT-01/02) later (the scaffold-only risk is logged here so it isn't forgotten).
- **Execution note (eating our own dog food):** this planning ran in a long context. Per the anti-context-rot guidance we're adopting, **execute H0 in a fresh session** (or via fresh per-slice subagents) rather than at the tail of a long one.
