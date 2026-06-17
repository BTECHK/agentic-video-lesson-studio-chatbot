/**
 * Minimal structured logging (#70 P1.13). One grep-able JSON line per event to
 * stdout — request/job lifecycle observability without pulling in a logging
 * dependency. ponytail: JSON-line console logger; swap for pino if volume or a
 * transport (file/remote) is ever genuinely needed.
 */
export type LogFields = Record<string, unknown>;

/**
 * Pure: build the JSON log line. Canonical keys (t/level/event) are written
 * last so they always win over caller-supplied fields — an event name can't be
 * spoofed by a field of the same name.
 */
export function formatLogLine(event: string, fields: LogFields, now: Date): string {
  return JSON.stringify({ ...fields, t: now.toISOString(), level: 'info', event });
}

/** Emit a structured event line to stdout. */
export function logEvent(event: string, fields: LogFields = {}): void {
  console.log(formatLogLine(event, fields, new Date()));
}
