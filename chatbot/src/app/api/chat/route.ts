import { NextRequest, NextResponse } from 'next/server';
import { ChatRequestSchema } from '@/lib/types';
import { parseCitations, verifyCitations } from '@/lib/citations';
import { sessionStore } from '@/lib/session';
import { getLLMProvider } from '@/lib/llm/provider';
import { findRelevantContent, formatContentForPrompt } from '@/lib/content-retrieval';

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

  const session = sessionStore.get(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: 'Session expired or not found' },
      { status: 404 },
    );
  }

  sessionStore.addMessage(sessionId, { role: 'user', content: message });

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
    const verifiedCitations = verifyCitations(citations, tools.map(t => t.name));

    return NextResponse.json({ message: cleanContent, citations: verifiedCitations });
  } catch (error) {
    console.error('LLM call failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 },
    );
  }
}
