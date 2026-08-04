import { z } from 'zod';
import { SceneTypeSchema, SCENE_CONTENT_SCHEMAS, type SceneType } from './scene-types';

export const LessonMetaSchema = z.object({
  createdAt: z.string(),
  lastUpdated: z.string(),
  authors: z.array(z.string()),
  factCheckedAt: z.string().nullable(),
});

export const LessonInfoSchema = z.object({
  title: z.string(),
  topic: z.string(),
  module: z.string(),
  duration: z.number(),
  brandLabel: z.string().optional(),
  motionProfile: z.enum(['v3', 'v4']).optional(),
});

export const NarrationWordSchema = z.object({
  word: z.string(),
  startMs: z.number(),
  endMs: z.number(),
});

export const NarrationSchema = z.object({
  text: z.string(),
  audioSrc: z.string().optional(),
  words: z.array(NarrationWordSchema).optional(),
});

/** Subtle per-scene Ken Burns zoom. Bounds keep text inside the safe area
 * (Gate L measures post-transform rects, so violations still get caught). */
export const SceneZoomSchema = z.object({
  from: z.number().min(0.85).max(1.2),
  to: z.number().min(0.85).max(1.2),
});

export const SceneBaseSchema = z.object({
  id: z.string(),
  type: SceneTypeSchema,
  start: z.number(),
  duration: z.number(),
  label: z.string().optional(),
  content: z.record(z.string(), z.unknown()),
  narration: NarrationSchema.optional(),
  zoom: SceneZoomSchema.optional(),
}).superRefine((scene, ctx) => {
  const contentSchema = SCENE_CONTENT_SCHEMAS[scene.type as SceneType];
  if (contentSchema) {
    const result = contentSchema.safeParse(scene.content);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: issue.message,
          path: ['content', ...issue.path],
        });
      }
    }
  }
});

export const LessonSchema = z
  .object({
    schemaVersion: z.literal('1.0'),
    id: z.string(),
    lesson: LessonInfoSchema,
    scenes: z.array(SceneBaseSchema).min(1),
    speakerNotes: z.array(z.string()).optional(),
    meta: LessonMetaSchema,
  })
  .superRefine((data, ctx) => {
    const { scenes, lesson } = data;

    // scenes[0].start must be 0
    if (scenes[0].start !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `First scene must start at 0, got ${scenes[0].start}`,
        path: ['scenes', 0, 'start'],
      });
    }

    // Adjacent scenes must be contiguous (no gaps, no overlaps)
    for (let i = 0; i < scenes.length - 1; i++) {
      const expectedStart = scenes[i].start + scenes[i].duration;
      if (scenes[i + 1].start !== expectedStart) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Scene ${i + 1} should start at ${expectedStart}, got ${scenes[i + 1].start}`,
          path: ['scenes', i + 1, 'start'],
        });
      }
    }

    // lesson.duration must equal last scene end
    const lastScene = scenes[scenes.length - 1];
    const expectedDuration = lastScene.start + lastScene.duration;
    if (lesson.duration !== expectedDuration) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `lesson.duration should be ${expectedDuration}, got ${lesson.duration}`,
        path: ['lesson', 'duration'],
      });
    }
  });

export type LessonMeta = z.infer<typeof LessonMetaSchema>;
export type LessonInfo = z.infer<typeof LessonInfoSchema>;
export type SceneBase = z.infer<typeof SceneBaseSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type NarrationWord = z.infer<typeof NarrationWordSchema>;
export type Narration = z.infer<typeof NarrationSchema>;
