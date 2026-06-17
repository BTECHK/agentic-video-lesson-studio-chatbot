import { NextRequest, NextResponse } from 'next/server';
import { ChatRequestSchema } from '@/lib/types';
import { parseCitations, keepGroundedCitations } from '@/lib/citations';
import { sessionStore } from '@/lib/session';
import { getLLMProvider } from '@/lib/llm/provider';
import { classifyProviderError } from '@/lib/llm/errors';
import { findRelevantContent, formatContentForPrompt } from '@/lib/content-retrieval';
import { requireRateLimit } from '@/lib/rate-limit';
import { logEvent } from '@/lib/log';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { message, sessionId, mode } = parsed.data;
  const limited = requireRateLimit(req, 'chat', sessionId);
  if (limited) return limited;

  const session = sessionStore.get(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: 'Session expired or not found' },
      { status: 404 },
    );
  }

  sessionStore.addMessage(sessionId, { role: 'user', content: message });

  const startedAt = Date.now();
  try {
    const provider = getLLMProvider();
    const messages = sessionStore.getMessages(sessionId);

    const { tools } = findRelevantContent(message);
    const contentContext = formatContentForPrompt(tools);

    const response = await provider.chat({
      messages,
      accessMode: session.accessMode,
      contentContext: contentContext || undefined,
      mode,
    });

    sessionStore.addMessage(sessionId, {
      role: 'assistant',
      content: response.content,
    });

    const { cleanContent, citations } = parseCitations(response.content);
    // Hallucination guard: never return a citation to a source that was not
    // retrieved for this turn (Tutor invariant, #64).
    const groundedCitations = keepGroundedCitations(citations, tools.map(t => t.name));

    logEvent('chat.completed', {
      provider: provider.constructor.name,
      mode,
      accessMode: session.accessMode,
      citations: groundedCitations.length,
      ms: Date.now() - startedAt,
    });
    return NextResponse.json({ message: cleanContent, citations: groundedCitations });
  } catch (error) {
    const { status, message } = classifyProviderError(error);
    // Log the real cause server-side (status + full error) so billing/model/auth
    // failures are diagnosable; return only a user-safe message.
    logEvent('chat.failed', { status, error: String(error), ms: Date.now() - startedAt });
    return NextResponse.json({ error: message }, { status });
  }
}
