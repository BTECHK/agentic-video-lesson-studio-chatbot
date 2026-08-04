# P1-B Research: How Professional Animation / Motion-Design / Edu-Video Pipelines Work
*(verbatim subagent report, 2026-08-01 — appendix input for .planning/VISUAL-PIPELINE-PLAN.md)*

## 1. The Canonical Motion-Design Production Pipeline

Every source converges on the same backbone — differences are in how finely stages split, not sequence. Most-cited compact version (Boords) is the **7-step model**:

| # | Stage | Owner | Artifact | Go/No-Go Gate |
|---|-------|-------|----------|----------------|
| 1 | Kick-off | Client/Agency + Studio | Signed-off script + VO recording | Script & narrative locked |
| 2 | Design | Art Director | Style frames (color, texture, graphic treatment) | Client "happy with the look" |
| 3 | Storyboard | Storyboard Artist/Director | Storyboard doc (panel + VO line + timing per frame) | Visual narrative approved |
| 4 | Animatic | Editor | Timed rough-cut MP4 with scratch VO/timing | Pacing/timing signed off |
| 5 | Production (animation) | Animators | Rendered shot sequences | WIP checkpoints hit |
| 6 | Feedback & sign-off | Client/Director | Approved WIP versions | Per-round approval |
| 7 | Render & final delivery | Studio | Final ProRes/master file | Final QC pass |

Source: boords.com/blog/the-seven-steps-of-animation-production

Studio-scale pipelines split into four macro-phases (medium.com/cgwire — Stages of an Animation Production):
- **Development** — bible/synopsis, budget, schedule. Gate: core designs agreed BEFORE pre-production (late redesign = #1 cost blow-out).
- **Pre-production** — script approval → breakdown → storyboard → animatic → asset/design-pack validation. Gate: nothing enters production without an approved design pack.
- **Production** — layout → background → animation → compositing; per-shot iterative takes/retakes; Director holds approval authority.
- **Post-production** — first edit → retakes → final edit → sound → mix → master → broadcaster QC.

Also consistent (meshy.ai, lucidlink.com, artofstyleframe.com): concept → storyboard → **styleframes** (few fully-polished reference frames to align stakeholders before committing) → assets → animation → render → composite.

**Key principle repeated everywhere:** script locked BEFORE storyboard; storyboard locked BEFORE animatic; animatic locked BEFORE full animation. Boarding against an unlocked script means redrawing on every sentence change.

## 2. Educational/Explainer Adaptations

### Kurzgesagt (closest documented analogue)
1. Research (weeks–years) → 2. Scriptwriting (the bottleneck; ~a dozen drafts + expert review) → 3. Storyboarding & illustration (~200 unique illustrations per 10-min video; 2–3 illustrators, 8–12 wks) → 4. Narration (single narrator, multiple takes) → 5. Animation (AE + C4D, 2–3 animators, 8–10 wks) → 6. Sound design/scoring (AFTER animation locked) → 7. Final polish. **1,200+ hours per 10-minute video.** Strictly script-first.
Sources: 10.studio (Kurzgesagt breakdown), kurzgesagt.org/what-we-do

### Corporate explainer shops (YumYumVideos 8-step)
Research/kick-off → Script (~140 wpm VO) → Storyboard → **VO recording** → Style frames & moodboard → Illustrations → Animation → Music/SFX (VO must stay "crystal clear"). Note: VO recorded BEFORE full visual lock — commercial explainer work times visuals to a fixed VO track (deliberate variance from Kurzgesagt ordering). Source: yumyumvideos.com/blog/explainer-video-production-process

### Instructional design (ADDIE)
Analysis → Design (script/storyboard) → Development (production, most time-consuming) → Implementation → **Evaluation** (did learners learn? — the phase studio pipelines lack; worth stealing). Sources: devlinpeck.com, whatfix.com
E-learning adds roles studios lack: **Instructional Designer** (learning objectives, distinct from creative director), **Subject Matter Expert** (accuracy sign-off — analogous to accuracy-sweep), **Editor** (clarity, not story craft). Source: bluecarrot.io

### Mayer's Multimedia Learning Principles (the science layer)
12 principles from cognitive load theory — the checkable spec for scene construction: **coherence** (cut extraneous), **signaling** (highlight what matters), **redundancy** (don't caption narration verbatim), **spatial/temporal contiguity** (text next to its graphic; narrate in sync), **segmenting** (learner-paced chunks), **pre-training** (introduce terms first), **modality** (spoken narration over on-screen text for complex visuals). Load-bearing for a script/storyboard agent. Sources: digitallearninginstitute.com, educationaltechnology.net

### Screencast/software-walkthrough conventions
- **"Full screen → cue → zoom → return"**: whole UI 1–2s, point with cursor/annotation, zoom into action, return wide before next step.
- Emphasis by intent: **zoom** = small details · **captions** = instruction · **cursor movement** = direction · **callouts/arrows** = spatial orientation (callout beats zoom when location-within-whole matters).
- Record high-res; enlarge app/browser before capture so zooms stay clean.
Sources: capcut.com (zoom effects guide), advids.co, sabbour.me (FollowCursor)
**Mapping note:** this is the named beat structure to encode into the demo-scene generator (currently implicit in screen-flow/ChatDemo).

## 3. Anthropic / Vercel / Linear / Stripe — honest finding

**None publish a video-pipeline process doc.** Public evidence is job postings (team structure, not process):
- **Anthropic**: in-house Creative Studio; Motion Designer (Core Brand) role builds/documents **reusable motion frameworks & standards**; separate **Video Director, Product Launches** owns launch videos end-to-end. (jobs boards: Accel/Lionheart/tealhq)
- **Vercel**: Design Engineering practice (animation implemented via code prototyping); Motion Designer, Brand covers launches/campaigns/UI demos. AI Gateway ships Motion Control video-gen (signal, not process doc).
- **Stripe**: motion designers own a **motion design system** — principles, timing tokens, reusable motion components. Clearest evidence of design-system-ized motion. (stripe.com careers)
- **Linear**: nothing public surfaced.
**Signal:** all frame motion as **systems + tokens + documented frameworks** — validates the repo's tokens.ts / "match values, don't re-derive" discipline.

## 4. Storyboard/Animatic Artifacts + Retake Structure

Artifact chain: beat sheet → storyboard (panel + shot description + VO line + timing, stable per-shot rows) → animatic (timed rough cut, scratch VO) → revision notes → locked animatic → production. Sources: mstudio.ai, saturation.io, linearity.io

Retake/review mechanics (CGWire, Autodesk Flow Production Tracking):
- Stable **shot IDs**; frame-accurate comments pinned to timecodes (targeted fixes, not full re-renders).
- Retakes **categorized**: *technical* (execution errors) / *artistic* (creative-direction changes) / *clarification* (note misunderstood) — tracked separately to see true cost drivers.
- Feedback requires **draw-overs/visual references** — plain-text notes cause repeat retake cycles.
- Track **% shots in retake** and retake round number — leading cost-blow-out indicator.
**Mapping note:** repo's Gate A/B/C/L/T per-lesson review files ≈ per-shot review artifacts. Missing pieces: retake categorization + rolling %-in-retake metric (currently all failures funnel through one fix-and-regate loop).

## 5. Agent-Pipeline Decompositions (3 candidates)

### A — Faithful studio port (finest-grained)
Research/fact-gather (→ verified claim set; automatable, ≈ accuracy-sweep) → Script/lesson-plan (mostly automatable; taste spot-review) → Storyboard (beat-ID'd shot list, sceneType-tagged; mechanizable) → Styleframes (deterministic vs tokens) → **Animatic** (low-res timed pass, scratch TTS; extend verify:render to timing) → VO/TTS → Full render (compute-bound) → Sound → **Review/retake** (categorized notes per beat ID; artistic category needs human/independent-model taste) → Delivery (≈ publish:drive).

### B — Collapsed by decision-type
1. Scope & truth (mechanizable) · 2. Narrative & pedagogy (Mayer-checkable rules + taste judgment) · 3. Visual system compliance (mechanizable if tokens are single source of truth) · 4. Motion/animation execution (compute-bound) · 5. **Independent verification** (gates + adversarial second-model review — the honest human-review equivalent; keep a differently-biased model in the loop).

### C — Pipeline-as-design-system (what Stripe/Anthropic postings actually describe)
(1) Token layer (tokens.ts) · (2) Component layer (scene primitives) · (3) Composition layer (agent assembles scenes per lesson) · (4) QA layer (gates) · (5) **Systems maintenance** (evolving tokens/components over time — the most under-modeled role in the current setup).

### Recommended stage list (synthesis)
1. Research & fact-verification → 2. Lesson plan/script (Mayer-checked) → 3. Storyboard (beat IDs, sceneTypes) → 4. Styleframe/token compliance → 5. **Animatic** (timed rough cut, pacing gate) → 6. Full render → 7. Multi-gate QA (A·B·C·L·T) → 8. Independent adversarial review → 9. **Categorized retake loop** (technical/artistic/clarification per beat ID) → 10. Publish.

### 3 hardest stages to automate
1. **Script/narrative judgment** — Mayer gives checkable rules, not "is this engaging" (Kurzgesagt: a dozen drafts + human expert review).
2. **Artistic retakes/taste calls** — studios separate these from technical retakes precisely because they need director judgment; irreducibly human-in-the-loop even in professional pipelines.
3. **Cross-stage timing/pacing feel** — the animatic stage exists because pacing must be *felt* in playback; gate:motion thresholds catch "slideshow," not "boring but technically alive."

### Open questions
- **Animatic gap:** does the pipeline have any cheap low-res timed pass before full render? (Highest-leverage gap given 2–3h/lesson render cost.)
- Should gate reports **categorize retakes** (technical/artistic/clarification)?
- Is there a named **systems-maintainer** role/agent for evolving tokens.ts + shared scene components?
- Treat job-posting language (motion systems, timing tokens) as the real design signal — a public process writeup likely doesn't exist.
