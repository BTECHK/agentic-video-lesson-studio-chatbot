import { SceneType, SceneComponentFactory, SceneRegistry, SCENE_TYPES } from './scene-types';

const registry: SceneRegistry = {};

export function registerSceneComponent(
  type: SceneType,
  component: SceneComponentFactory,
): void {
  if (registry[type]) {
    throw new Error(`Scene component already registered for type: ${type}`);
  }
  registry[type] = component;
}

export function getSceneComponent(type: string): SceneComponentFactory | null {
  if (!SCENE_TYPES.includes(type as SceneType)) {
    return null;
  }
  return registry[type as SceneType] ?? null;
}

export function getRegisteredTypes(): SceneType[] {
  return Object.keys(registry) as SceneType[];
}

export function clearRegistry(): void {
  for (const key of Object.keys(registry)) {
    delete registry[key as SceneType];
  }
}
