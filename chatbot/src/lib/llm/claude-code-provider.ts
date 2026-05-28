import { spawn } from 'node:child_process';
import type { LLMProviderInterface, LLMRequest, LLMResponse, LLMMessage } from './types';
import { getSystemPrompt } from './system-prompt';
import { parseCitations } from '../citations';

// #63: free Tutor chat backend. Drives the headless Claude Code CLI
// (`claude -p --output-format json`) — no ANTHROPIC_API_KEY, uses the host's
// logged-in Claude Code session. Higher latency / no streaming, accepted per
// .planning/DECISIONS.md (Option B). The CLI runner is injected so the provider
// logic is testable without spawning a real process.
//
// NOTE: this needs the `claude` CLI + an authed session on the host. It works
// where the app runs via `npm run dev` (the demo host), not inside the chatbot
// Docker image — hence docker-compose keeps LLM_PROVIDER=mock by default.

export type ClaudeRunner = (prompt: string, signal: AbortSignal) => Promise<string>;

const CLAUDE_TIMEOUT_MS = 120_000;

/**
 * Real runner: one-shot headless Claude. The prompt is fed on stdin (never as an
 * arg), so untrusted user/content text cannot break out into the shell. shell:true
 * lets Windows resolve the `claude.cmd` shim (spawn ENOENT otherwise) — mirrors the
 * proven invocation in scripts/generate-script-headless.ts.
 */
const defaultRunner: ClaudeRunner = (prompt, signal) =>
  new Promise((resolve, reject) => {
    const child = spawn('claude', ['-p', '--output-format', 'json'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      windowsHide: true,
      signal,
    });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolve(out)
        : reject(new Error(`claude exited ${code}: ${err.slice(0, 300)}`)),
    );
    child.stdin.write(prompt);
    child.stdin.end();
  });

interface ClaudeEnvelope {
  result?: string;
  is_error?: boolean;
  subtype?: string;
}

/** Extract the assistant's reply from `claude -p --output-format json` stdout. */
export function extractClaudeResult(stdout: string): string {
  let parsed: ClaudeEnvelope;
  try {
    parsed = JSON.parse(stdout) as ClaudeEnvelope;
  } catch {
    throw new Error('claude output was not valid JSON');
  }
  if (parsed.is_error || (parsed.subtype && parsed.subtype !== 'success')) {
    throw new Error(`claude returned an error result: ${parsed.subtype ?? 'unknown'}`);
  }
  if (typeof parsed.result !== 'string' || parsed.result.length === 0) {
    throw new Error('claude result was empty');
  }
  return parsed.result;
}

/** Flatten the system prompt + conversation into a single one-shot prompt. */
export function buildChatPrompt(messages: LLMMessage[], systemPrompt: string): string {
  const transcript = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
    .join('\n\n');
  return (
    `${systemPrompt}\n\n` +
    `# Conversation so far\n${transcript}\n\n` +
    `Reply as Tutor to the student's latest message. Output ONLY your reply text ` +
    `(with inline [Source: ...] citations where grounded) — no preamble, no JSON, no code fences.`
  );
}

export class ClaudeCodeProvider implements LLMProviderInterface {
  constructor(private readonly runner: ClaudeRunner = defaultRunner) {}

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const systemPrompt = getSystemPrompt(request.accessMode, request.contentContext, request.mode);
    const prompt = buildChatPrompt(request.messages, systemPrompt);

    // Bound the call so a hung CLI process can't hang the request forever.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CLAUDE_TIMEOUT_MS);
    let stdout: string;
    try {
      stdout = await this.runner(prompt, controller.signal);
    } finally {
      clearTimeout(timer);
    }

    const content = extractClaudeResult(stdout);
    const { citations } = parseCitations(content);
    return { content, citations };
  }
}
