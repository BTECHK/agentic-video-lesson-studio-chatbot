import { registerSceneComponent, getSceneComponent } from '../../lib/scene-dispatcher';
import type { SceneType, SceneComponentFactory } from '../../lib/scene-types';
import { Cover } from './Cover';
import { QuoteCard } from './QuoteCard';
import { PreviewBand } from './PreviewBand';
import { JourneyMap } from './JourneyMap';
import { ToolCardReveal } from './ToolCardReveal';
import { CapabilityTable } from './CapabilityTable';
import { FeatureGrid } from './FeatureGrid';
import { RecapGrid } from './RecapGrid';
import { AssignmentList } from './AssignmentList';

/**
 * Register every Module-1 lesson scene component with the dispatcher.
 * Idempotent — safe to call on HMR re-import and from tests (skips types
 * already registered rather than throwing on the duplicate).
 */
export function registerLessonScenes(): void {
  const components: Partial<Record<SceneType, SceneComponentFactory>> = {
    'cover': Cover,
    'quote-card': QuoteCard,
    'preview-band': PreviewBand,
    'journey-map': JourneyMap,
    'tool-card-reveal': ToolCardReveal,
    'capability-table': CapabilityTable,
    'feature-grid': FeatureGrid,
    'recap-grid': RecapGrid,
    'assignment-list': AssignmentList,
  };
  for (const [type, component] of Object.entries(components)) {
    if (getSceneComponent(type) === null) {
      registerSceneComponent(type as SceneType, component!);
    }
  }
}
