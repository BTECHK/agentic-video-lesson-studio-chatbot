/**
 * Claude Code as judge — headless `claude -p --output-format json`, fed on stdin.
 * No ANTHROPIC_API_KEY: uses the host's logged-in Claude Code session (the proven
 * invocation from chatbot/src/lib/llm/claude-code-provider.ts). Shared by the
 * Gate C (gate-lesson) and Gate A/B (gate-review) runners.
 */
import { spawn } from 'node:child_process';

const DEFAULT_TIMEOUT_MS = 600_000; // agentic reviews read many files

export function judgeViaClaudeCode(prompt: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<string> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    // --allowedTools: headless -p denies un-granted tools silently in non-interactive
    // mode — without this, Gate A judges could never reach vendor docs and returned
    // "couldn't verify" FIXes on accurate content (round-2 incident, 2026-07-15).
    const child = spawn('claude', ['-p', '--output-format', 'json', '--allowedTools', 'WebFetch', 'WebSearch'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      windowsHide: true,
      signal: controller.signal,
    });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', reject);
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`claude exited ${code}: ${err.slice(0, 300)}`));
      try {
        const parsed = JSON.parse(out) as { result?: string; is_error?: boolean; subtype?: string };
        if (parsed.is_error || (parsed.subtype && parsed.subtype !== 'success')) {
          return reject(new Error(`claude returned an error result: ${parsed.subtype ?? 'unknown'}`));
        }
        if (typeof parsed.result !== 'string' || parsed.result.length === 0) {
          return reject(new Error('claude result was empty'));
        }
        resolve(parsed.result);
      } catch {
        reject(new Error('claude output was not valid JSON'));
      }
    });
    child.stdin.write(prompt);
    child.stdin.end();
  });
}
