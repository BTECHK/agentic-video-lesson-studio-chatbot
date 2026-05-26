# Challenger AI Tools — Vendor-Official Facts

> Scope: Grok (xAI), DeepSeek, Qwen (Alibaba), Manus.
> **Sourcing rule:** capability/model/pricing claims cite each vendor's own properties only
> (x.ai / docs.x.ai / grok.com; deepseek.com / api-docs.deepseek.com / chat.deepseek.com;
> qwen.ai / qwenlm.github.io / alibabacloud.com; manus.im / help.manus.im).
> No third-party benchmarks or Arena ELO are included.
> **Verified:** 2026-05-26. Facts reflect May 2026 vendor state, not older training data.

---

## Grok (xAI)

Current flagship is **Grok 4.3** (not Grok-3). Consumer Grok is free to try on web and apps,
with web/X live search, voice, and image/video generation surfaced in the free product.

| Fact | Value | Source |
|------|-------|--------|
| Current model(s) | grok-4.3 (flagship); grok-4.20-0309 (reasoning / non-reasoning / multi-agent); grok-build-0.1 | https://docs.x.ai/developers/models |
| Context window | 1,000,000 tokens (grok-4.3, grok-4.20); 256k (grok-build-0.1) | https://docs.x.ai/developers/models/grok-4.3 |
| Modalities | Text + image input; image/video generation via Grok Imagine; speech via Grok Voice API | https://docs.x.ai/developers/models ; https://x.ai/grok |
| Tool use / agentic | Function calling, structured outputs, configurable reasoning (none/low/medium/high); Agent Tools API (web search, X search, code execution); multi-agent reasoning | https://docs.x.ai/developers/models/grok-4.3 ; https://x.ai/api |
| Web search | Yes — server-side Web Search / X Search tools; live web + X in consumer app | https://docs.x.ai/developers/models ; https://x.ai/grok |
| Voice | Yes — chat by voice on web/iOS/Android; Voice API | https://x.ai/grok ; https://x.ai/api/voice |
| Image gen | Yes — Grok Imagine (image + video) | https://x.ai/grok ; https://grok.com/imagine |
| Memory | Consumer app feature (not a documented API parameter) | https://x.ai/grok |
| Open weights | No — proprietary, hosted API only | https://docs.x.ai/developers/models |
| API pricing | grok-4.3: $1.25 / 1M input, $2.50 / 1M output, $0.20 / 1M cached | https://docs.x.ai/developers/models/grok-4.3 |
| Free tier (learner) | Grok free to try on grok.com + iOS/Android; upgrade to SuperGrok for higher limits + multi-agent | https://x.ai/grok |

**Knowledge-cutoff note:** xAI states the underlying models have a **Nov 2024** training cutoff and "no
knowledge of current events" unless server-side search tools are enabled. Learners must turn on search for
current facts. (Source: https://docs.x.ai/developers/models)

**Vendor benchmark note:** xAI markets Grok 4.3 as leading on non-hallucination rate and agentic tool-calling;
no specific numeric scores are published on the docs model page. (Source: https://docs.x.ai/developers/models)

---

## DeepSeek

Current generation is **DeepSeek-V4** (not V3 / R1), open-sourced April 2026 with open weights on Hugging Face.
The DeepSeek app/chat is free.

| Fact | Value | Source |
|------|-------|--------|
| Current model(s) | DeepSeek-V4-Pro (1.6T total / 49B active); DeepSeek-V4-Flash (284B total / 13B active) | https://api-docs.deepseek.com/news/news260424 |
| Context window | 1,000,000 tokens; max output 384K | https://api-docs.deepseek.com/quick_start/pricing |
| Modalities | Text (coding, content, file reading); file upload + webpage summarization in app | https://api-docs.deepseek.com/news/news260424 ; https://chat.deepseek.com/ |
| Tool use / agentic | Marketed as open-source SOTA on agentic coding benchmarks; agent task capability | https://api-docs.deepseek.com/news/news260424 |
| Web search | App supports webpage summarization; no dedicated search feature documented in API | https://chat.deepseek.com/ |
| File upload | Yes — upload documents, long-context conversations in app | https://chat.deepseek.com/ |
| Voice | Not documented | https://api-docs.deepseek.com/ |
| Image gen | Not documented | https://api-docs.deepseek.com/ |
| Open weights | Yes — V4-Pro and V4-Flash open-weighted on Hugging Face | https://api-docs.deepseek.com/news/news260424 |
| API pricing (USD / 1M) | v4-flash: $0.14 in / $0.28 out. v4-pro (75% promo to 2026-05-31): $0.003625 cache-hit / $0.435 cache-miss in / $0.87 out; standard $0.0145 / $1.74 / $3.48 | https://api-docs.deepseek.com/quick_start/pricing |
| Free tier (learner) | DeepSeek App/chat is free (chat.deepseek.com, iOS/Android). API is paid (no documented free quota) | https://chat.deepseek.com/ ; https://api-docs.deepseek.com/quick_start/pricing |

**Pricing-change note:** Input cache-hit price cut to 1/10 of launch price effective 2026-04-26; v4-pro promo
discount ends 2026-05-31, after which list price applies. (Source: https://api-docs.deepseek.com/quick_start/pricing)

**Vendor benchmark note:** DeepSeek claims V4-Pro rivals top closed-source models and is "open-source SOTA in
agentic coding"; leads open models on Math/STEM/Coding. Numeric scores are in the announcement graphics/tech
report, not the prose. (Source: https://api-docs.deepseek.com/news/news260424)

---

## Qwen (Alibaba)

Current generation is the **Qwen3.x** family (not older Qwen2.5 / first-gen Qwen3). Flagship hosted reasoning
model is **Qwen3-Max-Thinking** (`qwen3-max-2026-01-23`); newest dense open release is **Qwen3.6-27B**;
**Qwen3.7 ("The Agent Frontier")** announced 2026-05-21. Alibaba Cloud Model Studio gives new users a free
token quota; many smaller Qwen3 models are Apache-2.0 open weights.

| Fact | Value | Source |
|------|-------|--------|
| Current model(s) | Qwen3-Max-Thinking (`qwen3-max-2026-01-23`); Qwen3.6-Plus; Qwen3.6-27B (dense, open); Qwen3.7 (2026-05-21); Qwen3.5-Plus/Flash | https://qwen.ai/blog?id=qwen3-max-thinking ; https://www.alibabacloud.com/blog/qwen3-6-plus-towards-real-world-agents_603005 ; https://www.alibabacloud.com/help/en/model-studio/models |
| Context window | 1,000,000 tokens (Qwen3.6-Plus, Qwen3.5-Plus/Flash, Qwen-Plus/Flash); 262,144 (Qwen3-Max); Qwen-Long up to 10M | https://www.alibabacloud.com/blog/qwen3-6-plus-towards-real-world-agents_603005 ; https://www.alibabacloud.com/help/en/model-studio/models |
| Modalities | Multimodal: text + image; Qwen3-Max/3.5 also video; Qwen-Omni adds audio | https://www.alibabacloud.com/help/en/model-studio/models |
| Tool use / agentic | Strong agentic coding (SWE-Bench, Terminal-Bench 2.0); `preserve_thinking` API; context-folding; works with Claude Code / Qwen Code / Cline etc.; visual GUI agent | https://www.alibabacloud.com/blog/qwen3-6-plus-towards-real-world-agents_603005 |
| Web search | Via Model Studio agent tooling (not a base-model feature) | https://www.alibabacloud.com/help/en/model-studio/models |
| Voice | Qwen-Omni handles audio in/out | https://www.alibabacloud.com/help/en/model-studio/models |
| Image gen | Vision input native; image generation via dedicated Qwen models on Model Studio | https://www.alibabacloud.com/help/en/model-studio/models |
| Open weights | Yes (partial) — Qwen3.6-27B open on Hugging Face/ModelScope; Qwen3 MoE + dense models Apache-2.0. Qwen3-Max / 3.6-Plus are proprietary hosted | https://www.alibabacloud.com/blog/qwen3-6-plus-towards-real-world-agents_603005 ; https://qwenlm.github.io/blog/qwen3/ |
| Pricing | Tiered by input-token count on Alibaba Cloud Model Studio | https://www.alibabacloud.com/help/en/model-studio/models |
| Free tier (learner) | New-user free quota 1M tokens / 90 days per model on Model Studio; open-weight Qwen3 models self-hostable for free | https://www.alibabacloud.com/help/en/model-studio/models |

**Vendor benchmark note:** Alibaba reports Qwen3.6-27B surpasses prior open flagship Qwen3.5-397B-A17B and posts
top tool-calling / long-horizon planning and multimodal scores (MMLU-Pro across 29 languages, AIME 2026).
Numeric tables are in the official blog graphics. (Source: https://www.alibabacloud.com/blog/qwen3-6-plus-towards-real-world-agents_603005)

---

## Manus

**Status (resolved):** The earlier "unresolved vendor status" is now settled. Per Manus's own blog,
**Manus is joining Meta** (announcement dated December 29, copyright 2026). Manus states it "will continue to
sell and operate our product subscription service through our app and website," remains **headquartered in
Singapore**, and that joining Meta does not change "how Manus works or how decisions are made" (CEO Xiao Hong).
The manus.im site banner reads: *"Manus is now part of Meta — bringing AI to businesses worldwide."*
The Manus product is **live and not discontinued or region-blocked** per its own sources; the older
NDRC/China-block narrative is not referenced in current official material.

| Fact | Value | Source |
|------|-------|--------|
| Vendor status | Joining Meta; product subscription continues via app + website; HQ Singapore | https://manus.im/blog/manus-joins-meta-for-next-era-of-innovation ; https://manus.im/ |
| Current model(s) | Manus 1.6 Max (flagship agent), Manus 1.6, Manus 1.6 Lite | https://manus.im/blog/manus-max-release ; https://help.manus.im/en/articles/11711111-what-is-the-current-membership-pricing-for-manus |
| Product type | General AI Agent (autonomous task execution), not a raw LLM | https://manus.im/blog/manus-joins-meta-for-next-era-of-innovation |
| Agentic / autonomous | Yes — autonomous one-shot task completion without human intervention; planning + problem-solving; spreadsheet/financial modeling, web dev, report generation | https://manus.im/blog/manus-max-release |
| Capabilities | Slide creation, website/desktop-app building, browser operation, research, image gen, music gen, email + Slack integration, Agent Skills | https://manus.im/ ; https://manus.im/features/agent-skills |
| Context window | Not published as a token figure (agent abstracts model context) | https://manus.im/ |
| Web search / browse | Yes — browser operation + research | https://manus.im/ |
| File upload | Yes (document/data workflows, spreadsheets) | https://manus.im/blog/manus-max-release |
| Voice | Not advertised | https://manus.im/ |
| Image gen | Yes (plus music generation) | https://manus.im/ |
| Open weights | No — hosted agent product | https://manus.im/ |
| Free tier (learner) | Free plan: $0/mo, 300 credits/day, 1 concurrent task, Chat Mode + Manus 1.6 Lite in Agent Mode | https://help.manus.im/en/articles/11711111-what-is-the-current-membership-pricing-for-manus |
| Paid tiers | Pro from $20/mo (4,000 credits/mo, 20 concurrent + 20 scheduled tasks, 1.6 Max/1.6/Lite); $40/mo (8,000 credits, 7-day trial); Team from $20/seat/mo (+SSO, opt-out, analytics, access controls) | https://manus.im/pricing ; https://help.manus.im/en/articles/11711111-what-is-the-current-membership-pricing-for-manus |

**Free-tier learner note:** The free plan is credit-metered (300 daily credits, refreshed daily) and limited to
one concurrent task on the lightest agent (1.6 Lite). Free-tier websites created before 2025-12-29 are supported
free until 2026-01-31, then move to usage-based pricing. (Source: https://help.manus.im/en/collections/15919468-pricing-plans)

**Vendor benchmark note:** Manus markets 1.6 Max as a "measurable boost" in one-shot autonomous task success and
spreadsheet/web-dev quality; no numeric benchmark scores are published on the release page.
(Source: https://manus.im/blog/manus-max-release)
