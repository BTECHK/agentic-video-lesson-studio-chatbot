# Anthropic — Vendor-Official Facts (as of May 2026)

> **Sources policy:** Every fact below cites an Anthropic-owned source (anthropic.com, claude.com, docs.anthropic.com / platform.claude.com, code.claude.com, support.claude.com). No third-party capability or model claims. No invented benchmarks.
> **Captured:** 2026-05-26. Pricing/models change frequently; re-verify before publishing.

Anthropic ships three surfaces relevant to a learner, all built on the same Claude model family:
- **Claude** — chat assistant (web, desktop, iOS, Android)
- **Claude Code** — terminal/CLI coding agent (also VS Code)
- **Claude Cowork** — desktop knowledge-work agent (Claude Desktop app)

---

## 1. Claude models (shared across all surfaces)

All current Claude models support **text + image input, text output, multilingual, and vision**. Latest generation as of May 2026:

| Fact | Value | Source |
|------|-------|--------|
| Most capable model | **Claude Opus 4.7** (`claude-opus-4-7`) — "most capable generally available model," step-change in agentic coding over Opus 4.6 | [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview) |
| Balanced model | **Claude Sonnet 4.6** (`claude-sonnet-4-6`) — best speed/intelligence combination | [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview) |
| Fast model | **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) — fastest, near-frontier | [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview) |
| Context window — Opus 4.7 | **1M tokens** (new tokenizer; ~555k words) | [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview) |
| Context window — Sonnet 4.6 | **1M tokens** (~750k words) | [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview) |
| Context window — Haiku 4.5 | **200k tokens** | [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview) |
| 1M context availability | Opus 4.7, Opus 4.6, Sonnet 4.6 include the full **1M-token window at standard pricing** | [Pricing — Long context](https://platform.claude.com/docs/en/about-claude/pricing) |
| Max output | Opus 4.7: 128k · Sonnet 4.6: 64k · Haiku 4.5: 64k tokens | [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview) |
| Extended thinking | Sonnet 4.6 ✓, Haiku 4.5 ✓ · Opus 4.7 uses **adaptive thinking** instead | [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview) |
| Knowledge cutoff (reliable) | Opus 4.7: Jan 2026 · Sonnet 4.6: Aug 2025 · Haiku 4.5: Feb 2025 | [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview) |
| Availability | Claude API, Claude Platform on AWS, Amazon Bedrock, Vertex AI, Microsoft Foundry | [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview) |
| Recently retired | Claude Sonnet 4 & Opus 4 deprecated; retire **June 15, 2026** | [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview) |

### API pricing (per million tokens, base)

| Model | Input | Output | Source |
|-------|-------|--------|--------|
| Claude Opus 4.7 | $5 / MTok | $25 / MTok | [Pricing](https://platform.claude.com/docs/en/about-claude/pricing) |
| Claude Sonnet 4.6 | $3 / MTok | $15 / MTok | [Pricing](https://platform.claude.com/docs/en/about-claude/pricing) |
| Claude Haiku 4.5 | $1 / MTok | $5 / MTok | [Pricing](https://platform.claude.com/docs/en/about-claude/pricing) |

Notes (vendor): Batch API = 50% discount; prompt-cache hits = 0.1x input; web search = **$10 / 1,000 searches**; web fetch = no extra charge; **code execution is free when used with web search or web fetch** (else 1,550 free container-hours/month). [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)

---

## 2. Claude (chat assistant)

Consumer plans (web / desktop / iOS / Android). Usage limits are **shared across Claude and Claude Code** on Pro/Max.

| Plan | Price | What it includes | Source |
|------|-------|------------------|--------|
| **Free** | $0 | Chat on web/iOS/Android/desktop; code generation; content creation; **web search**; **memory**; **file creation with code execution**; desktop extensions; **Slack + Google Workspace connectors** | [claude.com/pricing](https://claude.com/pricing) |
| **Pro** | $17/mo annual ($20 monthly) | Everything in Free + more usage; choice of models; **unlimited Projects**; Research; **includes Claude Code**; **includes Claude Cowork**; Claude for Excel/PowerPoint (beta); Microsoft 365 | [claude.com/pricing](https://claude.com/pricing), [Pro plan](https://support.claude.com/en/articles/8325606-what-is-the-pro-plan) |
| **Max** | from $100/mo | Everything in Pro + **5x or 20x more usage than Pro**; higher output limits; early access to advanced features; priority during peak traffic | [claude.com/pricing](https://claude.com/pricing) |

Capability flags (Claude chat):

| Capability | Free | Pro | Max | Source |
|------------|------|-----|-----|--------|
| Web search | ✓ | ✓ | ✓ | [claude.com/pricing](https://claude.com/pricing) |
| File upload / analysis | ✓ (file creation w/ code execution) | ✓ | ✓ | [claude.com/pricing](https://claude.com/pricing) |
| Memory | ✓ | ✓ | ✓ | [claude.com/pricing](https://claude.com/pricing) |
| Projects | — | ✓ unlimited | ✓ | [Pro plan](https://support.claude.com/en/articles/8325606-what-is-the-pro-plan) |
| Artifacts | ✓ (all consumer tiers) | ✓ | ✓ | [claude.com/pricing](https://claude.com/pricing) |
| Research | — | ✓ | ✓ | [claude.com/pricing](https://claude.com/pricing) |
| Model access (Opus/Sonnet/Haiku) | ✓ (limited usage) | ✓ choose model | ✓ | [claude.com/pricing](https://claude.com/pricing) |

---

## 3. Claude Code (CLI / coding agent)

Agentic coding tool that runs in the terminal (and VS Code). Bundled into Pro/Max — **one subscription covers Claude chat + Claude Code**; usage limits are shared.

| Fact | Value | Source |
|------|-------|--------|
| Access | Included in Pro and Max plans (unified subscription with Claude apps) | [Use Claude Code with Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan) |
| Terminal/computer access | Runs bash, edits/creates/searches files, builds visualizations via the terminal | [Best practices](https://code.claude.com/docs/en/best-practices) |
| MCP | Connect external tools (Notion, Figma, databases) via `claude mcp add` | [Best practices](https://code.claude.com/docs/en/best-practices) |
| Subagents | Specialized agents for parallel exploration + context management | [Best practices](https://code.claude.com/docs/en/best-practices) |
| Plugins | Package/share slash commands, subagents, MCP servers, hooks; works in terminal + VS Code | [Claude Code plugins](https://www.anthropic.com/news/claude-code-plugins) |
| Default model | Opus 4.7 generation (configurable) | [Model config](https://code.claude.com/docs/en/model-config) |

---

## 4. Claude Cowork (desktop knowledge-work agent)

Anthropic's agentic AI for **knowledge work** (non-coding), running inside the Claude Desktop app. Uses **the same agentic architecture as Claude Code**, without opening a terminal.

| Fact | Value | Source |
|------|-------|--------|
| What it is | Takes on complex, multi-step tasks and executes them on your behalf — "describe an outcome, step away, come back to finished work" | [Cowork product](https://claude.com/product/cowork) |
| Architecture | Brings **Claude Code's agentic capabilities to Claude Desktop** for non-coding work | [Get started w/ Cowork](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork) |
| Plan availability | **Not on Free.** Requires Pro, Max, Team, or Enterprise | [Get started w/ Cowork](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork) |
| Local file access | Reads/writes local files & folders without manual upload | [Cowork product](https://claude.com/product/cowork) |
| App integrations | Slack, Chrome, Microsoft 365; web via browser; MCP connectors | [Cowork product](https://claude.com/product/cowork) |
| Computer use ("Dispatch") | Opens apps, fills spreadsheets, navigates browser when no direct integration exists | [Cowork product](https://claude.com/product/cowork) |
| Document generation | Excel (with formulas), PowerPoint, formatted docs; editable with Claude for Excel/PowerPoint | [Get started w/ Cowork](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork) |
| Scheduled tasks | Recurring tasks run automatically (daily/weekly/monthly) | [Cowork product](https://claude.com/product/cowork) |
| Human-in-the-loop | Shows plan and waits for approval before significant actions | [Cowork product](https://claude.com/product/cowork) |
| Subagents | Coordinates sub-agents for parallel workstreams | [Get started w/ Cowork](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork) |

---

## Comparison-table capability flags (across surfaces)

| Capability | Claude (chat) | Claude Code | Cowork | Source |
|------------|:---:|:---:|:---:|--------|
| Web search | ✓ (incl. Free) | ✓ | ✓ | [pricing](https://claude.com/pricing), [Cowork](https://claude.com/product/cowork) |
| File upload/analysis | ✓ | ✓ | ✓ (local files) | [pricing](https://claude.com/pricing) |
| Memory / Projects | ✓ memory; Projects Pro+ | — | ✓ Projects + memory | [pricing](https://claude.com/pricing), [Cowork](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork) |
| Artifacts | ✓ | n/a | n/a | [pricing](https://claude.com/pricing) |
| MCP | ✓ (connectors) | ✓ | ✓ | [best practices](https://code.claude.com/docs/en/best-practices), [Cowork](https://claude.com/product/cowork) |
| Agentic coding | limited | ✓ (primary) | ✓ (built on it) | [best practices](https://code.claude.com/docs/en/best-practices) |
| Desktop knowledge work / computer use | — | terminal only | ✓ (Dispatch) | [Cowork](https://claude.com/product/cowork) |
| Free tier? | ✓ | ✗ (Pro/Max) | ✗ (Pro+) | [pricing](https://claude.com/pricing) |

---

## Vendor-published benchmark-relevant note

Anthropic describes **Claude Opus 4.7** as its "most capable generally available model" with a "step-change improvement in agentic coding over Claude Opus 4.6," and notes top-tier results across reasoning, coding, multilingual, long-context, honesty, and image processing for the Claude 4 family. ([Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)) Anthropic publishes no Arena ELO on these pages; none is asserted here.

---

## What a free-tier learner should know

- **Free is genuinely useful:** chat, web search, memory, file creation with code execution, and Slack/Google Workspace connectors are all on Free. ([pricing](https://claude.com/pricing))
- **Free gives access to Opus/Sonnet/Haiku**, but with limited usage per session/window; Pro starts at $17/mo (annual) for ~5x more usage. ([Pro plan](https://support.claude.com/en/articles/8325606-what-is-the-pro-plan))
- **Claude Code and Cowork are NOT free** — both require a paid plan (Pro or higher). ([Use Claude Code with Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan), [Cowork getting started](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork))
- **Projects and Research are Pro+ only.** ([pricing](https://claude.com/pricing))
- **One Pro/Max subscription covers Claude + Claude Code**, but usage is shared across both. ([Use Claude Code with Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan))
