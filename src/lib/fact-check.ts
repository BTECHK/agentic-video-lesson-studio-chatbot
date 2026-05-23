import { parseContentRef, type Script } from '../../content/schemas/script';
import type { GroundingContext } from './grounding';

/**
 * Fact-check gate (SCRIPT-02) — every contentRef in a generated script must resolve to a real
 * record in the grounding context (loaded from content/tools/*.json). Refs that don't resolve
 * are flagged for human review and MUST block the pipeline (audit-integrity P0: never narrate an
 * unverifiable claim). A capability ref that resolves but is unsupported is NOT an error — Instructor
 * legitimately teaches what tools cannot do (e.g. "Claude has no dictation") — but it is reported
 * so the script generator can phrase it correctly.
 */

export interface FactCheckFlag {
  blockId: string;
  ref: string;
  reason: string;
}

export interface FactCheckNote {
  blockId: string;
  ref: string;
  note: string;
}

export interface FactCheckResult {
  ok: boolean;
  verifiedRefs: number;
  flags: FactCheckFlag[];
  /** non-blocking observations (e.g. references to an unsupported capability) */
  notes: FactCheckNote[];
}

export function factCheckScript(script: Script, grounding: GroundingContext): FactCheckResult {
  const flags: FactCheckFlag[] = [];
  const notes: FactCheckNote[] = [];
  let verifiedRefs = 0;

  for (const block of script.blocks) {
    for (const ref of block.contentRefs ?? []) {
      const parsed = parseContentRef(ref);
      if (parsed.kind === 'invalid') {
        flags.push({ blockId: block.id, ref, reason: 'malformed contentRef (expected "tool:<id>" or "cap:<id>:<category>")' });
        continue;
      }
      if (parsed.kind === 'tool') {
        if (!grounding.tools[parsed.toolId]) {
          flags.push({ blockId: block.id, ref, reason: `unknown tool "${parsed.toolId}" — not in grounding context` });
          continue;
        }
        verifiedRefs++;
        continue;
      }
      // cap ref
      const key = `${parsed.toolId}:${parsed.category}`;
      const cap = grounding.capabilities[key];
      if (!cap) {
        flags.push({ blockId: block.id, ref, reason: `capability "${parsed.category}" for tool "${parsed.toolId}" not in grounding context` });
        continue;
      }
      verifiedRefs++;
      if (!cap.supported) {
        notes.push({ blockId: block.id, ref, note: `"${cap.toolName}" does not support "${parsed.category}" — narration must frame this as a limitation, not a feature` });
      }
    }
  }

  return { ok: flags.length === 0, verifiedRefs, flags, notes };
}
