import { createHash } from 'node:crypto';

/** One structured JSON line per usage event → stdout only (Cloud Run fs is
 * ephemeral; Logs Explorer is the durable store). Chat id is hashed — no PII
 * beyond an irreversible, truncated hash reaches the log. */
export function emitEvent(kind: string, chatId: string | number, extra: Record<string, unknown> = {}): void {
  const user = createHash('sha256').update(String(chatId)).digest('hex').slice(0, 16);
  console.log(JSON.stringify({ evt: kind, user, ts: new Date().toISOString(), ...extra }));
}
