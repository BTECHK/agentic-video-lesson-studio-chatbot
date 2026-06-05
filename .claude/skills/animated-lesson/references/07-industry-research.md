# 07 · Industry research

How professional animation studios and Big Tech actually produce lesson / explainer / feature videos at scale. Use this to understand *why* this skill is structured the way it is, and where to grow it next.

---

## The shift from After Effects to code

For 20+ years, the standard motion-graphics pipeline was Adobe After Effects (AE) for compositing and animation, fed by Photoshop/Illustrator assets, output to Premiere or Media Encoder for final delivery. AE is still the right tool for **one-off cinematic spots** — feature films, ad agency hero work, anything where a senior motion designer is hand-keying every frame.

But for **lesson videos, product explainers, and any content that needs to update when underlying data changes**, AE has fundamental problems that motivated the shift to code-driven pipelines:

- <cite index="3-27,3-28,3-29,3-30,3-31">You can't version control After Effects projects meaningfully. You can't automate Premiere Pro workflows without complex scripting. And hiring video editors to manually create thousands of variations isn't scalable or cost-effective. Existing solutions involve exporting data to motion graphics templates, manually updating parameters, or building custom rendering pipelines from scratch using tools like FFmpeg directly, which requires deep video encoding knowledge most people don't have.</cite>

This is exactly the problem Sample Academy faces: when a feature in Claude is deprecated or a price changes, a hand-keyed video has to be re-opened in AE, the affected frames manually re-keyed, and the whole composition re-rendered. Multiply across dozens of lessons and the maintenance burden becomes the entire reason content goes stale.

---

## The two dominant code-driven approaches

### Lottie + After Effects

**How it works:** designers build animations in AE, export to a JSON file (Lottie format) via the `Bodymovin` plugin, render at runtime in the browser using lottie-web. The JSON encodes keyframes; the player tweens between them.

**Strengths:** designers keep their AE workflow; output is tiny (single JSON file); easy to embed in product UIs.

**Weaknesses:** still requires AE for authoring; content updates need a designer to re-open the AE file; not great for data-driven content where the *number of elements* changes between renders.

**When to use:** product UI micro-animations, brand mascots, things that look hand-crafted. **Not the right fit for lesson videos** where content changes frequently.

### React-driven (Remotion)

**How it works:** the video is a React component. Each frame is rendered by React the same way a web page is. A renderer (headless Chromium under the hood) captures one PNG per frame and ffmpeg encodes them into MP4.

**This is what we're using.** Specifically:

- <cite index="3-3,3-4">A framework that enables developers to create videos programmatically using React components. Created by Jonny Burger, it transforms video production by bringing the React paradigm to video creation — write JSX and CSS, render MP4 files.</cite>
- <cite index="14-1,14-2">Remotion excels for automated social media video generation, data visualization and infographic videos, personalized video content at scale, motion graphics and animations, programmatic video editing, templated video production, and video generation from APIs and databases. Any scenario requiring repeatable, data-driven, or automated video creation benefits from Remotion's programmatic approach.</cite>

**Tradeoff today:** we're using a homegrown HTML+React+Babel implementation that runs in any browser, no build step. Faster to iterate, no Remotion license. When we outgrow it (≥5 lessons, batch rendering, CI), we migrate to Remotion proper. See `06-render-pipeline.md` for the migration map.

---

## What Big Tech actually does for product-feature videos

A few well-documented examples of code-driven video production at scale:

**Spotify Wrapped.** Spotify generates ~600 million personalized year-end review videos per year. Each user sees their own data woven into the animation. <cite index="3-27,3-28,3-29">Spotify Wrapped is a yearly review which is a nice animation of what your favorite music genres and playlists were, which musicians you had listened to, etc. Companies of that size have developed complicated proprietary solutions to create those custom videos at scale programmatically — Remotion was built to give the same capability to everyone.</cite>

**GitHub Unwrapped.** GitHub's analog of Wrapped is open source and built on Remotion — <cite index="2-6">"GitHub Unwrapped — Personalized Year in Review"</cite> is in the Remotion showcase.

**Shopify Thank-You Videos.** Per-merchant branded clips sent after each purchase. <cite index="10-13">Real things shipped with Remotion: GitHub Unwrapped (personalized yearly recap for every GitHub user), Shopify Thank-You Videos (merchant-branded clips sent after each purchase), NFT Drops (10,000 unique motion-graphics videos minted on-chain), Loom-style Product Tours (auto-generated walkthroughs from user analytics events).</cite>

**The pattern across all of these:** content is data, presentation is code, output is rendered on a server. **No designer touches a timeline.** A new variant is a JSON object, not a new AE project.

This is the world we're moving Sample Academy lesson production into.

---

## What sets the Anthropic-style aesthetic apart

The motion contract in `02-motion-contract.md` was derived from observing Anthropic's product demo videos (e.g. the "Claude Cowork" mobile-to-desktop tether sequence). A few things they do differently from typical SaaS explainer videos:

### Warm minimalist palette

Most SaaS animations use saturated blues/purples and dark mode. Anthropic uses cream backgrounds and terracotta accents — closer to editorial print than digital UI. The result reads as **calm and pedagogical** rather than salesy. We mirror this exactly: Soft Linen `#EDE8E3` background, Crimson `#8B2635` accent.

### The tether method

Most SaaS animations explain cross-screen actions via a hard cut + a label ("Now in your inbox…"). Anthropic uses a continuous visual element — a hand-drawn line — that physically connects the two screens. The user's eye follows the line; the brain doesn't have to re-orient. We replicate this with the `<Tether>` component (one per scene, max).

### Semantic micro-interactions

Most product videos use generic loading spinners. Anthropic replaces them with element-specific motions: a line drawing itself across a path, a dot scanning down a document, a pulse ring around a microphone. <cite index="13-7,13-8,13-9,13-10">Data videos represent data stories with visualizations and motion graphics. They provide an intuitive approach for data communication. A data video consists of a sequence of data-driven clips or visualization states that demonstrate a piece of the data story. Creating a compelling data video requires not only finding insightful data facts and crafting narratives that connect insights into a story, but also designing smooth transitions between insights that help convey the flow of narratives to the audience.</cite> The semantic micro-interaction is the connective tissue between clips.

### Sequential staging, not stagger-everything

Most product animations stagger every element by 100ms. Looks "polished" but communicates nothing. Anthropic uses the **four-beat sequence**: container in → action triggers → processing state → result resolves. We codified this in motion-contract rule 4.

---

## Where the field is moving

Two trends to watch:

### AI-assisted motion direction

<cite index="16-11,16-12,16-13,16-14,16-15,16-16,16-17">Motion design is entering an intelligent automation phase — where design software doesn't just execute commands but predicts, adapts, and creates. AI-driven tools such as Runway, Pixflow Motion Factory Suite, and Adobe Firefly have blurred the line between software and creative collaborator. These systems analyze a designer's workflow — understanding patterns in pacing, color selection, and composition — to make intelligent design suggestions. In practical terms, this means the end of repetitive, low-value tasks. Rotoscoping, object tracking, and background removal are now nearly instant.</cite>

For our pipeline: we're already AI-assisted on the *authoring* side (Claude Code writes the JSON; Claude Code can also draft the scene-component code when the catalog is extended). The next step is AI-assisted *iteration* — feeding rendered MP4s back to a Claude critic that flags pacing/contrast/legibility issues. Future skill: `motion-review`.

### Generative motion graphics

Tools like Runway and Sora can now generate motion graphics from text prompts. For brand-consistent lesson content this isn't useful yet — the prompts can't enforce a design system as strictly as our scene catalog does. But for **B-roll** (e.g. abstract textures behind a title card, or illustrative cutaways), generative tools may eventually replace placeholder striped boxes. Watch this space; don't build on it yet.

### Studios doing this commercially

<cite index="11-1,11-2,11-3">Algo is a data-visualization studio specializing in video automation. They run a platform that turns data into videos, at scale. Their services include data-driven videos, editorial projects, motion design, web experiences, AI-driven videos, data visualization, generative branding, motion toolkits, year-in-reviews, creative development, infographics, marketing automation, and personalised videos.</cite>

Studios like Algo are essentially "Remotion as a service" — they build the templates, the customer brings the data. For Sample Academy specifically, in-house is better than commissioning a studio: the content changes frequently, the brand is opinionated, and the team has technical skill. The skill package you're reading is the in-house equivalent of what Algo would charge for.

---

## Reading list

If you want to go deep:

- **Remotion fundamentals:** `https://www.remotion.dev/docs/the-fundamentals`
- **Jonny Burger interview** on the origin story and use cases: `https://www.decibel.vc/articles/remotion-create-videos-with-code-using-react`
- **Academic paper on data video transition design** (cinematography-inspired vocabulary for motion choices): `https://www.cbzheng.link/assets/pdf/transition.pdf`
- **DataClips paper** — early academic work on tools that compose data videos from clip templates: a structural ancestor of our scene catalog approach.

---

## TL;DR for our pipeline

- Author content as **JSON** (data).
- Render with **React components** (presentation).
- Iterate in **browser HTML** until approved (fast loop).
- Render to **MP4 via headless capture** when frozen (slow but reproducible).
- Migrate to **Remotion** when scale demands it (server-side rendering, CI, batch variants).
- **Never** hand-key a frame in After Effects. If you find yourself wanting to, the scene catalog is missing a type — extend it.
