# Research: v4 Animation Upgrade — Engagement, Motion, Remotion Tooling (2026-07-04)

Source: sonnet research agent (web-sourced; URLs inline). Feeds V4-animations + GOALS-spec.

## TOP 10 for v4 (ranked, impact-per-effort)
1. **@remotion/motion-blur** (`Trail`/`CameraMotionBlur`) on fast pans/entrances — biggest "cheap→sharp" fix. (remotion.dev/docs/motion-blur)
2. **Content-keyed pacing** — derive stagger/duration from VO cadence, not fixed frame counts.
3. **Pattern interrupt every 30–45s** (beat change, sting, cut-equivalent) — cuts mid-lesson drop-off. (artiphik.com first-10-seconds playbook; air.io retention editing)
4. **Chaptering + persistent progress signpost** (chapter card + progress dots) — cognitive-load win, cheap overlay component. (forasoft/coursensu; arXiv 1909.03041 sub-10-min chunking)
5. **@remotion/paths cursor-follows-path** in demo scenes — cursor personality. (remotion.dev/docs/resources)
6. **Staggered slightly-imperfect reveals** (small per-element random offsets) — premium/handcrafted read. (inkydesignworks 2026)
7. **One Apple-style spring preset (duration+bounce)** instead of ad-hoc spring() configs. (developer.apple.com HIG Motion; WWDC23 10158)
8. **@remotion/noise grain/organic jitter** on ambient layers — anti-AI-gloss texture, pairs with SceneAmbient. (genesismotiondesign 2026 trends)
9. **ElevenLabs Audio Tags + stability 50–60%, style 30–45%** — no SSML; `[pause]`/emotive tags sparingly (≤3s, don't stack). (elevenlabs.io best-practices)
10. **First-10s cold-open hook per lesson** — payoff first, branding deferred. (1of10.com hook guide)

## Other sourced findings
- Attention drops sharply past 10 min — chapter inside the file. (arXiv 1909.03041)
- Material 3: standard vs emphasized easing families; duration scales with travel distance (16 tokens). (m3.material.io/styles/motion) — exact ms/bezier tables need browser pull (JS-rendered).
- Motion must be purposeful — 2026 consensus rejects decorative parallax. (acodez.in; genesismotiondesign)
- Multi-speed parallax fg/bg for depth in hero moments. (4tech.ma 2026)
- Duolingo loop: close every segment with a reward/recap beat. (trophy.so; strivecloud.io)
- Kinetic typography as attention "speed bump" on keywords. (creativebloq) — Fireship/3B1B internal pacing rules: (unsourced).
- @remotion/lottie for designer-made micro-animations; remotion-transition-series for scene transitions.
- Animated cursor/character framing beats raw screen capture for step-by-step teaching (directional, thin sourcing).

## Gap flagged
Apple HIG + M3 motion token tables are JS-rendered — pull exact numeric tokens via browser if formalizing motion tokens.
