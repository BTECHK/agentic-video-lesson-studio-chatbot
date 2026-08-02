# P1-A Research: Remotion Ecosystem & Prior Art
*(subagent report, 2026-08-01/02 — appendix input for .planning/VISUAL-PIPELINE-PLAN.md; star counts pulled live via GitHub API, not blog claims)*

## 1. Official Remotion packages

Remotion core: 55,181 stars, same-day pushes. Renders each frame as a headless-browser screenshot — slower than Canvas tools but renders anything a browser can, which is why it's the right substrate for stylized UI-mockup animation.

| Package | Does | UI-mockup/cursor relevance |
|---|---|---|
| @remotion/lottie | AE/LottieFiles JSON import | Yes — icon/cartoon overlays |
| @remotion/rive | Rive state-machine animations (faster/smaller than Lottie) | Yes — stateful icons |
| @remotion/shapes | Dependency-free geometric primitives | Moderate (cursor dots/badges) |
| @remotion/transitions | TransitionSeries + presets (fade/slide/wipe/flip/clockWipe/iris/custom) | Yes — standard scene chaining |
| @remotion/layout-utils | Text-measurement/layout (docs thin — verify exports via npm view/node_modules) | Text-fit + hit-zone math |
| @remotion/animation-utils | CSS-style animation helpers (docs thin — same caveat) | — |
| @remotion/paths | SVG path math: getLength, cutPath, getPointAtLength, getTangentAtLength | **HIGH — the cursor-choreography primitive** |
| @remotion/motion-blur | Motion blur/trail HOCs | Nice-to-have for fast cursor moves |
| @remotion/recorder | Official template for screen-recording-style tutorial videos | Structural reference only |

Docs: remotion.dev/docs/resources · /third-party · /api

### Licensing (verified: LICENSE.md + remotion.pro/license)
- **Free:** individuals, companies ≤3 employees, nonprofits (unlimited commercial videos, Studio, local render, self-hosted Lambda).
- **Never allowed:** selling/relicensing a derivative of Remotion itself (selling videos is fine).
- **Paid (2026):** Creators $25/seat/mo (3-seat min $75) · Automators $0.01/render, $100/mo min (10k renders) · Enterprise from $500/mo.
- **ACTION ITEM: confirm org headcount (team + contractors) vs the 3-employee threshold before scaling commercial output.**

## 2. GitHub prior art — cursor/click choreography & screen simulation

| Repo | Stars | Push | Takeaway |
|---|---|---|---|
| Onda (degueba/onda) | 8 | 2026-08-01 | **Best structural match.** MIT, CLI add. 70 components; Interface group: browser-frame, device-frame, cursor, terminal, code-block, code-diff. 18 TransitionSeries presets. Single motion vocabulary ("heavily overdamped springs, no overshoot") = same taste-consistency instinct as our tokens. New/unproven (8 stars) but copy-paste inspectable, not a dep risk. |
| Remocn (Remocn/remocn) | 1,071 | 2026-08-01 | Most-starred. shadcn-style registry, 64+ components incl. "browser flow", terminal simulator, real-app-chrome primitives (Dialog/Tabs/Command/Toast). **Best signal-to-risk ratio.** |
| RemotionUI (remotionui.com) | repo 404s | — | 109 components incl. Simulated Cursor, Cursor Path, Device Mockup Zoom, Browser Flow, Callout Spotlight, Chat-to-Preview. Paid tiers ($29/$99). **License/repo unverified — reference only until confirmed.** |
| noamdorr/saas-product-demo-video | 41 | 2026-06-16 | MIT Claude Code skill. **Click-positioning playbook** (hotspot-offset + scale-ratio transforms — fixes "cursor missed the button", the genre's #1 churn) + schematic UI templates for products with no real UI (≈ our no-screen-recording constraint). |
| codeverbojan/remotion-cinematic | 7 | 2026-04-25 | 509 tests. **Geometry-aware cursor targeting real elements by ID** (not hardcoded coords) + waypoint choreography with arc/linear/ease + visual SVG path editor + scene-relative camera keyframes + AutoZoom. The element-ID-targeting pattern is the single most reusable idea. |
| ytrofr/claude-remotion-editor | 25 | 2026-05-19 | Visual hand-path editor ("SceneDirector"), 92+ Lottie assets, physics hand cursor, phone mockups — authoring-UX reference. |
| av/remotion-bits | 433 | 2026-03-11 | General blocks (charts, text reveals) — useful, not mockup-specific. |
| stefanwittwer/remotion-animated | 220 | 2025-02 (stale) | Generic declarative wrapper; deprioritize. |
| marcusstenbeck/remotion-transition-series | 85 | 2023 (stale) | Superseded by official @remotion/transitions — skip. |

### Adjacent (comparison, not adoption)
- **Motion Canvas** — 18,876★, MIT, generator/yield syntax, Canvas2D (faster, more limited). Best for hand-crafted explainer animation.
- **Revideo** — 3,948★, **MIT confirmed**, Motion Canvas fork with server-side render API. **The credible MIT fallback if Remotion licensing becomes a constraint — but a substantial rewrite (leaves React/JSX).**
- **Theatre.js** — 12,569★ but last push 2024-08 — stalled; it's a keyframe editor, not a video pipeline. Skip.
- **Manim** — wrong stack (Python) and register (math diagrams). Skip.

## 3. Reusable building blocks

- Fake browser/OS chrome: react-browser-frame, shadcn.io Safari, react-mockup, react-device-mockup / react-device-frameset — but **prefer Onda/Remocn frames built for frame-based rendering** (generic React libs assume CSS-transition timing, not useCurrentFrame interpolation).
- Cursor: no dominant library exists — every serious repo built its own. **Converged pattern: cursor position driven by @remotion/paths (getPointAtLength/getTangentAtLength) along an SVG path, targeting element IDs, with a written hotspot/scale-offset correction procedure** (noamdorr's playbook is the explicit writeup).
- Typing: official remotion-dev/typewriter template (frame-accurate) over generic React typewriter libs.
- Icons/overlays: Lottie (default, one-shot/looping, ~2-10KB vector) · Rive (only for stateful icons reacting to scene props — state machines map to props-driven composition) · @remotion/paths draw-on for simple icons (avoids a second asset pipeline).

## 4. Remotion's own guidance

- `<Series>/<Series.Sequence>` (durationInFrames, negative offset for overlap, freeze/trimBefore/premountFor) — the documented pattern for data-array → scene-list. Our existing scene-array approach is the sanctioned shape.
- `<TransitionSeries>` on top when a real transition (not hard cut) is wanted.
- Data-driven video via input props = the mechanism we already use (JSON lesson scripts → MP4).
- Scaling: renderMedia local (today, Docker) vs @remotion/lambda distributed — cost example from official docs: nontrivial composition ~15–19s for ~$0.017–0.021/render (excl. S3 + license). A legitimate lever against the 2–3h local render bottleneck, but an infra decision, not casual.

## Free/OSS vs Paid

| Item | License | Cost |
|---|---|---|
| Remotion core + @remotion/* | Custom | Free ≤3 employees; else $25/seat, or $0.01/render ($100/mo min), or $500+/mo |
| Onda / Remocn / noamdorr skill / remotion-cinematic / Motion Canvas / Revideo | MIT/open | Free |
| RemotionUI | UNVERIFIED | Free starter; $29/$99 paid |
| LottieFiles/Rive editors | Freemium | Free tier sufficient for icons |

## Top 5 adopt
1. **@remotion/paths + element-ID-targeted cursor choreography** (+ documented hotspot/scale-offset correction) — kills "cursor missed the button" structurally.
2. **Onda/Remocn browser-frame/device-frame/browser-flow/cursor as copy-in skeletons** re-skinned to brand tokens ("match values, don't re-derive") — Remocn safer for breadth; Onda's Interface category most precisely scoped.
3. **@remotion/transitions TransitionSeries** as the standard scene-chaining primitive.
4. **noamdorr's click-positioning playbook + schematic-UI-template approach** as written procedure (not code).
5. **@remotion/lottie default + @remotion/rive for stateful icons** two-tier overlay pipeline.

## Top 3 avoid
1. RemotionUI as a hard dependency until license/repo verified.
2. Building a second component library from scratch — re-skin existing primitives instead (remotion-cinematic ships 509 tests around the path math you'd be re-deriving).
3. Theatre.js / Manim as architecture inspiration (stalled / wrong stack).

## Open questions
- Org headcount vs Remotion 3-employee free tier — resolve before scaling.
- RemotionUI real license/repo.
- Exact exports of @remotion/layout-utils & animation-utils (verify in node_modules).
- Build-vs-buy on cursor-path authoring UX (visual editor concept vs waypoints in JSON lesson scripts).
