/**
 * Studio timeline data layer (Phase G control plane).
 *
 * Pure transforms from a lesson.json document into the four-track `LessonTimeline`
 * the Studio renders, plus the shared time-axis math (px-per-second geometry,
 * adaptive ruler ticks, time formatting). No DOM, no fs — unit-tested in
 * test/studio-timeline.test.ts; the server loader supplies the lesson + statuses.
 */

/** Render frame rate — matches the Remotion pipeline (lesson.duration is in frames). */
export const FPS = 30;

/** A clip narrower than this is still given a tappable width. */
export const MIN_CLIP_PX = 24;

export type Status = 'fresh' | 'stale' | 'error';
export type ClipKind = 'animation' | 'voiceover' | 'script' | 'captions';

export interface Word {
  word: string;
  startMs: number;
  endMs: number;
}

interface Narration {
  text?: string;
  audioSrc?: string;
  words?: Word[];
}

interface Scene {
  id: string;
  type: string;
  start: number; // frames
  duration: number; // frames
  label?: string;
  narration?: Narration;
  content?: { narration?: Narration } & Record<string, unknown>;
}

export interface LessonDoc {
  id: string;
  lesson: { title?: string; duration: number };
  scenes: Scene[];
}

export interface AnimationPayload {
  sceneType: string;
  label: string;
}
export interface VoicePayload {
  audioSrc?: string;
}
export interface ScriptPayload {
  text: string;
}
export interface CaptionPayload {
  text: string;
}

export interface Clip {
  id: string;
  kind: ClipKind;
  startSec: number;
  durationSec: number;
  status: Status;
  staleReason?: string;
  label: string;
  payload: AnimationPayload | VoicePayload | ScriptPayload | CaptionPayload;
}

export interface LessonTimeline {
  id: string;
  title: string;
  durationSec: number;
  tracks: Record<ClipKind, Clip[]>;
}

export interface ClipStatus {
  status: Status;
  reason?: string;
}
/** Per-clip overrides keyed by clip id (e.g. "voice-intro"). Missing = fresh. */
export type StatusMap = Record<string, ClipStatus>;

export interface CaptionPage {
  text: string;
  startSec: number;
  endSec: number;
}

const framesToSec = (frames: number): number => frames / FPS;

const readNarration = (scene: Scene): Narration | undefined => {
  const n = scene.narration ?? scene.content?.narration;
  return n && typeof n.text === 'string' && n.text.trim().length > 0 ? n : undefined;
};

/** Group word timings into caption "pages": capped at maxWords, broken early at
 *  sentence-ending punctuation so a page reads as a complete thought. */
export function paginateCaptions(words: Word[], opts: { maxWords: number }): CaptionPage[] {
  const pages: CaptionPage[] = [];
  let group: Word[] = [];

  const flush = () => {
    if (group.length === 0) return;
    pages.push({
      text: group.map((w) => w.word).join(' '),
      startSec: group[0].startMs / 1000,
      endSec: group[group.length - 1].endMs / 1000,
    });
    group = [];
  };

  for (const w of words) {
    group.push(w);
    const endsSentence = /[.!?]$/.test(w.word);
    if (endsSentence || group.length >= opts.maxWords) flush();
  }
  flush();
  return pages;
}

const CAPTION_MAX_WORDS = 7;

/**
 * Build the four-track timeline. Every scene yields an animation clip; narrated
 * scenes additionally yield voiceover, script, and caption-page clips. `status`
 * overrides default each clip to 'fresh' (a healthy timeline is visually quiet).
 */
export function lessonToTimeline(lesson: LessonDoc, status: StatusMap = {}): LessonTimeline {
  const animation: Clip[] = [];
  const voiceover: Clip[] = [];
  const script: Clip[] = [];
  const captions: Clip[] = [];

  const stamp = (id: string): Pick<Clip, 'status' | 'staleReason'> => ({
    status: status[id]?.status ?? 'fresh',
    staleReason: status[id]?.reason,
  });

  for (const scene of lesson.scenes) {
    const startSec = framesToSec(scene.start);
    const durationSec = framesToSec(scene.duration);
    const label = scene.label ?? scene.id;

    const animId = `anim-${scene.id}`;
    animation.push({
      id: animId, kind: 'animation', startSec, durationSec, label,
      payload: { sceneType: scene.type, label }, ...stamp(animId),
    });

    const narration = readNarration(scene);
    if (!narration) continue;

    const voiceId = `voice-${scene.id}`;
    voiceover.push({
      id: voiceId, kind: 'voiceover', startSec, durationSec, label,
      payload: { audioSrc: narration.audioSrc }, ...stamp(voiceId),
    });

    const scriptId = `script-${scene.id}`;
    script.push({
      id: scriptId, kind: 'script', startSec, durationSec, label,
      payload: { text: narration.text! }, ...stamp(scriptId),
    });

    const pages = paginateCaptions(narration.words ?? [], { maxWords: CAPTION_MAX_WORDS });
    pages.forEach((page, i) => {
      const capId = `cap-${scene.id}-${i}`;
      captions.push({
        id: capId, kind: 'captions', startSec: page.startSec,
        durationSec: Math.max(page.endSec - page.startSec, 0), label: page.text,
        payload: { text: page.text }, ...stamp(capId),
      });
    });
  }

  return {
    id: lesson.id,
    title: lesson.lesson.title ?? lesson.id,
    durationSec: framesToSec(lesson.lesson.duration),
    tracks: { animation, voiceover, script, captions },
  };
}

// ── shared time-axis geometry ────────────────────────────────────────────────

export const clipLeft = (startSec: number, pxPerSec: number): number => startSec * pxPerSec;

export const clipWidth = (durationSec: number, pxPerSec: number): number =>
  Math.max(durationSec * pxPerSec, MIN_CLIP_PX);

/** Adaptive ruler spacing: denser ticks as the timeline zooms in. */
export function tickIntervalSec(pxPerSec: number): number {
  if (pxPerSec >= 40) return 1;
  if (pxPerSec >= 15) return 5;
  return 10;
}

export function formatTime(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
