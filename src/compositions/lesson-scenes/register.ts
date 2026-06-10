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
import { ComparisonChats } from './ComparisonChats';
import { SetupChecklist } from './SetupChecklist';
import { VoiceDemo } from './VoiceDemo';
import { DemoCue } from './DemoCue';
import { DigDeeper } from './DigDeeper';
import { ToolDemo } from './ToolDemo';
import { AuditQuadrant } from './AuditQuadrant';

/**
 * Register every lesson scene component with the dispatcher (all 14 scene
 * types). Idempotent — safe to call on HMR re-import and from tests (skips
 * types already registered rather than throwing on the duplicate).
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
    'comparison-chats': ComparisonChats,
    'setup-checklist': SetupChecklist,
    'voice-demo': VoiceDemo,
    'demo-cue': DemoCue,
    'dig-deeper': DigDeeper,
    'tool-demo': ToolDemo,
    'audit-quadrant': AuditQuadrant,
  };
  for (const [type, component] of Object.entries(components)) {
    if (getSceneComponent(type) === null) {
      registerSceneComponent(type as SceneType, component!);
    }
  }
}
