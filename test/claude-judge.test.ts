import { describe, it, expect } from 'vitest';
import { stripJudgePreamble } from '../src/lib/claude-judge';

// Codex BLOCK finding 2026-07-15: judges with a denied Write tool prefix the
// verdict body with wrapper prose ("Write was blocked pending permission…"),
// which banks an invalid-looking gate artifact whose embedded Verdict still
// parses. The harness must strip everything before the first Verdict: line.
describe('stripJudgePreamble', () => {
  it('strips wrapper prose before the first Verdict: line', () => {
    const md = 'The judge output is below. Write was blocked pending permission:\n\n---\n\nVerdict: PASS\n\n## Frames inspected\nbody';
    expect(stripJudgePreamble(md)).toBe('Verdict: PASS\n\n## Frames inspected\nbody');
  });

  it('leaves an already-clean artifact unchanged', () => {
    const md = 'Verdict: FIX\n\n## Fix-list\n1. thing';
    expect(stripJudgePreamble(md)).toBe(md);
  });

  it('does not match Verdict mentioned mid-line in the preamble', () => {
    const md = 'preamble says the Verdict: is below\nVerdict: PASS\nbody';
    expect(stripJudgePreamble(md)).toBe('Verdict: PASS\nbody');
  });

  it('returns input unchanged when no Verdict line exists (parses as missing)', () => {
    const md = 'I could not complete the review.';
    expect(stripJudgePreamble(md)).toBe(md);
  });

  it('normalizes a markdown-decorated Verdict line (## Verdict: PASS)', () => {
    const md = 'The write is pending approval.\n\n## Verdict: PASS\n\nbody';
    expect(stripJudgePreamble(md)).toBe('Verdict: PASS\n\nbody');
  });

  it('extracts a heading-embedded verdict and keeps the body verbatim (t1l4 style)', () => {
    const md = '## Gate C — Watch gate · topic-1-lesson-4 → **Verdict: PASS**\n\nbody';
    const out = stripJudgePreamble(md);
    expect(out.startsWith('Verdict: PASS')).toBe(true);
    expect(out).toContain('body');
  });

  it('keeps WARN as WARN (not-green under parseGateState, by design)', () => {
    const md = 'preamble\n\n## Verdict: WARN\n\nbody';
    expect(stripJudgePreamble(md)).toBe('Verdict: WARN\n\nbody');
  });
});
