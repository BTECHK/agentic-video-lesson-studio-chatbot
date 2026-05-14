import React from 'react';

export const SCENE_TYPES = [
  'cover',
  'journey-map',
  'comparison-chats',
  'tool-card-reveal',
  'capability-table',
  'setup-checklist',
  'feature-grid',
  'voice-demo',
  'recap-grid',
  'preview-band',
  'demo-cue',
  'dig-deeper',
  'assignment-list',
  'quote-card',
] as const;

export type SceneType = (typeof SCENE_TYPES)[number];

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
