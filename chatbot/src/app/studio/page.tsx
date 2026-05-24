import { getLessonTimeline, listLessonIds } from '@/lib/lesson-timeline';
import { Timeline } from '@/components/studio/Timeline';

// Read live pipeline status (fresh/stale per artifact) on each request, rather
// than freezing it at build time — this is an oversight control plane.
export const dynamic = 'force-dynamic';

/** Studio control plane — multi-track timeline for the lesson-video pipeline. */
export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { lesson: requested } = await searchParams;
  const ids = listLessonIds();
  const lessonId = requested && ids.includes(requested) ? requested : ids[0] ?? 'module-1';
  const lesson = getLessonTimeline(lessonId);

  if (!lesson) {
    return (
      <main style={{ padding: '3rem 1.5rem', fontFamily: 'var(--font)' }}>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Studio</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          No lesson found. Plan a lesson (<code>npm run plan-lesson</code>) to populate the timeline.
        </p>
      </main>
    );
  }

  const regenEnabled = process.env.REGEN_TRIGGER_ENABLED === 'true';
  return <Timeline lesson={lesson} lessons={ids} regenEnabled={regenEnabled} />;
}
