/**
 * Claude Code as judge — headless `claude -p --output-format json`, fed on stdin.
 * No ANTHROPIC_API_KEY: uses the host's logged-in Claude Code session (the proven
 * invocation from chatbot/src/lib/llm/claude-code-provider.ts). Shared by the
 * Gate C (gate-lesson) and Gate A/B (gate-review) runners.
 */
import { spawn } from 'node:child_process';

const DEFAULT_TIMEOUT_MS = 600_000; // agentic reviews read many files

/**
 * Judges whose Write tool is denied dump the verdict body behind a "Write was
 * blocked pending permission — here it is:" preamble, and format the verdict
 * line with drift ("## Verdict: PASS", "… → **Verdict: PASS**"). parseGateState
 * is strict (verdict must be the first non-empty line — Codex BLOCK finding,
 * 2026-07-15), so normalize at write time:
 *  1. already canonical → unchanged;
 *  2. a line that IS a (possibly #/**-decorated) Verdict line → slice from it,
 *     stripped to plain `Verdict: X`;
 *  3. verdict token only mid-line (heading style) → prepend extracted
 *     `Verdict: X`, keep the full body verbatim below;
 *  4. no verdict token at all → unchanged (parses as fix — fail-closed).
 */
export function stripJudgePreamble(md: string): string {
  const firstLine = md.split(/\r?\n/).find((l) => l.trim() !== '') ?? '';
  if (/^\s*verdict\s*[:-]/i.test(firstLine)) return md;
  const lineMatch = md.match(/^[#>*\s]*(verdict\s*[:-]?\s*(pass|fix|fail|warn))\b.*$/im);
  if (lineMatch) {
    const rest = md.slice(md.indexOf(lineMatch[0]) + lineMatch[0].length);
    return `Verdict: ${lineMatch[2].toUpperCase()}${rest}`;
  }
  const token = md.match(/verdict\s*[:-]?\s*(pass|fix|fail|warn)\b/i);
  if (token) return `Verdict: ${token[1].toUpperCase()}\n\n${md}`;
  return md;
}

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
        resolve(stripJudgePreamble(parsed.result));
      } catch {
        reject(new Error('claude output was not valid JSON'));
      }
    });
    child.stdin.write(prompt);
    child.stdin.end();
  });
}
