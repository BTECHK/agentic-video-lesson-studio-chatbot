import { z } from 'zod';

export const SourceEntrySchema = z.object({
  id: z.string(),
  url: z.string().url(),
  title: z.string(),
});

export const SourceFileSchema = z.object({
  vendor: z.string(),
  sources: z.array(SourceEntrySchema).min(1),
});

export type SourceEntry = z.infer<typeof SourceEntrySchema>;
export type SourceFile = z.infer<typeof SourceFileSchema>;
