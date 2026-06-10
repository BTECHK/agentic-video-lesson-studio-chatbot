import type { BrainReply, ChatTurn, LLMProvider, ToolData } from './types.js';
import { findRelevantTools, formatToolsForPrompt } from './retrieval.js';
import { buildSystemPrompt } from './prompt.js';
import { parseCitations, keepGroundedCitations } from './citations.js';

export interface BrainDeps {
  provider: LLMProvider;
  tools: ToolData[];
  maxOutputTokens?: number;
}

/**
 * The Tutor brain: retrieve → ground → answer → guard. Channel-agnostic — the
 * same function serves Telegram, the web test page, or any future adapter.
 * `history` is the full turn list (last entry = the new user message); the
 * caller decides firstTurn from its own session state.
 */
export async function respond(
  history: ChatTurn[],
  firstTurn: boolean,
  deps: BrainDeps,
): Promise<BrainReply> {
  const userMsg = [...history].reverse().find((t) => t.role === 'user')?.content ?? '';
  const retrieved = findRelevantTools(userMsg, deps.tools);
  const toolContext = formatToolsForPrompt(retrieved);
  const system = buildSystemPrompt({ toolContext, firstTurn });

  const raw = await deps.provider.complete(system, history, deps.maxOutputTokens ?? 600);

  const { cleanContent, citations } = parseCitations(raw);
  const grounded = keepGroundedCitations(
    citations,
    retrieved.map((t) => t.name),
  );
  return { text: cleanContent || raw, citations: grounded };
}
