import { z } from 'zod';

/**
 * Trigger for the Studio control plane's regenerate loop (CTRL-03). A comment on
 * a clip is direction for the AI; sending it kicks the lesson's content-hash
 * regeneration DAG (scripts/regenerate.ts), which surgically rebuilds whatever
 * is stale and flips the affected clips back to fresh.
 */
export const RegenTriggerSchema = z.object({
  lessonId: z.string().min(1),
  sceneId: z.string().optional(),
  comment: z.string().optional(),
});

export type RegenTrigger = z.infer<typeof RegenTriggerSchema>;

// Lesson ids (and scene ids) are lowercase alphanumeric + hyphen (matches
// content/lessons/<id> dir naming) — guards against path traversal / shell
// injection before spawn.
const LESSON_PATTERN = /^[a-z0-9-]+$/;

/**
 * Safe CLI args for `npx tsx scripts/regenerate.ts <lessonId> [--scene <id>] [--comment <text>]`.
 *
 * When a clip `comment` is present it is direction for the AI: regenerate.ts runs
 * the AI-edit step (#18) before the deterministic rebuild. The id fields are pattern-
 * validated; the comment is free text passed as a discrete argv element (no shell).
 */
export function buildRegenArgs(trigger: { lessonId: string; sceneId?: string; comment?: string }): string[] {
  if (!LESSON_PATTERN.test(trigger.lessonId)) {
    throw new Error(`invalid lessonId: ${trigger.lessonId}`);
  }
  if (trigger.sceneId !== undefined && !LESSON_PATTERN.test(trigger.sceneId)) {
    throw new Error(`invalid sceneId: ${trigger.sceneId}`);
  }
  const args = [trigger.lessonId];
  if (trigger.sceneId) args.push('--scene', trigger.sceneId);
  if (trigger.comment) args.push('--comment', trigger.comment);
  return args;
}
