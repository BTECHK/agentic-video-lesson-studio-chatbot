import type { SceneType } from '../schemas/scene-types';

export interface ContentSceneMapping {
  contentType: 'tool-capability' | 'tool-meta' | 'source';
  contentPath: string;
  affectedSceneTypes: SceneType[];
  reason: string;
}

export const CONTENT_SCENE_MAPPINGS: ContentSceneMapping[] = [
  {
    contentType: 'tool-capability',
    contentPath: 'capabilities.*',
    affectedSceneTypes: [
      'capability-table',
      'feature-grid',
      'comparison-chats',
      'tool-card-reveal',
    ],
    reason:
      'Capability data feeds the main comparison and feature display scenes',
  },
  {
    contentType: 'tool-meta',
    contentPath: 'name',
    affectedSceneTypes: [
      'tool-card-reveal',
      'comparison-chats',
      'capability-table',
    ],
    reason: 'Tool name appears in card headers, chat labels, and table headers',
  },
  {
    contentType: 'tool-meta',
    contentPath: 'description',
    affectedSceneTypes: [
      'tool-card-reveal',
      'comparison-chats',
      'capability-table',
    ],
    reason:
      'Tool description shown in card reveals and used for comparison context',
  },
  {
    contentType: 'tool-capability',
    contentPath: 'capabilities.writing-chat',
    affectedSceneTypes: ['comparison-chats'],
    reason: 'Writing-chat capability drives the chat comparison scenes',
  },
  {
    contentType: 'tool-capability',
    contentPath: 'capabilities.dictation',
    affectedSceneTypes: ['voice-demo'],
    reason: 'Dictation capability is the data source for voice demo scenes',
  },
  {
    contentType: 'tool-capability',
    contentPath: 'capabilities',
    affectedSceneTypes: ['setup-checklist'],
    reason:
      'Any capability change may affect which tools appear in setup checklists',
  },
  {
    contentType: 'source',
    contentPath: 'sourceRefs',
    affectedSceneTypes: ['dig-deeper'],
    reason: 'Source references feed the dig-deeper citation scenes',
  },
];

/**
 * Given a list of changed content paths, return deduplicated scene types
 * that need re-rendering.
 *
 * Uses prefix matching: a mapping with contentPath "capabilities.*" matches
 * any changedPath starting with "capabilities.".
 */
export function getAffectedScenes(
  changedPaths: string[],
): SceneType[] {
  const affected = new Set<SceneType>();

  for (const changedPath of changedPaths) {
    for (const mapping of CONTENT_SCENE_MAPPINGS) {
      if (matchesPath(mapping.contentPath, changedPath)) {
        for (const scene of mapping.affectedSceneTypes) {
          affected.add(scene);
        }
      }
    }
  }

  return [...affected];
}

/**
 * Reverse lookup: given a scene type, return all content paths whose
 * mappings include that scene type.
 */
export function getToolsAffectingScene(sceneType: SceneType): string[] {
  return CONTENT_SCENE_MAPPINGS.filter((m) =>
    m.affectedSceneTypes.includes(sceneType),
  ).map((m) => m.contentPath);
}

/**
 * Prefix matching for content paths.
 * - "capabilities.*" matches "capabilities.writing-chat", "capabilities.dictation", etc.
 * - "capabilities" matches "capabilities" and "capabilities.anything"
 * - "name" matches "name" exactly
 * - "capabilities.writing-chat" matches "capabilities.writing-chat" exactly
 */
function matchesPath(mappingPath: string, changedPath: string): boolean {
  // Wildcard: "capabilities.*" matches any "capabilities.X"
  if (mappingPath.endsWith('.*')) {
    const prefix = mappingPath.slice(0, -1); // "capabilities."
    return changedPath.startsWith(prefix);
  }

  // Exact match
  if (mappingPath === changedPath) {
    return true;
  }

  // Prefix match: "capabilities" matches "capabilities.writing-chat"
  if (changedPath.startsWith(mappingPath + '.')) {
    return true;
  }

  return false;
}
