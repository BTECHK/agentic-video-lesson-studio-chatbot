/**
 * Retrieval Eval Set — guards against scoring/keyword regressions in findRelevantContent.
 *
 * NOTE: The default loader (content.ts) uses `import "server-only"` which cannot be
 * required in the vitest node environment. We therefore inject a fixture loader built
 * from the REAL tool data (copied verbatim from content/tools/*.json) rather than
 * using the default loader. The fixture mirrors the production tool set exactly —
 * id, name, vendor, description, and the capability keys that exist in each file.
 * This is an eval of actual retrieval logic against real-world tool profiles.
 */

import { describe, it, expect } from 'vitest';
import { findRelevantContent } from '@/lib/content-retrieval';
import type { ToolData, ToolCapability } from '@/lib/content-types';

// ---------------------------------------------------------------------------
// Minimal capability builder (only fields the scorer uses: supported + key name)
// ---------------------------------------------------------------------------
function cap(supported: boolean): ToolCapability {
  return {
    category: '',
    supported,
    summary: '',
    subFeatures: [],
    limitations: [],
    pricingTiers: [],
    versionHistory: [],
  };
}

// ---------------------------------------------------------------------------
// Fixture — real tool profiles condensed from content/tools/*.json
// Fields used by findRelevantContent: id, name, vendor, description, capabilities
// ---------------------------------------------------------------------------
const REAL_TOOLS: ToolData[] = [
  {
    id: 'claude',
    name: 'Claude',
    vendor: 'Anthropic',
    productId: 'claude',
    surface: 'Web app',
    isPrimarySurface: true,
    priority: 'P0',
    description:
      "Anthropic's AI assistant known for strong reasoning, long-context understanding, and safety-focused design, available through claude.ai web interface, mobile apps, and API with features like Projects, Artifacts, and Claude Code.",
    url: 'https://claude.ai',
    capabilities: {
      'writing-chat': cap(true),
      research: cap(true),
      'file-analysis': cap(true),
      'document-creation': cap(true),
      'image-generation': cap(false),
      prototyping: cap(true),
      personalization: cap(true),
      'persistent-context': cap(true),
      agents: cap(true),
      connectors: cap(true),
      dictation: cap(true),
    },
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    vendor: 'Anthropic',
    productId: 'claude',
    surface: 'Claude Code',
    isPrimarySurface: false,
    priority: 'P0',
    description:
      "Anthropic's agentic coding tool available across the Terminal CLI, VS Code/Cursor and JetBrains extensions, a Desktop app, and the web (claude.ai/code). Powered by Opus 4.8 and Sonnet 4.6 with 1M-token context, it reads, edits, and creates files across entire codebases with tool use, MCP server integration, hooks, background agents, and CI integrations.",
    url: 'https://docs.anthropic.com/en/docs/claude-code/overview',
    capabilities: {
      'writing-chat': cap(true),
      research: cap(true),
      'file-analysis': cap(true),
      'document-creation': cap(true),
      'image-generation': cap(false),
      prototyping: cap(true),
      personalization: cap(true),
      'persistent-context': cap(true),
      agents: cap(true),
      connectors: cap(true),
      dictation: cap(false),
    },
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    vendor: 'OpenAI',
    productId: 'chatgpt',
    surface: 'Web app',
    isPrimarySurface: true,
    priority: 'P0',
    description:
      "OpenAI's conversational AI assistant powered by the GPT-5.5 model family, offering text generation, code assistance, image generation, file analysis, and web browsing through a chat interface.",
    url: 'https://chat.openai.com',
    capabilities: {
      'writing-chat': cap(true),
      research: cap(true),
      'file-analysis': cap(true),
      'document-creation': cap(true),
      'image-generation': cap(true),
      prototyping: cap(true),
      personalization: cap(true),
      'persistent-context': cap(true),
      agents: cap(true),
      connectors: cap(true),
      dictation: cap(true),
    },
  },
  {
    id: 'codex',
    name: 'Codex',
    vendor: 'OpenAI',
    productId: 'codex',
    surface: 'Web app',
    isPrimarySurface: true,
    priority: 'P1',
    description:
      "OpenAI's cloud-based agentic software engineering system that autonomously reads, edits, and executes code in sandboxed environments, integrated into ChatGPT and available via API.",
    url: 'https://openai.com/codex',
    capabilities: {
      'writing-chat': cap(true),
      research: cap(true),
      'file-analysis': cap(true),
      'document-creation': cap(true),
      'image-generation': cap(true),
      prototyping: cap(true),
      personalization: cap(true),
      'persistent-context': cap(true),
      agents: cap(true),
      connectors: cap(true),
      dictation: cap(false),
    },
  },
  {
    id: 'gemini',
    name: 'Gemini',
    vendor: 'Google',
    productId: 'gemini',
    surface: 'Web app',
    isPrimarySurface: true,
    priority: 'P0',
    description:
      "Google's multimodal AI assistant built on the Gemini model family, offering advanced reasoning, web search grounding, long-context understanding, and deep integration with Google Workspace.",
    url: 'https://gemini.google.com',
    capabilities: {
      'writing-chat': cap(true),
      research: cap(true),
      'file-analysis': cap(true),
      'document-creation': cap(true),
      'image-generation': cap(true),
      prototyping: cap(true),
      personalization: cap(true),
      'persistent-context': cap(true),
      agents: cap(true),
      connectors: cap(true),
      dictation: cap(true),
    },
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    vendor: 'Perplexity AI',
    productId: 'perplexity',
    surface: 'Web app',
    isPrimarySurface: true,
    priority: 'P0',
    description:
      'An AI-powered answer engine focused on real-time web research with cited sources, providing direct answers to questions by searching the internet and synthesizing information from multiple sources with inline citations.',
    url: 'https://perplexity.ai',
    capabilities: {
      'writing-chat': cap(true),
      research: cap(true),
      'file-analysis': cap(true),
      'document-creation': cap(true),
      'image-generation': cap(true),
      prototyping: cap(false),
      personalization: cap(true),
      'persistent-context': cap(true),
      agents: cap(true),
      connectors: cap(true),
      dictation: cap(true),
    },
  },
  {
    id: 'comet',
    name: 'Comet',
    vendor: 'Perplexity AI',
    productId: 'comet',
    surface: 'Browser',
    isPrimarySurface: true,
    priority: 'P1',
    description:
      "Perplexity AI's dedicated AI browser built on Chromium with a built-in Comet Assistant that can browse and take actions across open tabs, designed for agentic web research and multi-step task completion.",
    url: 'https://www.perplexity.ai/comet',
    capabilities: {
      'writing-chat': cap(true),
      research: cap(true),
      'file-analysis': cap(true),
      'document-creation': cap(true),
      'image-generation': cap(false),
      prototyping: cap(false),
      personalization: cap(true),
      'persistent-context': cap(true),
      agents: cap(true),
      connectors: cap(true),
      dictation: cap(false),
    },
  },
  {
    id: 'grok',
    name: 'Grok',
    vendor: 'xAI',
    productId: 'grok',
    surface: 'Web app',
    isPrimarySurface: true,
    priority: 'P0',
    description:
      "xAI's AI assistant integrated with X (Twitter) for real-time information access, offering conversational AI with web search, image generation, and DeepSearch capabilities.",
    url: 'https://grok.com',
    capabilities: {
      'writing-chat': cap(true),
      research: cap(true),
      'file-analysis': cap(true),
      'document-creation': cap(true),
      'image-generation': cap(true),
      prototyping: cap(true),
      personalization: cap(true),
      'persistent-context': cap(true),
      agents: cap(true),
      connectors: cap(true),
      dictation: cap(true),
    },
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    vendor: 'DeepSeek',
    productId: 'deepseek',
    surface: 'Web app',
    isPrimarySurface: true,
    priority: 'P0',
    description:
      "DeepSeek's AI assistant built on open-source reasoning models, known for strong math and coding performance at low cost, with a chat interface and API access.",
    url: 'https://chat.deepseek.com',
    capabilities: {
      'writing-chat': cap(true),
      research: cap(true),
      'file-analysis': cap(true),
      'document-creation': cap(true),
      'image-generation': cap(false),
      prototyping: cap(true),
      personalization: cap(true),
      'persistent-context': cap(true),
      agents: cap(true),
      connectors: cap(false),
      dictation: cap(false),
    },
  },
  {
    id: 'manus',
    name: 'Manus',
    vendor: 'Manus',
    productId: 'manus',
    surface: 'Web app',
    isPrimarySurface: true,
    priority: 'P1',
    description:
      'A general-purpose autonomous AI agent that executes complex multi-step tasks independently using a cloud sandbox with browser, terminal, code execution, and file system tools.',
    url: 'https://manus.im',
    capabilities: {
      'writing-chat': cap(true),
      research: cap(true),
      'file-analysis': cap(true),
      'document-creation': cap(true),
      'image-generation': cap(false),
      prototyping: cap(true),
      personalization: cap(false),
      'persistent-context': cap(true),
      agents: cap(true),
      connectors: cap(true),
      dictation: cap(false),
    },
  },
  {
    id: 'qwen',
    name: 'Qwen',
    vendor: 'Alibaba Cloud',
    productId: 'qwen',
    surface: 'Web app',
    isPrimarySurface: true,
    priority: 'P1',
    description:
      "Alibaba Cloud's multilingual AI assistant built on the Qwen model family, offering strong performance across Chinese and English tasks with web search, code generation, and image understanding.",
    url: 'https://qwen.ai',
    capabilities: {
      'writing-chat': cap(true),
      research: cap(true),
      'file-analysis': cap(true),
      'document-creation': cap(true),
      'image-generation': cap(true),
      prototyping: cap(true),
      personalization: cap(true),
      'persistent-context': cap(true),
      agents: cap(true),
      connectors: cap(true),
      dictation: cap(true),
    },
  },
  {
    id: 'cowork',
    name: 'Cowork',
    vendor: 'Anthropic',
    productId: 'claude',
    surface: 'Cowork',
    isPrimarySurface: false,
    priority: 'P1',
    description:
      "Anthropic's collaborative AI workspace for teams, built on Claude, enabling shared projects, knowledge bases, and multi-user AI interactions within organizations.",
    url: 'https://claude.ai/cowork',
    capabilities: {
      'writing-chat': cap(true),
      research: cap(true),
      'file-analysis': cap(true),
      'document-creation': cap(true),
      'image-generation': cap(false),
      prototyping: cap(false),
      personalization: cap(true),
      'persistent-context': cap(true),
      agents: cap(false),
      connectors: cap(true),
      dictation: cap(false),
    },
  },
];

const loader = () => REAL_TOOLS;

// ---------------------------------------------------------------------------
// Golden eval cases — realistic learner questions mapped to expected tool id
// ---------------------------------------------------------------------------
interface EvalCase {
  query: string;
  expectToolId: string;
  rationale: string;
}

const GOLDEN_CASES: EvalCase[] = [
  {
    query: 'How does Claude handle long documents?',
    expectToolId: 'claude',
    rationale: 'Name match (weight 10) — "Claude" appears verbatim in the query',
  },
  {
    query: 'Does Perplexity support real-time web search with citations?',
    expectToolId: 'perplexity',
    rationale: 'Name match (weight 10) on "Perplexity"',
  },
  {
    query: 'What can ChatGPT do for image generation?',
    expectToolId: 'chatgpt',
    rationale: 'Name match (weight 10) on "ChatGPT"',
  },
  {
    query: 'Can I use Claude Code to autonomously edit files in my codebase?',
    expectToolId: 'claude-code',
    rationale: 'ID match (weight 10) on "claude-code" and name match on "Claude Code"',
  },
  {
    query: 'What AI tools does Anthropic offer?',
    expectToolId: 'claude',
    rationale: 'Vendor match (weight 8) on "Anthropic"; claude is the primary P0 Anthropic surface',
  },
  {
    query: 'Tell me about Grok from xAI',
    expectToolId: 'grok',
    rationale: 'Name match (weight 10) on "Grok" and vendor match (weight 8) on "xAI"',
  },
  {
    query: 'What is DeepSeek and what can it do?',
    expectToolId: 'deepseek',
    rationale: 'Name match (weight 10) on "DeepSeek"',
  },
  {
    query: 'How does Gemini compare for research tasks?',
    expectToolId: 'gemini',
    rationale: 'Name match (weight 10) on "Gemini"',
  },
  {
    query: 'Which tools from OpenAI support coding agents?',
    expectToolId: 'chatgpt',
    rationale: 'Vendor match (weight 8) on "OpenAI"; chatgpt is the primary OpenAI surface',
  },
  {
    query: 'What is the Manus AI agent?',
    expectToolId: 'manus',
    rationale: 'Name match (weight 10) on "Manus" and vendor match (weight 8) on "Manus"',
  },
];

describe('Retrieval Eval — golden cases (real-tool fixture)', () => {
  for (const { query, expectToolId, rationale } of GOLDEN_CASES) {
    it(`[${expectToolId}] "${query}"`, () => {
      const result = findRelevantContent(query, loader);
      const returnedIds = result.tools.map((t) => t.id);

      expect(
        returnedIds,
        `Expected "${expectToolId}" in top-5 for query: "${query}"\n` +
          `Rationale: ${rationale}\n` +
          `Returned: [${returnedIds.join(', ')}]`
      ).toContain(expectToolId);
    });
  }
});
