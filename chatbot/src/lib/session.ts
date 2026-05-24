import { mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { LLMMessage } from './llm/types';
import type { AccessMode } from './types';

export interface Session {
  id: string;
  messages: LLMMessage[];
  accessMode: AccessMode;
  createdAt: number;
  lastActivityAt: number;
}

/**
 * Durable backing store for sessions. The default implementation writes one
 * JSON file per session under a data directory, so history survives server (and
 * container) restarts when that directory is a mounted volume.
 */
export interface SessionStorage {
  load(): Session[];
  save(session: Session): void;
  remove(id: string): void;
}

export class SessionStore {
  private sessions = new Map<string, Session>();
  private readonly maxAge = 30 * 60 * 1000; // 30 minutes inactivity timeout
  private readonly storage?: SessionStorage;

  constructor(storage?: SessionStorage) {
    this.storage = storage;
    if (storage) {
      for (const session of storage.load()) {
        this.sessions.set(session.id, session);
      }
    }
  }

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
    this.storage?.save(session);
    return session;
  }

  get(id: string): Session | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    if (Date.now() - session.lastActivityAt > this.maxAge) {
      this.sessions.delete(id);
      this.storage?.remove(id);
      return undefined;
    }
    session.lastActivityAt = Date.now();
    this.storage?.save(session);
    return session;
  }

  addMessage(sessionId: string, message: LLMMessage): void {
    const session = this.get(sessionId);
    if (session) {
      session.messages.push(message);
      this.storage?.save(session);
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
        this.storage?.remove(id);
      }
    }
  }
}

/** File-backed storage: one <id>.json per session under `dir`. */
export function fileSessionStorage(dir: string): SessionStorage {
  return {
    load: () => {
      if (!existsSync(dir)) return [];
      return readdirSync(dir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => {
          try {
            return JSON.parse(readFileSync(join(dir, f), 'utf-8')) as Session;
          } catch {
            return null;
          }
        })
        .filter((s): s is Session => s !== null);
    },
    save: (session) => {
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, `${session.id}.json`), JSON.stringify(session), 'utf-8');
    },
    remove: (id) => {
      rmSync(join(dir, `${id}.json`), { force: true });
    },
  };
}

// Persist to a mountable data directory so sessions survive restarts.
const SESSION_DIR = process.env.SESSION_DATA_DIR ?? join(process.cwd(), 'data', 'sessions');
export const sessionStore = new SessionStore(fileSessionStorage(SESSION_DIR));
