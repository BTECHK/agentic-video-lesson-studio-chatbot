import { z } from 'zod';

export const CapabilityCategorySchema = z.enum([
  'writing-chat',
  'research',
  'file-analysis',
  'document-creation',
  'image-generation',
  'prototyping',
  'personalization',
  'persistent-context',
  'agents',
  'connectors',
  'dictation',
]);

export const CAPABILITY_CATEGORIES = CapabilityCategorySchema.options;

export type CapabilityCategory = z.infer<typeof CapabilityCategorySchema>;
