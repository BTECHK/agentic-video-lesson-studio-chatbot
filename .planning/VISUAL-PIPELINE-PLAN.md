# Visual-Demonstration Pipeline v2 — Detailed Plan (no build)

**Status:** PLAN for review — nothing here is implemented. Issue: #89. Date: 2026-08-01.
**Inputs:** three research appendices (`agent-ops/goal-2026-08-01/research/P1-A|B|C-*.md` — Remotion ecosystem · studio/edu pipelines · asset-gen tooling), current repo pipeline, 2026-08-01 current-state sweep, student feedback ("instructor describes what to do without actually showing it"), reviewer feedback (a reviewer).

---

## 1. What this plan changes, in one paragraph

Today the pipeline goes outline → lesson-plan → lesson.json → TTS/align → full render → gates → publish. It produces good *slides* but under-delivers *demonstrations*: demo scenes render as labeled text rows ("Web Search: ON") instead of simulated UI a learner can follow — exactly the defect class a countdown-exercise failure and the student feedback both point at. This plan (a) inserts a **Scene Development stage** that specifies words AND visuals per beat with a choreography contract, (b) upgrades the demo-scene component layer to real simulated UI (browser frames, element-ID-targeted cursors, zoom/cue beats) by re-skinning proven open-source Remotion components rather than building from scratch, (c) adds an **animatic gate** — a cheap low-res timed pass that catches pacing/fidelity problems for ~5% of the 2–3h render cost, and (d) formalizes the agent roster and retake loop around the stages professional studios actually use.

## 2. Current state (honest)

- **Works:** token-driven design system (`src/brand/tokens.ts` + parity tests) · 18 registered scene types · TTS + word-aligned captions · A·B·C·L·T gate wall · corpus ledger discipline · publish flow. 7/7 lessons gate-green.
- **Falls short:**
  - `screen-flow` FullPanel renders `label + text` rows — demos *describe* actions ("Cursor glides to Projects tab") instead of *showing* them. Gate C keeps catching this class (several demo scenes, one countdown scene).
  - No stage between "storyboard-ish lesson.json" and "full 2–3h render" — pacing/fidelity defects are discovered at the most expensive possible moment.
  - Retakes are uncategorized: "render bug", "taste call", and "agent misread the brief" all funnel through the same fix-and-regate loop.
  - No named owner for evolving the component/token system itself (every improvement happens ad hoc inside a lesson fix).

## 3. Design principles (carried over + new)

1. **Script-lock ordering** (universal in studio practice): narration script locks before storyboard; storyboard locks before animatic; animatic locks before full render. Never board against an unlocked script.
2. **Show, don't tell — as a contract, not a taste note:** a demo beat is valid only if it renders the *action* (cursor moves, click lands, UI responds). Stage directions in `uiState` prose are a lint error at the storyboard gate, not a watch-gate surprise 2 hours later.
3. **Tokens/systems over one-offs** (existing law, now with a named maintainer stage). Validated externally: Stripe/Anthropic motion job postings describe motion as systems + timing tokens + documented frameworks.
4. **Proof, not assertion** (existing law): every stage gate emits an artifact from a runner; certifier ≠ claimant; cross-family (Codex) review at the taste gates.
5. **Mayer principles as checkable rules** at the script/storyboard stages: signaling, segmenting, contiguity, modality, redundancy, coherence (P1-B §2).

## 4. The pipeline — stages, owners (agents), artifacts, gates

Adapted from the canonical studio pipeline (P1-B) + ADDIE's evaluation phase; roles researched, not assumed:

| # | Stage | Agent (function, not persona) | Input → Output artifact | Gate (go/no-go) |
|---|-------|-------------------------------|-------------------------|-----------------|
| 1 | Research & fact-verification | accuracy-sweep agent (exists: accuracy-sweep) | outline scope → source-cited claim set | every claim official-source-cited (Gate A) |
| 2 | Script / lesson plan | lesson-plan agent (exists: lesson-plan) | claims + outline + taste inputs → locked lesson-plan + narration script | learner-journey plan + Mayer checklist (segmenting, coherence, modality) + **script LOCK** |
| 3 | **Scene Development** (NEW — the load-bearing addition, §5) | scene-director agent | locked script → beat-ID'd storyboard: per beat = narration line + visual spec + choreography | storyboard lint: no stage-direction prose; every demo beat has element-IDs + cursor path; Mayer signaling/contiguity checks; **storyboard LOCK** |
| 4 | Styleframe / token compliance | styleframe agent (mechanizable) | storyboard → 1–3 rendered stills per new/changed scene type | deterministic diff vs tokens.ts (extends test/parity.test.ts); Instructor sees stills, not renders |
| 5 | **Animatic** (NEW — biggest cost lever) | animatic agent | storyboard + scratch TTS → low-res (e.g. 480p/15fps) timed rough cut, minutes not hours | pacing gate: duration in band, no dead air, beat dwell sanity; cheap re-runs until locked; **animatic LOCK** |
| 6 | VO / TTS + align | tts agent (exists: tts:lesson, align:lesson) | locked script → per-scene WAVs + word alignment | audio-authoritative timing check (Gate T inputs) |
| 7 | Full render | render agent (exists: render-lesson) | locked animatic + assets → 1080p MP4 | render completes; owns the machine (existing law) |
| 8 | Multi-gate QA | gate runners (exist: A·B·C·L·T + motion/media) | MP4 → gate artifacts **emitted by runners, git-tracked, freshness-stamped** (fixes #86) | all green |
| 9 | Independent adversarial review | cross-family reviewer (exists: Codex; verifiers refute-framed) | artifacts → PASS/BLOCK | BLOCK never overridden |
| 10 | **Categorized retake loop** (NEW) | retake-triage agent | gate/review defects → per-beat retake tickets tagged `technical` / `artistic` / `clarification` | technical → builder; artistic → human (Instructor/owner) or cross-family judgment; clarification → re-brief. Rolling %-in-retake metric |
| 11 | Publish + evaluation | publish agent (exists: publish:drive) + ADDIE-style evaluation | gate-green artifacts → Drive; learner/reviewer feedback → next-cycle inputs | N/N ledger; feedback file per lesson |
| — | **Systems maintenance** (NEW, continuous) | systems-maintainer agent (senior/Fable-tier, low frequency) | retake patterns + new needs → token/component/contract evolution PRs | parity tests + visual regression stills |

Stages 1, 2, 6, 7, 8, 9, 11 exist today. The plan's new work is stages 3, 5, 10, the systems-maintainer role, and the component layer under stage 3 (§6).

## 5. The Scene Development function (the "dedicated scene-development" ask)

**Contract:** input = locked narration script + lesson-plan; output = a storyboard the renderer can execute without interpretation. One entry per beat (stable beat IDs already exist — keep them):

```
beat:
  id: s4                      # stable, git-diffable
  narration: "You have a minute to try it before the reveal."
  visual:
    sceneType: screen-flow    # from the existing registry
    intent: demo | concept | emphasis | transition      # drives register (§6 vs simple composite)
    spec:                     # varies by sceneType; for demo scenes:
      frame: browser | device | terminal | none
      elements: [...]         # the fake UI, as data → rendered by JSX components (never raster)
      choreography:           # NEW — the demo DSL
        - {t: cue,   target: "#projects-tab"}          # element IDs, never pixel coords
        - {t: move,  to: "#projects-tab", ease: out-cubic}
        - {t: click, target: "#projects-tab", response: "panel-open"}
        - {t: zoom,  on: "#new-project-btn", hold: 1.2s}
        - {t: return}
      atoms: [{kind: countdown, phases: [60,30]}]      # interactive atoms class (timer, toggle, progress)
  mayer: {signaling: "#projects-tab", segment: 2/5}    # checkable annotations
```

- The **"full screen → cue → zoom → return"** screencast beat pattern (P1-B §2) becomes a named, reusable choreography macro — the default shape of every demo beat.
- **Concept scenes** stay simple and composable (the owner's "computer + marketing funnel + plus sign" case): a `composite` intent that places 2–3 code-drawn illustrations + a connector glyph with ambient motion. Not every demo needs a click-through; the scene-director chooses register per beat, and the storyboard gate checks the choice is explicit, not defaulted.
- **Storyboard lint (stage-3 gate, automatable):** rejects stage-direction prose in `uiState`-style fields; requires element-IDs for every cue/click; requires a Mayer signaling target per demo beat. This turns the entire defect class into a pre-render failure.

## 6. Demo-scene component layer (screen-flow v2) — adopt, don't reinvent

From P1-A (verified live):
1. **Cursor choreography = `@remotion/paths` + element-ID targeting** (`getPointAtLength`/`getTangentAtLength` along an SVG path resolved from element positions at render time). Kills "cursor missed the button" structurally. Adopt noamdorr's click-positioning playbook (hotspot-offset + scale-ratio) as written procedure.
2. **Copy-in skeletons, re-skinned to tokens:** Remocn (1,071★, active, shadcn-style registry — browser-flow, terminal, app chrome) and Onda (Interface category: browser-frame, device-frame, cursor, code-block; single overdamped motion vocabulary). Copy the `.tsx` in, re-skin per "match values, don't re-derive". Do NOT take RemotionUI as a dependency until its license/repo is verified.
3. **`@remotion/transitions` TransitionSeries** replaces ad hoc scene chaining where transitions are wanted.
4. **Interactive atoms class:** countdown/timer (a countdown exercise is the first instance — being built now under #83), toggles, progress bars, typing (official typewriter template) — frame-driven, token-styled, registered like scene types.
5. **Icons/overlays:** Lucide/Phosphor for standard glyphs; `@remotion/lottie` default + `@remotion/rive` only for stateful icons; `@remotion/paths` draw-on for simple marks.

## 7. Asset strategy (from P1-C — the decision rule)

1. **Default: code-drawn SVG/JSX** for UI mockups, device frames, icons, diagrams — animatable, token-locked by construction, git-diffable, free. (An image model for a UI mockup would be a *regression* — static, off-token, unreviewable.)
2. **Fallback raster model: Gemini 2.5 Flash Image ("Nano Banana"), ~$0.039/image** — only for painterly/organic spot art uneconomical to code. Recolor-to-palette in post; never prompt-re-roll for hex exactness (no model hex-locks).
3. **Escalations:** Recraft (~$0.08) when true SVG output is needed for something too complex to hand-code · Ideogram only for baked-in text (rare — JSX text is better) · a **house-style LoRA on FLUX-schnell/klein-4B (Apache 2.0 only!) via fal.ai/Replicate (~$0.025/image)** if volume passes ~100 illustration assets/month.
4. **Ruled out:** Google Stitch (no API, Material register, wrong output type) · Midjourney (no first-party API) · FLUX dev variants (non-commercial license trap) · local GPU inference on this laptop (under-provisioned).

## 8. Quality machinery additions

- **Animatic gate (stage 5):** low-res/low-fps render of the storyboard with scratch TTS. Target: minutes per lesson. Catches pacing, dead air, dwell problems, and demo-register mistakes before the 2–3h render. Highest-leverage single addition in this plan given render economics.
- **Retake taxonomy (stage 10):** every gate/review defect tagged `technical` (execution bug → builder agent) / `artistic` (taste → Instructor or cross-family judgment) / `clarification` (brief misread → re-brief the stage agent). Track rolling %-in-retake per lesson as the cost-blow-out early-warning metric. (Studio-standard practice per CGWire; currently everything funnels undifferentiated.)
- **Gate provenance (existing issue #86):** gate artifacts emitted by runners only, git-tracked, stamped with the MP4 hash/mtime they judged; gate:status flags stale artifacts. (The sweep found one watch-gate.md pasted from a chat message.)
- **Systems maintenance:** a named, recurring role. Inputs: retake patterns, component wishlist, token drift. Output: contract/component PRs with parity + visual-regression stills. This is the role Stripe/Anthropic postings describe and the repo currently lacks.

## 9. Honest limitations (so the owner can plan)

- **Claude Code cannot natively paint raster images.** It draws SVG/JSX (well) and orchestrates image APIs. The stylized-cartoon register is fully achievable in code; painterly texture requires an image model (§7).
- **Pacing "feel" cannot be fully automated.** gate:motion catches "slideshow", the animatic gate catches structural pacing — neither catches "technically alive but boring". That stays a human/cross-family taste gate (P1-B: the 3 hardest-to-automate stages are narrative judgment, artistic retakes, pacing feel — every professional pipeline keeps humans there too).
- **Render economics don't change:** 2–3h/lesson locally, machine-owning. The animatic gate reduces *wasted* renders; it doesn't speed real ones. `@remotion/lambda` (~$0.02/render-minute-scale, 15–19s for a nontrivial comp in Remotion's own example) is the documented escape hatch if wall-clock becomes the binding constraint — an infra decision, priced but not planned here.
- **Remotion licensing action item:** the free tier has company-size limits. Confirm eligibility before scaling; budget $100/mo (Automators, 10k renders) if over. MIT fallback exists (Revideo) but means leaving React/JSX — a substantial rewrite, noted not recommended.
- **Consistency of image-model output drifts** across generations (P1-C); code-drawn assets are the only zero-drift path, which is why they're the default.

## 10. Phased adoption roadmap (each phase = a vertical slice ending gate-green)

- **V1 — Prove the register (1 lesson):** copy in + re-skin browser-frame/cursor components; implement choreography DSL for `screen-flow` only; scene-director agent rewrites ONE existing demo-heavy lesson's storyboard (candidate: a demo-heavy lesson that needs re-gating anyway); storyboard lint v0; re-render, gate, Instructor review. *Exit: a demo scene a student can follow click-by-click, gate-green.*
- **V2 — Stop paying for late discovery:** animatic gate + scratch-TTS path; retake taxonomy in gate reports; gate provenance (#86). *Exit: a storyboard change reaches a reviewable animatic in <15 min.*
- **V3 — Scale the register:** migrate remaining demo scenes corpus-wide (ledger-driven, N/N); interactive-atoms library grows from retake patterns; systems-maintainer cadence starts. *Exit: corpus ledger green with new-register demos; student-feedback re-test.*
- **V4 — Only if volume demands:** Nano Banana integration for spot art; LoRA house style; Lambda evaluation. Each gated on a real, measured need from V1–V3.

**Cost picture:** V1–V3 ≈ $0 in new tooling (all OSS/copy-in + existing stack). Possible Remotion license $100/mo pending headcount. Image models only enter at V4 (~$0.04/image incidental).

## 11. Open questions for Instructor / owners

1. Style canon: is there an Instructor-approved reference set (existing lesson stills? sizzle frames?) to serve as the visual bar for demo scenes — and later as LoRA/reference-image seed if V4 happens?
2. How many lessons genuinely need illustration-texture assets (vs JSX-simulated UI)? Determines whether an image model ever becomes a line item.
3. Remotion license eligibility check.
4. Who holds the `artistic` retake queue — Instructor solo, or Instructor + cross-family model triage first?
5. Should V1's pilot lesson be the demo-heavy lesson that needs a re-render anyway (two birds) or a lower-stakes one?
