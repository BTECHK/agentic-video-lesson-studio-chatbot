# Google & Perplexity — Vendor-Official Research

> AI-tool comparison dataset. **Vendor-official sources only** (Google official domains for Gemini; perplexity.ai official pages/blog for Perplexity & Comet). No third-party capability claims.
> Captured: **May 2026**. Facts reflect 2026 product state, not older training data.
> Note: "Comet" here = **Perplexity's AI browser**, NOT Comet.ml (the ML-ops tool).

---

## 1. Gemini (Google)

Google's Gemini family. As of May 2026 the latest generation is **Gemini 3.x** (the 3.5/3.1 line) — *not* 2.5. The current generally available (GA) flagship is **Gemini 3.5 Flash**, with **Gemini 3.1 Pro** as the top reasoning/Pro tier and **Gemini 3.5 Pro** announced as coming soon. The consumer-facing Gemini app surfaces Gemini 3 to free users.

### Facts table

| Fact | Detail | Source |
|------|--------|--------|
| Current models (May 2026) | Gemini 3.5 Flash (GA flagship), Gemini 3.1 Pro, Gemini 3.1 Deep Think, Gemini 3.1 Flash-Lite; Gemini 3.5 Pro "coming soon" | https://deepmind.google/models/gemini/ |
| Latest GA model | Gemini 3.5 Flash — "Most intelligent model for sustained frontier performance on agentic and coding tasks" | https://ai.google.dev/gemini-api/docs/models |
| Context window | Up to **1M input tokens**; **64K output tokens** (Gemini 3.5 Flash). Gemini 3 generation = 1M-token context window | https://deepmind.google/models/model-cards/gemini-3-5-flash/ ; https://blog.google/products/gemini/gemini-3/ |
| Modalities | Text, images, audio, video files in; multimodal understanding across text/images/video/audio/code | https://deepmind.google/models/model-cards/gemini-3-5-flash/ ; https://blog.google/products/gemini/gemini-3/ |
| Tool use / agentic | "Gemini Agent" for multi-step workflows (e.g. inbox organization); operates a computer via terminal; integrates Gemini Computer Use for browser control | https://blog.google/products/gemini/gemini-3/ |
| Specialized models | Gemini Omni (video-first generation), Gemini Audio, Gemini Image ("Nano Banana"), Gemini Robotics, Gemini Embedding 2; Veo 3.1 (video), Lyria 3 (music), Computer Use Preview (UI automation) | https://deepmind.google/models/gemini/ ; https://ai.google.dev/gemini-api/docs/models |
| Image generation | Yes — Gemini Image ("Nano Banana") for generation/editing | https://deepmind.google/models/gemini/ |
| Web search / grounding | Yes — Gemini in Search "AI Mode" (Google AI Pro/Ultra) | https://blog.google/products/gemini/gemini-3/ |
| Voice | Yes — Gemini Audio (real-time audio); Gemini Live in the app | https://deepmind.google/models/gemini/ |
| Free vs paid | **Free**: Gemini 3 in the standard Gemini app. **Paid**: Google AI Pro & Ultra add Gemini 3 in Search AI Mode; Deep Think for Ultra | https://blog.google/products/gemini/gemini-3/ |
| Developer access | AI Studio, Vertex AI, Google Antigravity | https://blog.google/products/gemini/gemini-3/ |

### Vendor-published benchmark note
Google's official Gemini 3.5 Flash model card (results dated May 2026) publishes: SWE-Bench Pro (Public) 55.1%, MCP Atlas (agentic) 83.6%, MMMU-Pro (multimodal) 83.6%, ARC-AGI-2 72.1%. The Gemini 3 launch post cites 1501 Elo on LMArena, 37.5% on Humanity's Last Exam (no tools), 91.9% GPQA Diamond. (Source: deepmind.google model card; blog.google/products/gemini/gemini-3/.)

### Free-tier notes
- Gemini 3 is available **free** in the standard Gemini app; no purchase needed for the core model.
- Google has not published a region-specific exclusion in these sources; some advanced features (Deep Think, Search AI Mode) require paid Google AI Pro/Ultra. *(Region availability of paid tiers not confirmed in vendor sources reviewed — verify on gemini.google.com at signup.)*

---

## 2. Perplexity (perplexity.ai)

Perplexity is "the world's first answer engine" — it searches the web in real time and returns answers **with inline numbered citations**. Its in-house model family is **Sonar** (e.g. Sonar Pro, Sonar Reasoning Pro, Sonar Deep Research), and it also routes to frontier third-party models for Pro users.

### Facts table

| Fact | Detail | Source |
|------|--------|--------|
| Product type | Answer engine — real-time web search with cited sources on every answer | https://www.perplexity.ai/ ; https://www.perplexity.ai/hub/blog/getting-started-with-perplexity |
| In-house models | Sonar, Sonar Pro, Sonar Reasoning Pro, Sonar Deep Research (3 search modes: High/Medium/Low) | https://www.perplexity.ai/hub/blog/new-sonar-search-modes-outperform-openai-in-cost-and-performance |
| Citations | Yes — every answer has clickable numbered citations ([1],[2]); citation tokens no longer billed (except Deep Research) on API | https://www.perplexity.ai/hub/blog/getting-started-with-perplexity ; https://www.perplexity.ai/hub/blog/new-sonar-search-modes-outperform-openai-in-cost-and-performance |
| Web search / grounding | Yes — core feature, real-time | https://www.perplexity.ai/ |
| File upload | Yes — Pro adds **unlimited** file uploads (Free is limited) | https://www.perplexity.ai/pro |
| Voice | Yes — voice-to-text prompting (Pro) | https://www.perplexity.ai/pro |
| Deep Research | Autonomous multi-search reports (runs dozens of searches, reads hundreds of sources) | https://www.perplexity.ai/hub/blog/introducing-perplexity-deep-research |
| Spaces | Private/collaborative Spaces | https://www.perplexity.ai/hub/blog/more-value-in-every-answer-new-benefits-for-every-level-of-perplexity-user |
| Free tier | Free access with limited Pro Search/day; basic answers + citations | https://www.perplexity.ai/pro |
| Pro tier | **$20/month** or **$200/year** (~16% saving); ~300 Pro searches/day equivalent (up to 200 Pro queries/week of advanced reasoning), expanded model selection, unlimited file upload, voice | https://www.perplexity.ai/pro |
| Max tier | Highest tier — peak productivity + early access to newest products (price not stated in reviewed source) | https://www.perplexity.ai/hub/blog/introducing-perplexity-max |
| API (developer) | Sonar API; Sonar Pro $3 / 1M input tokens, $15 / 1M output tokens | https://docs.perplexity.ai/docs/getting-started/pricing ; https://www.perplexity.ai/api-platform |

### Vendor-published benchmark note
Perplexity's official Sonar blog states improved Sonar models offer "industry-leading performance at lower costs" and claims Sonar search modes outperform OpenAI on cost and performance. No specific public ELO/Arena number is published by Perplexity for the consumer app in the sources reviewed; do not invent one. (Source: perplexity.ai/hub/blog/new-sonar-search-modes-outperform-openai-in-cost-and-performance.)

### Free-tier notes
- Free tier gives real-time web search with citations — strong for verifiable study answers at no cost.
- Pro is $20/mo (or $200/yr); Pro perks/discounts exist (e.g. student/partner promos via perplexity.ai/properks). No region-specific block found in vendor sources reviewed.

---

## 3. Comet (Perplexity's AI Browser)

Comet is **Perplexity's AI web browser** with a built-in agentic assistant. *(Not Comet.ml.)* It runs an in-browser AI assistant that can read/understand the current page and tabs, and a **Comet Agent** that takes actions on your behalf (clicking, filling forms, navigating). Released **free to everyone worldwide**.

### Facts table

| Fact | Detail | Source |
|------|--------|--------|
| What it is | AI browser with a personal AI assistant; "browse at the speed of thought" | https://www.perplexity.ai/hub/blog/introducing-comet ; https://www.perplexity.ai/comet |
| Availability | **Free**, available to everyone worldwide | https://www.perplexity.ai/hub/blog/comet-is-now-available-to-everyone-worldwide ; https://www.perplexity.ai/download-comet |
| Platforms | macOS (Apple Silicon M1/M2), Windows 10/11, Android 12+; iOS "coming soon" | https://www.perplexity.ai/hub/blog/comet-for-android-is-here ; https://www.perplexity.ai/download-comet |
| Comet Assistant | Sidebar AI helper: page/content analysis, tab awareness, research support, conversational Q&A (passive assistance) | https://www.perplexity.ai/comet/resources/articles/comet-assistant-vs-agent |
| Comet Agent (agentic browsing) | Actively performs tasks: web automation — clicks buttons, fills forms, navigates sites autonomously; handles inbox, ordering groceries, finances, vacation planning | https://www.perplexity.ai/comet/resources/articles/comet-assistant-vs-agent ; https://www.perplexity.ai/hub/blog/the-new-comet-assistant |
| Transparency/control | Shows what it's doing step-by-step (where it clicks/scrolls), asks before sensitive actions, stop/guide buttons | https://www.perplexity.ai/hub/blog/comet-assistant-puts-you-in-control |
| Safety | BrowseSafe framework for safer AI browsing | https://www.perplexity.ai/hub/blog/building-safer-ai-browsers-with-browsesafe |
| Ad blocker (Android) | Built-in native ad blocker | https://www.perplexity.ai/hub/blog/comet-for-android-is-here |
| Student offer | Discounted Perplexity Pro bundle for students | https://www.perplexity.ai/grow/comet/students |

### Free-tier notes
- Comet is **free and worldwide** — no region gate stated in vendor sources. Android 12+ is supported and there is a native ad blocker. Agentic actions can be watched/stopped.

---

### Source domains used (all vendor-official)
- **Gemini:** blog.google, deepmind.google, ai.google.dev, gemini.google.com
- **Perplexity & Comet:** perplexity.ai (incl. /hub/blog, /comet, /pro, docs.perplexity.ai)

### Open items to re-verify at signup
- Exact Perplexity Max price (not stated in reviewed vendor pages).
- Region availability of Google AI Pro/Ultra paid tiers.
- Gemini 3.5 Flash knowledge cutoff (not listed on the model card reviewed).
