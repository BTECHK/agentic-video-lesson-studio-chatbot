export interface ClassifiedError {
  status: number;
  message: string;
}

function statusOf(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'status' in error) {
    const s = (error as { status?: unknown }).status;
    if (typeof s === 'number') return s;
  }
  return undefined;
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const m = (error as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return String(error);
}

// Maps a provider error to a user-safe HTTP response. The caller logs the real
// cause server-side; we never leak key/billing/model specifics to the client.
export function classifyProviderError(error: unknown): ClassifiedError {
  const status = statusOf(error);
  const lower = messageOf(error).toLowerCase();

  // Billing/credit problems often surface as 400s with a misleading message.
  // Keep it neutral to the user; the caller logs it loudly so we can top up.
  if (lower.includes('credit balance') || lower.includes('billing')) {
    return { status: 503, message: 'The AI service is temporarily unavailable. Please try again later.' };
  }

  switch (status) {
    case 401:
    case 403:
    case 404:
      // Auth, permission, or model-not-found — all "our config" problems, not the user's.
      return { status: 503, message: 'The AI service is temporarily unavailable. Please try again later.' };
    case 429:
      return { status: 429, message: 'Too many requests right now — please try again in a moment.' };
    default:
      if (status && status >= 500) {
        return { status: 502, message: 'The AI is having trouble right now. Please try again.' };
      }
      if (status && status >= 400) {
        return { status: 400, message: 'That request could not be processed. Please rephrase and try again.' };
      }
      return { status: 500, message: 'Something went wrong generating a response. Please try again.' };
  }
}
