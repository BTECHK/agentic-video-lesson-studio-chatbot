import { z } from 'zod';
import {
  CoverContentSchema,
  QuoteCardContentSchema,
  PreviewBandContentSchema,
  JourneyMapContentSchema,
  ToolCardRevealContentSchema,
  CapabilityTableContentSchema,
  FeatureGridContentSchema,
  RecapGridContentSchema,
  AssignmentListContentSchema,
  ComparisonChatsContentSchema,
  SetupChecklistContentSchema,
  VoiceDemoContentSchema,
  DemoCueContentSchema,
} from '../../../content/schemas/scene-types';

// Inferred content types for the 14 scene types. Lesson-level validation
// (LessonSchema.superRefine) already guarantees each scene's `content` matches
// its schema, so components cast rather than re-parse.
export type CoverContent = z.infer<typeof CoverContentSchema>;
export type QuoteCardContent = z.infer<typeof QuoteCardContentSchema>;
export type PreviewBandContent = z.infer<typeof PreviewBandContentSchema>;
export type JourneyMapContent = z.infer<typeof JourneyMapContentSchema>;
export type ToolCardRevealContent = z.infer<typeof ToolCardRevealContentSchema>;
export type CapabilityTableContent = z.infer<typeof CapabilityTableContentSchema>;
export type FeatureGridContent = z.infer<typeof FeatureGridContentSchema>;
export type RecapGridContent = z.infer<typeof RecapGridContentSchema>;
export type AssignmentListContent = z.infer<typeof AssignmentListContentSchema>;
export type ComparisonChatsContent = z.infer<typeof ComparisonChatsContentSchema>;
export type SetupChecklistContent = z.infer<typeof SetupChecklistContentSchema>;
export type VoiceDemoContent = z.infer<typeof VoiceDemoContentSchema>;
export type DemoCueContent = z.infer<typeof DemoCueContentSchema>;
