import React from 'react';
import { SCENE_TYPES, type SceneType } from '../../content/schemas/scene-types';
import type { NarrationWord } from '../../content/schemas/lesson';

export { SCENE_TYPES, type SceneType };

export interface SceneComponentProps {
  scene: {
    id: string;
    type: SceneType;
    start: number;
    duration: number;
    content: Record<string, unknown>;
    label?: string;
  };
  sceneStartFrame: number;
  /** v4-only: word-level narration timing, for scenes that word-sync their reveal (e.g. QuoteCard). Absent under v3. */
  narrationWords?: NarrationWord[];
  /** First-sim-scene-only honesty chip: true on the lesson's first sim scene, false on later ones; undefined (absent) still shows it, safe for scene-preview catalogs. hail-mary 2026-07-04. */
  showSimDisclaimer?: boolean;
}

export type SceneComponentFactory = React.FC<SceneComponentProps>;

export type SceneRegistry = Partial<Record<SceneType, SceneComponentFactory>>;
