# OpenAI — Vendor-Official Facts (ChatGPT & Codex)

> Compiled **May 2026** from OpenAI's own sources only (openai.com, developers.openai.com, help.openai.com). All capability/model claims trace to a vendor URL in the Source column. No third-party benchmarks or invented numbers.

---

## Product 1 — ChatGPT

ChatGPT is OpenAI's consumer + business assistant (web, iOS, Android, Windows/macOS apps), powered by the GPT-5.x model family.

### Facts

| Fact | Value (May 2026) | Source |
|---|---|---|
| Current flagship model | **GPT-5.5** (and **GPT-5.5 Pro** for higher accuracy); **GPT-5.5 Instant** is the default model for all users, replacing GPT-5.3 Instant | https://openai.com/index/introducing-gpt-5-5/ , https://openai.com/index/gpt-5-5-instant/ |
| Release / availability | GPT-5.5 released **April 24, 2026**; rolling out to Plus, Pro, Business, Enterprise in ChatGPT and Codex. GPT-5.5 Pro to Pro/Business/Enterprise. GPT-5.5 Instant to all ChatGPT users | https://openai.com/index/introducing-gpt-5-5/ |
| Context window | **400K context window** in Codex/ChatGPT surfaces; **1M context window** via the API (gpt-5.5). API prompts >272K input tokens priced at 2x input / 1.5x output | https://developers.openai.com/api/docs/models/gpt-5.5 , https://openai.com/index/introducing-gpt-5-5/ |
| Modalities | Text + vision; image generation in-product (ChatGPT Images 2.0 on all tiers; DALL·E 3 path); voice mode | https://help.openai.com/en/articles/11084440-chatgpt-image-library , https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq |
| Tool use / agentic | Tool calls supported via Responses API; web search, computer use, and Codex (agentic coding) surfaced as tools; Deep Research available | https://developers.openai.com/api/docs/models/gpt-5.5 , https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus |
| Web browsing | Yes — web search available, including on Free tier (via Skills menu) | https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq |
| File upload | Yes — stricter rate limits on Free; 10× more on Go vs Free | https://help.openai.com/en/articles/11989085-what-is-chatgpt-go |
| Memory | Free = **saved memories only** (manual); paid tiers add automatic memory; Go has longer memory | https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq , https://help.openai.com/en/articles/11989085-what-is-chatgpt-go |
| Voice | Voice mode on chatgpt.com, iOS, Android, Windows app; available on Free (same Free usage limits) | https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq |
| Custom GPTs / GPT Store | Free users can **use** GPTs (while GPT-5.5 quota remains); **creating** GPTs requires a paid plan | https://help.openai.com/en/articles/9300383-using-gpts-on-our-free-tier-faq |
| Coding / Codex access | Codex included in Plus/Pro/Business/Enterprise; **temporarily included in Free and Go** | https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan |

### Pricing tiers (learner-relevant)

| Tier | Price | Notes | Source |
|---|---|---|---|
| **Free** | $0 | Up to **10 GPT-5.5 messages / 5 hours**, then auto-downgrades to a mini model. Stricter limits on file upload, data analysis, image creation. Includes web search, voice, saved memory, GPT use, Deep Research | https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq , https://help.openai.com/en/articles/11909943-gpt-53-and-54-in-chatgpt |
| **Go** | **$8/mo** (US) | **10× more** messages, file uploads, image creation vs Free; unlimited GPT-5.5 Instant; longer memory. Launched worldwide (171 countries) | https://openai.com/index/introducing-chatgpt-go/ , https://help.openai.com/en/articles/11989085-what-is-chatgpt-go |
| **Plus** | $20/mo | Expanded access incl. GPT-5.x Thinking; legacy model choice; Codex + Deep Research for select projects; higher limits than Go | https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus , https://openai.com/chatgpt/pricing/ |
| **Pro** | $100/mo and $200/mo | Two tiers; highest usage of Deep Research/Codex; most capable Pro model | https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers |
| Business / Enterprise / Edu | per-seat | Standard seats include ChatGPT + Codex; admin/security controls | https://help.openai.com/en/articles/8792828-what-is-chatgpt-business |

### Benchmark-relevant (vendor-published)

OpenAI officially publishes for GPT-5.5: **SWE-Bench Pro 58.6%** (single-pass agentic coding) and **Terminal-Bench 2.0 82.7%** (state-of-the-art). OpenAI states GPT-5.5 is its "strongest agentic coding model to date" and more token-efficient than GPT-5.4. (Source: https://openai.com/index/introducing-gpt-5-5/ ) System card: https://deploymentsafety.openai.com/gpt-5-5

---

## Product 2 — Codex

Codex is OpenAI's agentic coding platform / "AI coding partner" — available as a CLI, IDE extension, desktop/app, and Codex Cloud (web).

### Facts

| Fact | Value (May 2026) | Source |
|---|---|---|
| Current model(s) | **GPT-5.5** is the recommended model for most Codex tasks (strongest for complex coding, computer use, research). Codex lineup also includes GPT-5.4, GPT-5.4-mini (higher-usage routine local), and **GPT-5.3-Codex-Spark** (research preview, near-instant iteration, Pro) | https://developers.openai.com/codex/models , https://developers.openai.com/codex/pricing , https://openai.com/index/introducing-gpt-5-3-codex-spark/ |
| Context window | 400K (GPT-5.5 in Codex surfaces) | https://openai.com/index/introducing-gpt-5-5/ |
| Surfaces | Codex **app** (command center), **CLI**, **IDE extension**, **Codex Cloud** (web). CLI + IDE share config.toml; `/model` to switch | https://openai.com/codex/ , https://developers.openai.com/codex/models |
| Agentic features | **Goal mode** (no longer experimental — drives toward an objective for hours/days; in app, IDE ext, CLI); **built-in worktrees** (parallel agents, isolated repo copies, no conflicts); cloud environments; **Skills**; **Automations** (unprompted issue triage, alert monitoring, CI/CD) | https://openai.com/codex/ , https://developers.openai.com/codex/skills , https://developers.openai.com/codex/changelog |
| Code execution | Yes — completes tasks end-to-end (features, refactors, migrations), runs tests, code review | https://openai.com/codex/ |
| Access by plan | Included with Plus, Pro, Business, Enterprise/Edu; **temporarily included with Free and Go**; other plans get 2x rate limits. Pro = 5x/10×/20x usage tiers | https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan , https://developers.openai.com/codex/pricing |
| API pricing (GPT-5.5) | **$5 / 1M input tokens, $30 / 1M output** (gpt-5.5); GPT-5.5 Pro **$30 / 1M input, $180 / 1M output** | https://openai.com/index/introducing-gpt-5-5/ , https://developers.openai.com/api/docs/models/gpt-5.5-pro |

### Benchmark-relevant (vendor-published)

Codex performance tracks its underlying models. For GPT-5.5 (recommended Codex model) OpenAI publishes **SWE-Bench Pro 58.6%** and **Terminal-Bench 2.0 82.7%** (state-of-the-art for command-line workflows). OpenAI also notes it was named a Leader in enterprise coding agents by Gartner (2026). (Sources: https://openai.com/index/introducing-gpt-5-5/ , https://openai.com/index/gartner-2026-agentic-coding-leader/ )

---

## Notes for a learner on Free tier

- **Availability:** ChatGPT Go launched worldwide across 171 countries; ChatGPT Free and Go are broadly available. (Vendor pages don't enumerate individual countries, but Go is described as rolling out "everywhere ChatGPT is available.") — https://openai.com/index/introducing-chatgpt-go/
- **Free-tier ceiling to plan around:** only **10 GPT-5.5 messages per 5-hour window**, then ChatGPT silently switches to a smaller "mini" model. Image creation, file upload, and data analysis hit limits faster on Free. — https://help.openai.com/en/articles/11909943-gpt-53-and-54-in-chatgpt , https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq
- **Best value upgrade for a learner:** **ChatGPT Go at $8/mo (US price)** gives 10× messages/uploads/images and unlimited GPT-5.5 Instant — the cheapest paid step up from Free. — https://help.openai.com/en/articles/11989085-what-is-chatgpt-go
- **Free Codex window:** Codex (agentic coding) is *temporarily* included on Free and Go — a no-cost way to try agentic coding while it lasts. — https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan

---

*Sources are OpenAI-official only. Where a specific figure (e.g. local-currency pricing) is not published on a vendor page, this is stated rather than inferred.*
