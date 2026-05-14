import type { LLMMessage } from './llm/types';
import type { AccessMode } from './types';

interface Session {
  id: string;
  messages: LLMMessage[];
  accessMode: AccessMode;
  createdAt: number;
  lastActivityAt: number;
}

export class SessionStore {
  private sessions = new Map<string, Session>();
  private readonly maxAge = 30 * 60 * 1000; // 30 minutes inactivity timeout

  create(accessMode: AccessMode): Session {
    const id = crypto.randomUUID();
    const session: Session = {
      id,
      messages: [],
      accessMode,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    };
    this.sessions.set(id, session);
    return session;
  }

  get(id: string): Session | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    if (Date.now() - session.lastActivityAt > this.maxAge) {
      this.sessions.delete(id);
      return undefined;
    }
    session.lastActivityAt = Date.now();
    return session;
  }

  addMessage(sessionId: string, message: LLMMessage): void {
    const session = this.get(sessionId);
    if (session) {
      session.messages.push(message);
    }
  }

  getMessages(sessionId: string): LLMMessage[] {
    const session = this.get(sessionId);
    return session?.messages ?? [];
  }

  cleanup(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.lastActivityAt > this.maxAge) {
        this.sessions.delete(id);
      }
    }
  }
}

export const sessionStore = new SessionStore();
