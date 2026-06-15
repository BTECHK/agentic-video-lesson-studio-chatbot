import type { BrainReply, ChatTurn, LLMProvider, ToolData } from './types.js';
import { findRelevantTools, formatToolsForPrompt } from './retrieval.js';
import { buildSystemPrompt } from './prompt.js';
import { stripSourceMarkup, groundedSources } from './citations.js';

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

  let raw: string;
  try {
    raw = await deps.provider.complete(system, history, deps.maxOutputTokens ?? 1024);
  } catch (err) {
    // The provider (e.g. Gemini key/quota/transport failure) must NEVER bubble
    // up as a raw 500 — that used to render to the user as the bare word
    // "internal". Log the real cause; reply in persona.
    console.error('[tutor-bot] provider.complete failed', err);
    return {
      text: "I'm having a brief hiccup reaching my brain — give me a moment and ask again.",
      citations: [],
    };
  }

  // Strip any stray source/tool markup, then derive the Sources footer from the
  // retrieved tools the answer actually names (grounded by construction).
  const text = stripSourceMarkup(raw) || raw;
  const citations = groundedSources(text, retrieved);
  return { text, citations };
}
