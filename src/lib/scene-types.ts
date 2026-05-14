import React from 'react';
import { SCENE_TYPES, type SceneType } from '../../content/schemas/scene-types';

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
}

export type SceneComponentFactory = React.FC<SceneComponentProps>;

export type SceneRegistry = Partial<Record<SceneType, SceneComponentFactory>>;
