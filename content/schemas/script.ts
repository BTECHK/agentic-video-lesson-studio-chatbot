import { z } from 'zod';
import { SceneTypeSchema } from './scene-types';

/**
 * Script schema (SCRIPT-01) — the talk track generated from an outline in Instructor's voice.
 * One block per intended scene. Narration is prose; contentRefs ground factual claims to
 * the codified fact source so the fact-check gate (SCRIPT-02) can verify them.
 *
 * contentRefs format:
 *   "tool:<toolId>"               e.g. "tool:claude"        — references a tool
 *   "cap:<toolId>:<category>"     e.g. "cap:claude:agents"  — references a tool capability record
 */

export const ScriptBlockSchema = z.object({
  id: z.string(),
  sectionId: z.string(),
  beatId: z.string(),
  sceneType: SceneTypeSchema,
  narration: z.string().min(1),
  contentRefs: z.array(z.string()).optional(),
  emphasisWords: z.array(z.string()).optional(),
});

export const ScriptMetaSchema = z.object({
  generatedAt: z.string(),
  styleSource: z.string().optional(),
  generator: z.string().optional(),
});

export const ScriptSchema = z.object({
  schemaVersion: z.literal('1.0'),
  lessonId: z.string(),
  blocks: z.array(ScriptBlockSchema).min(1),
  meta: ScriptMetaSchema,
});

export type ScriptBlock = z.infer<typeof ScriptBlockSchema>;
export type Script = z.infer<typeof ScriptSchema>;

const TOOL_REF = /^tool:([a-z0-9-]+)$/;
const CAP_REF = /^cap:([a-z0-9-]+):([a-z0-9-]+)$/;

export type ParsedRef =
  | { kind: 'tool'; toolId: string }
  | { kind: 'cap'; toolId: string; category: string }
  | { kind: 'invalid'; raw: string };

/** Parse a contentRef string into a structured ref. */
export function parseContentRef(ref: string): ParsedRef {
  const t = TOOL_REF.exec(ref);
  if (t) return { kind: 'tool', toolId: t[1] };
  const c = CAP_REF.exec(ref);
  if (c) return { kind: 'cap', toolId: c[1], category: c[2] };
  return { kind: 'invalid', raw: ref };
}
