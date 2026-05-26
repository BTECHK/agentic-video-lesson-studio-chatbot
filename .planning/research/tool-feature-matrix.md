# AI Tool Feature / Functionality Matrix — 12 Tools

> **Purpose:** Market-research-level feature/functionality matrix feeding the Sample Academy Tool Repository + Comparison page. Goes beyond model specs into what each tool can actually DO.
> **Captured:** 2026-05-26 (facts reflect May 2026 product state, not older training data).
> **Sourcing rule:** Capability claims trace to **vendor-official docs** (compiled in `.planning/research/vendor-official/` — read those for full source URLs per fact). Comparative/benchmark signal cites **vetted third-party aggregators** (LMArena, Artificial Analysis) and reputable hands-on reviews, attributed inline. Conflicts between vendor claims and third-party tests are flagged in the final section. "Not found / unclear" is stated honestly rather than guessed.
> **Tools (grouped by vendor):** OpenAI — ChatGPT, Codex · Anthropic — Claude, Claude Code, Cowork · Google — Gemini · Perplexity — Perplexity, Comet · xAI — Grok · DeepSeek · Alibaba — Qwen · Manus.

Legend: ✓ = supported · ✗ = not supported / not advertised · ~ = partial / conditional / via add-on · ? = not found or unclear

---

## Lead Matrix — Tool × Functional Dimension

### Part A — Core capabilities

| Tool | Web search / grounding | File upload & analysis | Image generation | Voice (in/out) | Agents / autonomous tasks | Browser / computer use |
|---|---|---|---|---|---|---|
| **ChatGPT** (OpenAI) | ✓ incl. Free (Skills menu) | ✓ (stricter on Free) | ✓ ChatGPT Images 2.0 / DALL·E 3, all tiers | ✓ in/out, incl. Free | ✓ Deep Research + Codex as tool; computer use | ~ computer use as a tool (paid surfaces) |
| **Codex** (OpenAI) | ✓ (research tool) | ✓ (repo/files) | ✗ (coding agent) | ✗ | ✓ Goal mode (hours/days), worktrees, Automations | ✓ computer use in agentic flows |
| **Claude** (Anthropic) | ✓ incl. Free | ✓ incl. Free (file creation w/ code exec) | ✗ (no native image gen) | ? not advertised on web chat | ~ Research (Pro+); limited agentic in chat | ✗ (chat surface) |
| **Claude Code** (Anthropic) | ✓ | ✓ (reads/edits files) | ✗ | ✗ | ✓ primary agentic coding; subagents | ~ terminal/bash only |
| **Cowork** (Anthropic) | ✓ | ✓ local files (no upload) | ✗ | ✗ | ✓ multi-step knowledge work; scheduled tasks | ✓ "Dispatch" — opens apps, browser, sheets |
| **Gemini** (Google) | ✓ AI Mode (paid); grounding | ✓ text/image/audio/video in | ✓ Gemini Image ("Nano Banana") | ✓ Gemini Live / Gemini Audio | ✓ Gemini Agent (multi-step) | ✓ Gemini Computer Use (browser control) |
| **Perplexity** | ✓ core feature, cited, real-time | ✓ (Pro = unlimited) | ~ via models/Spaces; not core | ✓ voice-to-text (Pro) | ✓ Deep Research (autonomous multi-search) | ✗ (use Comet for browsing) |
| **Comet** (Perplexity) | ✓ (browser-native) | ~ via assistant on page | ? not advertised | ? | ✓ Comet Agent (clicks, forms, navigates) | ✓ agentic browsing (its whole point) |
| **Grok** (xAI) | ✓ Web + X live search | ✓ image input; file workflows | ✓ Grok Imagine (image + video) | ✓ voice on web/iOS/Android + Voice API | ✓ multi-agent reasoning; Agent Tools API | ~ via Agent Tools (code exec); no doc'd computer use |
| **DeepSeek** | ~ app webpage summarization; unreliable for time-sensitive (3rd-party) | ✓ docs, long-context | ✗ no native image gen | ~ voice **input** (button-to-text); no doc'd voice out | ~ agentic coding marketed; no consumer agent product | ✗ |
| **Qwen** (Alibaba) | ~ via Model Studio agent tooling | ✓ (multimodal: text+image+video) | ~ via dedicated Qwen image models | ~ Qwen-Omni audio in/out | ✓ strong agentic coding; visual GUI agent | ~ GUI agent (model capability, not a consumer app) |
| **Manus** | ✓ browser operation + research | ✓ docs/data, spreadsheets | ✓ image + music generation | ✗ not advertised | ✓ flagship: one-shot autonomous task completion | ✓ Browser Operator (incl. logged-in sessions) |

### Part B — Workspace, ecosystem & access

| Tool | Memory / personalization | Projects / workspaces | Connectors / integrations | Code execution | Canvas / artifacts | Custom assistants |
|---|---|---|---|---|---|---|
| **ChatGPT** | ~ Free = saved only; auto-memory paid | ✓ Projects | ✓ connectors / GPT actions | ✓ (data analysis) | ✓ Canvas | ✓ GPTs (use on Free; **create** = paid) |
| **Codex** | ~ via config/skills | ✓ cloud environments | ✓ MCP, CI/CD, Skills | ✓ core | ✗ | ~ Skills (reusable) |
| **Claude** | ✓ memory incl. Free | ~ Projects = Pro+ | ✓ Slack + Google Workspace incl. Free; MCP | ✓ file creation w/ code exec | ✓ Artifacts, all consumer tiers | ✗ (no GPT-store equivalent) |
| **Claude Code** | ~ via CLAUDE.md / config | ~ per-repo | ✓ MCP (Notion, Figma, DBs); plugins | ✓ core | ✗ | ✓ subagents, plugins, slash commands |
| **Cowork** | ✓ memory + Projects | ✓ Projects | ✓ Slack, Chrome, M365, MCP | ✓ (built on Claude Code) | ~ doc generation (Excel/PPT/docs) | ✓ subagents |
| **Gemini** | ✓ personalization | ✓ Gems / workspace | ✓ Google Workspace, AI Studio, Vertex | ✓ | ✓ Canvas | ✓ Gems |
| **Perplexity** | ~ personalization | ✓ Spaces | ✓ connectors (Pro) | ? not core | ✗ | ✗ |
| **Comet** | ~ browsing context | ~ tabs/sessions | ✓ (acts across logged-in sites) | ✗ | ✗ | ✗ |
| **Grok** | ✓ consumer memory feature | ? not documented | ✓ Agent Tools API; X integration | ✓ via Agent Tools API | ✗ | ✗ |
| **DeepSeek** | ? not documented | ? | ✗ (API only) | ~ (code in model, not app sandbox) | ✗ | ✗ |
| **Qwen** | ? not documented | ~ Model Studio | ✓ works w/ Claude Code, Cline, Qwen Code | ✓ (agentic coding) | ✗ | ~ via Model Studio |
| **Manus** | ~ task context | ✓ task projects | ✓ email + Slack; Agent Skills | ✓ (writes/runs code, builds apps) | ~ slides/sites/reports as outputs | ✓ Agent Skills |

### Part C — Platform, openness & pricing (learner-relevant)

| Tool | Mobile apps | API access | Open weights | Free-tier limit | Cheapest paid tier |
|---|---|---|---|---|---|
| **ChatGPT** | ✓ iOS/Android/desktop | ✓ ($5 in / $30 out per 1M, gpt-5.5) | ✗ | 10 GPT-5.5 msgs / 5 hrs, then mini model | **Go $8/mo** (US) — 10× msgs/uploads/images |
| **Codex** | ✓ app + CLI + IDE + Cloud | ✓ (same gpt-5.5 pricing) | ✗ | temporarily included on Free & Go | bundled w/ Plus $20/mo |
| **Claude** | ✓ iOS/Android/desktop | ✓ ($5 in / $25 out, Opus 4.7) | ✗ | Free: chat+search+memory, limited usage | **Pro $17/mo** annual ($20 monthly) |
| **Claude Code** | ✗ (terminal + VS Code) | ✓ (same API) | ✗ | **not free** | Pro $17/mo (shared usage w/ chat) |
| **Cowork** | ✗ (Claude Desktop) | n/a (product surface) | ✗ | **not free** (Pro+) | Pro $17/mo |
| **Gemini** | ✓ iOS/Android | ✓ (AI Studio, Vertex) | ✗ (Gemini); Gemma is separate open family | Free: Gemini 3 in app; ~1,500 Flash req/day (3rd-party) | Google AI Pro (price not in vendor sources reviewed) |
| **Perplexity** | ✓ iOS/Android | ✓ Sonar API ($3 in / $15 out) | ✗ | Free: unlimited basic; ~5 Pro searches/day | **Pro $20/mo** ($200/yr) |
| **Comet** | ✓ Android 12+; macOS/Win; iOS soon | n/a (browser) | ✗ | **Free worldwide** | free (Pro perks via bundle) |
| **Grok** | ✓ iOS/Android/web | ✓ ($1.25 in / $2.50 out, grok-4.3) | ✗ | free to try; SuperGrok for higher limits | SuperGrok (price not in vendor source) |
| **DeepSeek** | ✓ iOS/Android | ✓ (paid; v4-flash $0.14/$0.28) | ✓ V4-Pro & V4-Flash on Hugging Face | App/chat **free**; API no free quota | API metered; app free |
| **Qwen** | ~ web/app | ✓ Alibaba Cloud Model Studio | ✓ (partial — 27B dense, MoE Apache-2.0) | 1M tokens / 90 days/model; open weights self-host | Model Studio tiered by token count |
| **Manus** | ✓ app + website + desktop | ? not emphasized | ✗ | Free: 300 credits/day, 1 concurrent task, 1.6 Lite | **Pro $20/mo** (4,000 credits) |

---

## Per-Tool Notes (sourced specifics)

### OpenAI — ChatGPT
Flagship **GPT-5.5** (released 2026-04-24); **400K context** in ChatGPT surfaces, **1M via API** (vendor). Web search, voice, saved memory, GPT use, and Deep Research are all on **Free** — but the hard ceiling is **10 GPT-5.5 messages per 5-hour window**, after which it silently drops to a mini model (vendor: help.openai.com). **Cheapest upgrade: ChatGPT Go $8/mo** (US), launched in 171 countries — 10× messages/uploads/images. *Third-party (Artificial Analysis, 2026-04-23): GPT-5.5 (xhigh) tops the Intelligence Index, breaking a three-way tie with Claude Opus 4.7 and Gemini 3.1 Pro; leads GDPval-AA at 1785 Elo.*

### OpenAI — Codex
Agentic coding across **app / CLI / IDE / Cloud**. **Goal mode** drives toward an objective for hours/days; built-in **worktrees** run parallel agents in isolated repo copies; **Automations** do unprompted triage/CI. Recommended model GPT-5.5. **Temporarily included on Free and Go** — a no-cost way to try agentic coding while it lasts (vendor). Vendor benchmark: SWE-Bench Pro 58.6%, Terminal-Bench 2.0 82.7% (state-of-the-art for command-line workflows).

### Anthropic — Claude
Built on **Opus 4.7 / Sonnet 4.6 / Haiku 4.5** (1M context on Opus/Sonnet). **Free is genuinely useful:** chat, web search, memory, file creation w/ code execution, and Slack + Google Workspace connectors all on Free. **No native image generation.** Projects and Research are **Pro+ only**. *Third-party (LMArena, Apr 2026): Claude Opus 4.6 held #1 on the Text leaderboard (~1504 Elo); Opus 4.7 leads SWE-bench Pro ~64.3% per Artificial Analysis.* Cheapest paid: **Pro $17/mo** annual.

### Anthropic — Claude Code
Terminal/VS Code agentic coding. Runs bash, edits/creates/searches files, MCP connectors (Notion, Figma, DBs), subagents, plugins. **Not free** — requires Pro/Max; **one subscription covers Claude chat + Claude Code with shared usage limits** (vendor).

### Anthropic — Cowork
Agentic **knowledge work** (non-coding) in Claude Desktop, built on Claude Code's architecture. **"Dispatch" computer use** opens apps, fills spreadsheets, navigates browser; generates Excel (with formulas)/PowerPoint/docs; runs **scheduled recurring tasks**; human-in-the-loop approval. **Not on Free** — Pro/Max/Team/Enterprise (vendor).

### Google — Gemini
Latest generation **Gemini 3.x** (3.5 Flash GA flagship, 3.1 Pro top reasoning) — *not 2.5*. 1M context. Genuinely multimodal: text/image/audio/video in, **image gen ("Nano Banana")**, **Gemini Live** voice, **Gemini Computer Use** for browser control, **Gemini Agent** for multi-step workflows. **Gemini 3 is free in the standard app.** *Third-party: Gemini 3.1 Pro leads GPQA Diamond (~94.3%, Artificial Analysis) and is cited as the cost-efficiency leader at the frontier (LMArena summary).* Paid AI Pro/Ultra adds Search AI Mode + Deep Think; **region availability of paid tiers not confirmed in vendor sources — verify at signup.**

### Perplexity — Perplexity
"Answer engine" — **real-time web search with inline numbered citations on every answer** (its core differentiator). In-house **Sonar** models; routes to frontier models for Pro. Deep Research runs dozens of searches. **Free** gives cited real-time search (strong for verifiable study answers) with ~5 Pro searches/day; **Pro $20/mo** unlocks unlimited file upload, voice, ~300 Pro searches/day equivalent. Max price **not stated** in vendor sources.

### Perplexity — Comet
**Perplexity's AI browser**, *free worldwide* (macOS/Win/Android 12+; iOS soon). **Comet Assistant** = passive page/tab help; **Comet Agent** = active web automation (clicks, fills forms, navigates). Built-in Android ad blocker (cuts data use). *Third-party: reviewers note Comet is intentionally **user-driven** — it asks before big actions, contrasted with Manus's hands-off autonomy (aixsociety, o-mega).* 

### xAI — Grok
Flagship **Grok 4.3** (1M context). Web + **X live search**, **Grok Imagine** (image + video), voice on web/mobile + Voice API, **multi-agent reasoning**, Agent Tools API (web/X search, code execution). **Critical learner caveat:** underlying models have a **Nov 2024 training cutoff** and "no knowledge of current events" unless server-side search is turned on (vendor). Proprietary — **no open weights**. API cheap: $1.25 in / $2.50 out per 1M.

### DeepSeek
**DeepSeek-V4** (V4-Pro 1.6T/49B active; V4-Flash 284B/13B), **open-weighted on Hugging Face** (April 2026), 1M context. App/chat **free**. Strength: open-source agentic coding (~80.6% SWE-bench Verified per 3rd-party). **Gaps:** no native image generation; voice is **input-only** (button-to-text); web search exists but is **unreliable for time-sensitive queries** per hands-on reviews. Very cheap API. *Note: vendor positions V4 as "open-source SOTA in agentic coding."*

### Alibaba — Qwen
**Qwen3.x** family — flagship **Qwen3-Max-Thinking**; **Qwen3.7 "The Agent Frontier"** announced 2026-05-21. Up to 1M context (Qwen-Long to 10M). **Partial open weights** (Qwen3.6-27B + MoE/dense Apache-2.0 — self-hostable for free; Max/Plus proprietary hosted). Strong agentic coding + visual GUI agent; Qwen-Omni adds audio. **Free quota: 1M tokens / 90 days per model** on Model Studio. *Third-party: a ~35B Qwen3.6 variant runs on a single RTX 4090 at ~73.4% SWE-bench Verified (buildfastwithai) — notable for self-hosting learners with limited hardware.*

### Manus
**General AI agent** (not a raw LLM) — flagship **Manus 1.6 Max**. Does **one-shot autonomous task completion**: slide/site/app building (with DB, Stripe, SEO), browser operation, research, image + music gen, email/Slack integration, Agent Skills. **Browser Operator** works in your logged-in sessions. **Joining Meta** (announced late 2026); product remains live, HQ Singapore. **Free: 300 credits/day, 1 concurrent task, 1.6 Lite.** Pro **$20/mo** (4,000 credits). *Third-party caveat: reviewers report fast credit burn, occasional hallucinated clicks on changed pages, and a cloud VM users can't audit after the fact (vellum, futureagi).*

---

## Conflicts & Caveats

1. **"Best model" depends entirely on benchmark/use case — no single winner (May 2026).** Vendor pages each claim leadership on their chosen metric (OpenAI: Terminal-Bench 2.0 82.7%; Anthropic: SWE-bench Pro; Google: GPQA Diamond). Third-party aggregators agree there is **no overall #1**: GPT-5.5 (xhigh) tops Artificial Analysis Intelligence Index, while LMArena's *human-preference* Text leaderboard put Claude Opus 4.6 at #1 — different methodologies, different winners. Present per-task, not "the best."

2. **LMArena lag.** As of the Apr 2026 LMArena snapshot, the Text leaderboard still listed **Opus 4.6** at #1, while vendor docs already shipped **Opus 4.7** and Artificial Analysis already scored 4.7. Arena ELO trails new releases by weeks — cross-reference the live board before quoting a rank.

3. **DeepSeek web search & multimodality:** vendor docs imply web/webpage summarization works; independent reviews (cracked.ai, tldv) call DeepSeek search **"unreliable for time-sensitive queries"** and confirm **no native image generation** and **voice-input-only**. Trust the third-party functional read here over the vendor's optimistic framing.

4. **Grok knowledge cutoff:** xAI's own docs state a **Nov 2024 training cutoff** with no current-events knowledge unless search is enabled — a genuine learner trap, since consumer marketing emphasizes "live" search. The "live" experience requires the search tool to be on.

5. **Manus autonomy vs reliability:** vendor markets "describe an outcome, step away, come back to finished work." Hands-on reviewers temper this with **credit burn, hallucinated clicks, and an unauditable cloud VM.** Frame Manus as powerful-but-supervise.

6. **Regional availability is largely unconfirmed in vendor sources.** ChatGPT Go is stated for 171 countries; Comet is "free worldwide"; but **Google AI Pro/Ultra paid-tier availability by region is not confirmed** and **regional pricing is not published** by most vendors. All paid prices above are US/USD list. Verify at signup.

7. **"Open weights" nuance:** DeepSeek V4 (both variants) and parts of Qwen3 (27B + MoE Apache-2.0) are genuinely open and **self-hostable for free** — relevant to self-hosters. Qwen's Max/Plus tiers and all OpenAI/Anthropic/Google/xAI/Perplexity/Manus models are **closed**.

8. **Cells marked "?":** memory/projects/connectors for DeepSeek and Qwen, Comet/Manus voice, and several niche flags are **not documented on vendor pages reviewed** — left as "not found" rather than inferred.

---

### Free-tier takeaways for learners
- **Verifiable study answers at $0:** Perplexity Free (cited real-time search) + Comet (free worldwide, built-in ad blocker) are the strongest no-cost combo.
- **Best general free chat:** Gemini 3 (free in app, multimodal, image gen) and Claude Free (web search, memory, connectors, big context) — both more generous than ChatGPT Free's 10-message/5-hr ceiling.
- **Free agentic coding while it lasts:** OpenAI Codex is *temporarily* free on ChatGPT Free/Go.
- **Cheapest meaningful upgrade:** ChatGPT **Go $8/mo** is the lowest paid step-up; Claude **Pro $17/mo** bundles Claude Code + Cowork.
- **Own-hardware route:** DeepSeek V4 and smaller Qwen3 (Apache-2.0) are open-weight and self-hostable for free — a ~35B Qwen3.6 reportedly runs on a single RTX 4090.

---

### Sources
- **Vendor-official** (full per-fact URLs in `.planning/research/vendor-official/`): openai.com / developers.openai.com / help.openai.com; platform.claude.com / claude.com / code.claude.com / support.claude.com; deepmind.google / blog.google / ai.google.dev; perplexity.ai (+ /hub/blog, /comet, /pro); docs.x.ai / x.ai; api-docs.deepseek.com / chat.deepseek.com; qwen.ai / alibabacloud.com; manus.im / help.manus.im.
- **Third-party comparative/benchmark:** [LMArena Text leaderboard](https://arena.ai/leaderboard/text); [Artificial Analysis — GPT-5.5 is the new leading model (2026-04-23)](https://artificialanalysis.ai/articles/openai-gpt5-5-is-the-new-leading-AI-model); [Artificial Analysis model leaderboard](https://artificialanalysis.ai/leaderboards/models); [buildfastwithai May 2026 leaderboard](https://www.buildfastwithai.com/blogs/best-ai-models-may-2026-leaderboard); [cracked.ai DeepSeek features review](https://www.cracked.ai/tool-review/ai-assistants/deepseek-features); [aixsociety Manus vs Comet](https://aixsociety.com/manus-ai-vs-perplexity-comet-vs-autoglm-ai-agents-for-everyday-tasks/); [o-mega browser-use agents 2026](https://o-mega.ai/articles/top-10-browser-use-agents-full-review-2026); [vellum Manus alternatives](https://www.vellum.ai/blog/best-manus-alternatives).
