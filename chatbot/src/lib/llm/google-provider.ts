import type { LLMMessage, LLMProviderInterface, LLMRequest, LLMResponse } from './types';
import { getSystemPrompt } from './system-prompt';
import { parseCitations } from '../citations';
import { resolveGoogleChatbotApiKey } from '../config';
import { consumeGoogleChatbotRequest } from './google-usage';

export const DEFAULT_GOOGLE_MODEL = 'gemini-2.5-flash';

interface GoogleGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  promptFeedback?: {
    blockReason?: string;
    blockReasonMessage?: string;
  };
}

type StatusError = Error & { status: number };

export function resolveGoogleModel(): string {
  return process.env.GOOGLE_MODEL || DEFAULT_GOOGLE_MODEL;
}

function withStatus(status: number, message: string): StatusError {
  const error = new Error(message) as StatusError;
  error.status = status;
  return error;
}

function buildPrompt(messages: LLMMessage[], systemPrompt: string): string {
  const transcript = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
    .join('\n\n');
  return (
    `${systemPrompt}\n\n` +
    `# Conversation so far\n${transcript}\n\n` +
    `Reply as Tutor to the student's latest message. Output only your reply text ` +
    `(with inline [Source: ...] citations where grounded).`
  );
}

export function extractGoogleText(payload: GoogleGenerateResponse): string {
  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join('\n')
    .trim();
  return text;
}

function blockReason(payload: GoogleGenerateResponse): string | undefined {
  const reason = payload.promptFeedback?.blockReason;
  const message = payload.promptFeedback?.blockReasonMessage;
  if (reason && message) return `${reason}: ${message}`;
  return reason ?? message;
}

export class GoogleProvider implements LLMProviderInterface {
  async chat(request: LLMRequest): Promise<LLMResponse> {
    const systemPrompt = getSystemPrompt(request.accessMode, request.contentContext, request.mode);
    const prompt = buildPrompt(request.messages, systemPrompt);
    const model = resolveGoogleModel();
    const apiKey = resolveGoogleChatbotApiKey(process.env);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    consumeGoogleChatbotRequest(process.env);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey ?? '',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw withStatus(res.status, `Google API request failed (${res.status}): ${body.slice(0, 300)}`);
    }

    const data = (await res.json()) as GoogleGenerateResponse;
    const content = extractGoogleText(data);
    if (!content) {
      const reason = blockReason(data);
      throw withStatus(
        502,
        reason
          ? `Google API returned no text output (${reason}).`
          : 'Google API returned no text output.',
      );
    }

    const { citations } = parseCitations(content);
    return { content, citations };
  }
}
