interface UsageState {
  dayKey: string;
  hits: number;
}

const state: UsageState = { dayKey: '', hits: 0 };
const DEFAULT_DAILY_LIMIT = 200;

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function pacificDayKey(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function withStatus(status: number, message: string): Error & { status: number } {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
}

/**
 * Local safety rail for testing: caps Tutor Google calls/day (midnight Pacific),
 * mirroring Gemini's published RPD reset timezone.
 */
export function consumeGoogleChatbotRequest(
  env: Record<string, string | undefined> = process.env,
  now = new Date(),
): void {
  const dailyLimit = parsePositiveInt(
    env.GOOGLE_CHATBOT_DAILY_LIMIT,
    DEFAULT_DAILY_LIMIT,
  );
  const day = pacificDayKey(now);
  if (state.dayKey !== day) {
    state.dayKey = day;
    state.hits = 0;
  }
  if (state.hits >= dailyLimit) {
    throw withStatus(
      429,
      `Local Google chatbot daily cap reached (${dailyLimit}/day). Increase GOOGLE_CHATBOT_DAILY_LIMIT only if intended.`,
    );
  }
  state.hits += 1;
}

export function resetGoogleChatbotUsageState(): void {
  state.dayKey = '';
  state.hits = 0;
}
