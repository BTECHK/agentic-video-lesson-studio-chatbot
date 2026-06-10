import type { ChatTurn } from './types.js';

/** Per-conversation history, keyed by channel id. Isolated — no global memory.
 * Trimmed to the last N turns to bound context + cost. In-memory MVP. */
export class SessionStore {
  private sessions = new Map<string, ChatTurn[]>();
  constructor(private maxTurns = 12) {}

  isFirstTurn(id: string): boolean {
    return !this.sessions.has(id) || this.sessions.get(id)!.length === 0;
  }

  append(id: string, turn: ChatTurn): ChatTurn[] {
    const arr = this.sessions.get(id) ?? [];
    arr.push(turn);
    while (arr.length > this.maxTurns) arr.shift();
    this.sessions.set(id, arr);
    return arr;
  }

  history(id: string): ChatTurn[] {
    return this.sessions.get(id) ?? [];
  }

  reset(id: string): void {
    this.sessions.delete(id);
  }
}
