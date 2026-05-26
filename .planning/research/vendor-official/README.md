# Vendor-official market research (#36)

Single source-of-truth dataset for the AI-tool comparison + Tool Repository.
Compiled **May 2026** from **vendor-official sources only** (each vendor's own
docs/blog/pricing). Per-fact source URLs live in the per-vendor files:

- [`openai.md`](openai.md) — ChatGPT, Codex
- [`anthropic.md`](anthropic.md) — Claude, Claude Code, Cowork
- [`google-perplexity.md`](google-perplexity.md) — Gemini, Perplexity, Comet
- [`challengers.md`](challengers.md) — Grok, DeepSeek, Qwen, Manus

## Sourcing policy (owner decision, 2026-05-26)

- **Capability claims + model/context/pricing facts → vendor-official only.** No
  third-party capability claims, no invented numbers.
- **Benchmark metrics (Arena ELO, Quality Index, Speed) → third-party
  aggregators with explicit attribution.** Vendors don't publish these, so
  LMSYS Chatbot Arena + Artificial Analysis are kept *with a visible source +
  as-of date* on the compare UI. This is the one allowed exception to
  vendor-only, because the alternative (dropping the rows) loses the comparison
  signal the page exists for.

## Canonical current-model table (feeds benchmarks.ts + tool JSONs)

| Tool | Vendor | Current model (May 2026) | Context | API $/1M out | Free tier |
|------|--------|--------------------------|---------|--------------|-----------|
| ChatGPT | OpenAI | GPT-5.5 (Instant = default) | 400K (1M via API) | $30 | Yes — 10 msg / 5h |
| Codex | OpenAI | GPT-5.5 | 400K | $30 | Temporarily free |
| Claude | Anthropic | Claude Opus 4.7 / Sonnet 4.6 | 1M | $25 (Opus) / $15 (Sonnet) | Yes |
| Claude Code | Anthropic | Claude Opus 4.7 gen | 1M | subscription | No (Pro/Max) |
| Cowork | Anthropic | Claude Opus 4.7 gen | 1M | subscription | No (Pro+) |
| Gemini | Google | Gemini 3.5 Flash (GA), 3.1 Pro | 1M | not captured | Yes |
| Perplexity | Perplexity | Sonar (Sonar Pro) | n/a (answer engine) | $15 (Sonar Pro) | Yes |
| Comet | Perplexity | Sonar (browser agent) | n/a | n/a | Yes — free worldwide |
| Grok | xAI | Grok 4.3 | 1M | $2.50 | Yes |
| DeepSeek | DeepSeek | DeepSeek-V4 (Pro / Flash) | 1M | $0.28 (Flash) / $3.48 (Pro) | App free, open weights |
| Qwen | Alibaba | Qwen3-Max-Thinking / Qwen3.6-Plus | 262K (Max) / 1M (Plus) | tiered | 1M tok / 90d, open weights |
| Manus | Manus (joining Meta) | Manus 1.6 Max | n/a (agent) | n/a | 300 credits/day |

## Key corrections vs the prior (stale) data

- GPT-4o/4.1 retired → **GPT-5.5** (released 2026-04-24).
- Claude Sonnet 4 → **Opus 4.7 / Sonnet 4.6** (Sonnet 4 / Opus 4 retire 2026-06-15).
- Gemini 2.5 Pro → **Gemini 3.x** (3.5 Flash GA, 3.1 Pro).
- Grok-3 → **Grok 4.3**; DeepSeek-V3 → **DeepSeek-V4**; Qwen3-235B → **Qwen3.x**.
- **Manus status resolved:** joining Meta, product continues (HQ Singapore) — the
  old "China NDRC block / unresolved vendor" narrative is not in current sources.
- 1M-token context is now standard across Claude, Gemini, Grok, DeepSeek, Qwen.

## Open items to re-verify at signup
- region-specific availability / local-currency pricing (not enumerated on vendor pages).
- Perplexity Max price; Gemini API $/token; Gemini 3.5 Flash knowledge cutoff.
