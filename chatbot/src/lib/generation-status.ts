/**
 * Pure status resolver for the decoupled Studio Generate job (#44).
 *
 * Generation runs as a detached background child, not coupled to the HTTP
 * request, so navigating away no longer kills it. The status file records the
 * job; this function maps the file + filesystem facts to a settled state. It
 * deliberately has NO fs/Next imports so it is trivially unit-testable — the
 * route does the fs reads and the pid-liveness probe and feeds the booleans in.
 */

/** Settled states surfaced to the client. */
export type GenerationStatus = 'idle' | 'running' | 'done' | 'error' | 'canceled';

/** What the on-disk status file may declare. */
export type RecordedStatus = 'running' | 'done' | 'error' | 'canceled';

export interface ResolveInput {
  /** false when there is no status file at all → idle. */
  hasStatusFile: boolean;
  /** The `status` field recorded in the file (when hasStatusFile). */
  recorded?: RecordedStatus;
  /** Whether the recorded pid is still alive (process.kill(pid, 0) succeeded). */
  pidAlive: boolean;
  /** Whether script.draft.json exists on disk. */
  draftExists: boolean;
  /** mtime of the draft in ms (0/undefined if none). */
  draftMtimeMs?: number;
  /** startedAt of the job in ms. */
  startedAtMs?: number;
}

/**
 * Resolve the real generation state from the status file + filesystem facts.
 *
 *  - no status file                                  → idle
 *  - recorded done/error/canceled                    → returned as-is (terminal)
 *  - recorded running + pid alive                     → running
 *  - recorded running + pid dead + fresh draft        → done
 *  - recorded running + pid dead + no fresh draft     → error
 *
 * A draft is "fresh" when it exists and is newer than the job's startedAt
 * (so a stale draft from a previous run is not mistaken for this run's output).
 */
export function resolveGenerationStatus(input: ResolveInput): GenerationStatus {
  if (!input.hasStatusFile) return 'idle';

  const recorded = input.recorded;
  if (recorded === 'done' || recorded === 'error' || recorded === 'canceled') {
    return recorded;
  }

  // recorded === 'running'
  if (input.pidAlive) return 'running';

  const draftFresh =
    input.draftExists &&
    (input.draftMtimeMs ?? 0) >= (input.startedAtMs ?? 0);

  return draftFresh ? 'done' : 'error';
}

/**
 * done/error/canceled are settled — once reached, the job never moves again.
 * Guards status-file writes (#70 P1.10): a cancel arriving after the job already
 * settled `done` must not clobber it back to `canceled`.
 */
export function isTerminalStatus(status: RecordedStatus): boolean {
  return status === 'done' || status === 'error' || status === 'canceled';
}
