import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { BrainDeps } from './brain.js';
import { respond } from './brain.js';
import { SessionStore } from './session.js';
import { RateLimiter, GlobalDailyCap } from './rate-limit.js';
import { TelegramChannel, type TelegramUpdate } from './channels/telegram.js';
import { formatReply } from './channels/telegram.js';
import { WEB_CHAT_HTML } from './web.js';

export interface ServerDeps extends BrainDeps {
  telegram?: TelegramChannel;
  webhookSecret?: string;
  webSession?: SessionStore;
  webLimiter?: RateLimiter;
  dailyCap?: GlobalDailyCap;
}

/** Client IP behind Cloud Run's proxy: first hop of x-forwarded-for, else socket. */
function clientIp(req: IncomingMessage): string {
  const xff = req.headers['x-forwarded-for'];
  const raw = Array.isArray(xff) ? xff[0] : xff;
  return (raw?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown').slice(0, 64);
}

/** One structured line per request → searchable in Cloud Run Logs Explorer, so
 * "who accessed it / is someone hammering it" is reviewable. No message bodies. */
function logAccess(fields: Record<string, string | number>): void {
  console.log(JSON.stringify({ t: new Date().toISOString(), ...fields }));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 1_000_000) req.destroy(); // input-size guard
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function json(res: ServerResponse, code: number, body: unknown): void {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

/** Build the HTTP handler. Routes:
 *   GET  /            → web chat test page (text-only rendering)
 *   GET  /healthz     → liveness
 *   POST /chat        → { message, sessionId } → grounded reply (browser testers)
 *   POST /telegram/<secret> → Telegram webhook
 */
export function createApp(deps: ServerDeps) {
  const webSession = deps.webSession ?? new SessionStore();
  const webLimiter = deps.webLimiter ?? new RateLimiter();
  const dailyCap = deps.dailyCap ?? new GlobalDailyCap();

  return async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const path = url.pathname;

    if (req.method === 'GET' && path === '/healthz') {
      return json(res, 200, { ok: true, provider: deps.provider.name, tools: deps.tools.length });
    }

    if (req.method === 'GET' && (path === '/' || path === '/index.html')) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(WEB_CHAT_HTML);
      return;
    }

    if (req.method === 'POST' && path === '/chat') {
      const body = await readBody(req).catch(() => '');
      let parsed: { message?: string; sessionId?: string };
      try {
        parsed = JSON.parse(body || '{}');
      } catch {
        return json(res, 400, { error: 'invalid json' });
      }
      const message = (parsed.message ?? '').toString().slice(0, 2000).trim();
      const sessionId = (parsed.sessionId ?? 'web-anon').toString().slice(0, 64);
      const ip = clientIp(req);
      if (!message) return json(res, 400, { error: 'empty message' });
      // Rate-limit by IP, not the client-supplied sessionId (which an abuser just
      // rotates). Then the global daily cap as a backstop against distributed spam.
      if (!webLimiter.allow(ip)) {
        logAccess({ ch: 'web', ip, msgLen: message.length, outcome: 'rate_limited' });
        return json(res, 429, { error: 'slow down' });
      }
      if (!dailyCap.allow()) {
        logAccess({ ch: 'web', ip, msgLen: message.length, outcome: 'daily_cap' });
        return json(res, 429, { error: 'busy — try again tomorrow' });
      }
      logAccess({ ch: 'web', ip, msgLen: message.length, outcome: 'ok' });

      const firstTurn = webSession.isFirstTurn(sessionId);
      const history = webSession.append(sessionId, { role: 'user', content: message });
      const reply = await respond(history, firstTurn, deps);
      webSession.append(sessionId, { role: 'assistant', content: reply.text });
      return json(res, 200, {
        text: reply.text,
        citations: reply.citations,
        display: formatReply(reply.text, reply.citations),
      });
    }

    if (req.method === 'POST' && deps.telegram && path === `/telegram/${deps.webhookSecret}`) {
      // Verify Telegram's secret-token header too (defense in depth).
      const headerSecret = req.headers['x-telegram-bot-api-secret-token'];
      if (deps.webhookSecret && headerSecret !== deps.webhookSecret) {
        return json(res, 403, { error: 'forbidden' });
      }
      const body = await readBody(req).catch(() => '');
      let update: TelegramUpdate;
      try {
        update = JSON.parse(body || '{}');
      } catch {
        return json(res, 400, { error: 'invalid json' });
      }
      // Ack fast; process without blocking Telegram's retry timer.
      json(res, 200, { ok: true });
      deps.telegram.handleUpdate(update).catch((e) => console.error('webhook handle', e));
      return;
    }

    json(res, 404, { error: 'not found' });
  };
}

export function startServer(deps: ServerDeps, port = Number(process.env.PORT ?? 3100)) {
  const handler = createApp(deps);
  const server = createServer((req, res) => {
    handler(req, res).catch((err) => {
      console.error('handler error', err);
      if (!res.headersSent) json(res, 500, { error: 'internal' });
    });
  });
  server.listen(port, () => console.log(`[tutor-bot] http://0.0.0.0:${port} (provider=${deps.provider.name})`));
  return server;
}
