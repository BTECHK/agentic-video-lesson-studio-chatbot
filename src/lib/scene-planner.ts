import type { Script, ScriptBlock } from '../../content/schemas/script';
import type { Outline } from '../../content/schemas/outline';
import type { Lesson, SceneType } from '../../content/schemas/index';
import type { GroundingContext } from './grounding';

/**
 * Scene planner (PLAN-01) — maps a generated script.json into a LessonSchema-valid lesson.json(draft).
 *
 * Timing: this is the PRE-AUDIO estimate pass (research §3). Durations are estimated from narration
 * word count at a teaching WPM, floored per scene type so a short line never out-paces the reveal
 * animation. Phase E replaces these estimates with measured audio durations (the authoritative pass).
 *
 * Content: data-heavy scenes (tool-card-reveal, capability-table, feature-grid) are derived
 * deterministically from the grounding facts, so they stay correct and regenerate when facts change.
 * Copy scenes (cover, quote-card, etc.) derive their text from the outline + script.
 */

export const FPS = 30;
export const WPM = 150;

/** Per-scene-type minimum on-screen duration (seconds) so reveals can complete. */
export const MIN_SECONDS: Partial<Record<SceneType, number>> = {
  cover: 4,
  'journey-map': 5,
  'tool-card-reveal': 5,
  'capability-table': 6,
  'feature-grid': 6,
  'recap-grid': 5,
  'assignment-list': 5,
  'quote-card': 4,
  'preview-band': 3,
};
export const DEFAULT_MIN_SECONDS = 3;

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Estimate scene duration in frames from narration length, floored by scene type. */
export function estimateDurationFrames(
  text: string,
  type: SceneType,
  fps: number = FPS,
  wpm: number = WPM,
): number {
  const words = countWords(text);
  const spokenSeconds = (words / wpm) * 60;
  const padSeconds = 0.6; // brief settle before/after speech
  const floor = MIN_SECONDS[type] ?? DEFAULT_MIN_SECONDS;
  const seconds = Math.max(spokenSeconds + padSeconds, floor);
  return Math.ceil(seconds * fps);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const titleCase = (s: string) => s.split('-').map(cap).join(' ');

/** Map a tool's support of a capability to a capability-table cell value. */
function cellFor(grounding: GroundingContext, toolId: string, category: string): 'B' | 'Y' | 'L' | '-' {
  const c = grounding.capabilities[`${toolId}:${category}`];
  if (!c) return '-';
  return c.supported ? 'Y' : '-';
}

/**
 * Build the scene `content` for a block. Data scenes pull from grounding; copy scenes derive from
 * the outline/script. Returns content shaped for the block's scene type's Zod schema.
 */
export function buildSceneContent(
  block: ScriptBlock,
  outline: Outline,
  grounding: GroundingContext,
): Record<string, unknown> {
  const section = outline.sections.find((s) => s.id === block.sectionId);
  const eyebrow = outline.lesson.module;
  const toolIds = Object.keys(grounding.tools);

  switch (block.sceneType) {
    case 'cover':
      return {
        eyebrow,
        title: outline.lesson.title.split(' + ').map((s) => s.trim()),
        sub: outline.audience ?? outline.lesson.topic,
      };

    case 'quote-card':
      return {
        eyebrow: section?.title ?? eyebrow,
        quote: block.narration,
        attribution: 'Course Instructor, Sample Academy',
      };

    case 'preview-band':
      return { eyebrow: section?.title ?? eyebrow, title: outline.lesson.title };

    case 'journey-map':
      return {
        eyebrow,
        title: section?.title ?? 'Your AI journey',
        sub: section?.objective ?? '',
        stops: [
          { id: 'meet', label: 'Step 1', title: 'Meet the assistants', state: 'active' },
          { id: 'compare', label: 'Step 2', title: 'Compare what they do', state: 'todo' },
          { id: 'personalize', label: 'Step 3', title: 'Personalize one', state: 'todo' },
          { id: 'practice', label: 'Step 4', title: 'Practice this week', state: 'todo' },
        ],
      };

    case 'tool-card-reveal':
      return {
        eyebrow,
        title: section?.title ?? 'The tools you should know',
        sub: 'Different strengths, same basics. Pick one and start.',
        tools: toolIds.map((id) => {
          const t = grounding.tools[id];
          return {
            id,
            name: t.name,
            logo: id,
            tag: t.vendor,
            oneliner: t.description.split(/[.,]/)[0].slice(0, 80),
          };
        }),
      };

    case 'capability-table': {
      const categories = Array.from(
        new Set(
          Object.values(grounding.capabilities).map((c) => c.category),
        ),
      );
      return {
        eyebrow,
        title: section?.title ?? 'Capability comparison',
        footnote: 'Find the row for the job you do most. The basics are the same everywhere.',
        headers: toolIds.map((id) => grounding.tools[id].name),
        rows: categories.map((category) => ({
          id: category,
          label: titleCase(category),
          cells: toolIds.map((id) => cellFor(grounding, id, category)),
        })),
      };
    }

    case 'feature-grid': {
      const features = [
        { id: 'about-you', cat: 'personalization', title: 'Tell it about you', sub: 'Your role, your audience, and the work you do most.' },
        { id: 'answer-style', cat: 'personalization', title: 'Set the answer style', sub: 'Default length, tone, and format for replies.' },
        { id: 'memory', cat: 'persistent-context', title: 'Let it remember', sub: 'Memory carries what it learns from one chat to the next.' },
        { id: 'project-space', cat: 'persistent-context', title: 'Keep a project space', sub: 'Group related chats, files, and instructions in one place.' },
      ];
      return {
        eyebrow,
        title: section?.title ?? 'Set it up once',
        features: features.map((f, i) => ({
          id: f.id,
          n: String(i + 1).padStart(2, '0'),
          cat: titleCase(f.cat),
          title: f.title,
          sub: f.sub,
          focusAt: 0,
        })),
      };
    }

    case 'recap-grid':
      return {
        eyebrow,
        title: section?.title ?? "What you've got now",
        cards: [
          { id: 'meet', n: '01', title: 'Four assistants', body: 'Different strengths, same basics.' },
          { id: 'compare', n: '02', title: 'An honest comparison', body: 'Row by row, limitations included.' },
          { id: 'personalize', n: '03', title: 'Set up once', body: 'Personalization and persistent context switched on.' },
        ],
        preview: { eyebrow: 'Next up', title: 'Writing clear prompts' },
      };

    case 'assignment-list':
      return {
        eyebrow,
        title: section?.title ?? 'Your assignment',
        sub: 'Small steps. Seven days.',
        tasks: [
          { id: 'choose', bold: 'Choose one assistant', context: 'and use it for seven days.' },
          { id: 'personalize', bold: 'Fill in personalization', context: 'your role, audience, and answer style.' },
          { id: 'remember', bold: 'Turn on memory or a project space', context: 'so context carries between chats.' },
          { id: 'weekly-task', bold: 'Pick one weekly task', context: 'and do it with the assistant twice.' },
        ],
        callout: { label: 'Remember', body: 'The assistant drafts. You decide.' },
      };

    default:
      // generic fallback: minimal valid content for unmapped types
      return { eyebrow, title: section?.title ?? outline.lesson.title, sub: '' };
  }
}

export interface PlanOptions {
  fps?: number;
  wpm?: number;
}

/**
 * Produce a lesson.json(draft) object from a script + outline + grounding. Durations are estimated;
 * starts are contiguous from 0; lesson.duration is the sum — exactly what LessonSchema validates.
 */
export function planLesson(
  script: Script,
  outline: Outline,
  grounding: GroundingContext,
  opts: PlanOptions = {},
): Lesson {
  const fps = opts.fps ?? FPS;
  const wpm = opts.wpm ?? WPM;

  let cursor = 0;
  const scenes = script.blocks.map((block) => {
    const duration = estimateDurationFrames(block.narration, block.sceneType, fps, wpm);
    const start = cursor;
    cursor += duration;
    return {
      id: block.id,
      type: block.sceneType,
      start,
      duration,
      label: block.sectionId,
      content: buildSceneContent(block, outline, grounding),
      narration: { text: block.narration },
    };
  });

  return {
    schemaVersion: '1.0',
    id: script.lessonId,
    lesson: {
      title: outline.lesson.title,
      topic: outline.lesson.topic,
      module: outline.lesson.module,
      duration: cursor,
    },
    scenes,
    meta: {
      createdAt: outline.meta.createdAt,
      lastUpdated: new Date().toISOString().slice(0, 10),
      authors: outline.meta.authors,
      factCheckedAt: null,
    },
  } as Lesson;
}
