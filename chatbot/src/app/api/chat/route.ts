import { NextRequest, NextResponse } from 'next/server';
import { ChatRequestSchema } from '@/lib/types';
import type { Citation } from '@/lib/types';
import { sessionStore } from '@/lib/session';
import { getLLMProvider } from '@/lib/llm/provider';

function parseCitations(content: string): { cleanContent: string; citations: Citation[] } {
  const citationRegex = /\[Source: ([^\]]+)\]/g;
  const citations: Citation[] = [];
  let match;
  let index = 0;

  while ((match = citationRegex.exec(content)) !== null) {
    const raw = match[1];
    const moduleMatch = raw.match(/Module\s+(\d+)/i);
    const lessonMatch = raw.match(/Lesson\s+(\d+)/i);
    const toolMatch = raw.match(/Tool:\s*(\w+)/i);
    citations.push({
      id: `cite-${index++}`,
      module: moduleMatch ? `Module ${moduleMatch[1]}` : 'General',
      lesson: lessonMatch ? `Lesson ${lessonMatch[1]}` : 'General',
      tool: toolMatch ? toolMatch[1] : undefined,
      snippet: raw,
    });
  }

  return { cleanContent: content, citations };
}

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

  const { message, sessionId, accessMode } = parsed.data;

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
    const response = await provider.chat({ messages, accessMode });

    sessionStore.addMessage(sessionId, {
      role: 'assistant',
      content: response.content,
    });

    const { cleanContent, citations } = parseCitations(response.content);

    return NextResponse.json({ message: cleanContent, citations });
  } catch (error) {
    console.error('LLM call failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 },
    );
  }
}
