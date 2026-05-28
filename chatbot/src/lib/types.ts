import { z } from 'zod';

export type AccessMode = 'demo' | 'student';
export type LLMProvider = 'anthropic' | 'mock' | 'claude-code' | 'google';
/** TA mode answers strictly from course content; Office Hours allows tangential exploration. */
export type ChatMode = 'ta' | 'office-hours';

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
}

export interface ChatResponse {
  message: string;
  citations: Citation[];
}

export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().min(1),
  mode: z.enum(['ta', 'office-hours']).default('ta'),
});

export const SessionRequestSchema = z.object({
  accessMode: z.enum(['demo', 'student']).default('demo'),
  accessCode: z.string().optional(),
});
