import { z } from 'zod';

export type AccessMode = 'demo' | 'student';
export type LLMProvider = 'claude-passthrough' | 'api-key';

export interface Citation {
  id: string;
  module: string;
  lesson: string;
  tool?: string;
  verifiedDate?: string;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[];
  timestamp: number;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  accessMode: AccessMode;
  createdAt: number;
}

export interface ChatRequest {
  message: string;
  sessionId: string;
  accessMode: AccessMode;
}

export interface ChatResponse {
  message: string;
  citations: Citation[];
}

export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().min(1),
  accessMode: z.enum(['demo', 'student']),
});
