#!/usr/bin/env node

/**
 * Quick local smoke check for Gemini API credentials.
 * Usage:
 *   GOOGLE_CHATBOT_API_KEY=... npm run check:google
 *   GOOGLE_CHATBOT_API_KEY=... GOOGLE_MODEL=gemini-2.5-pro npm run check:google -- "Say GOOGLE_OK"
 */

const apiKey = process.env.GOOGLE_CHATBOT_API_KEY || process.env.GOOGLE_API_KEY;
const model = process.env.GOOGLE_MODEL || 'gemini-2.5-flash';
const prompt = process.argv.slice(2).join(' ').trim() || 'Reply with exactly: GOOGLE_OK';

if (!apiKey) {
  console.error(
    'Missing GOOGLE_CHATBOT_API_KEY (or GOOGLE_API_KEY). Set it in your env or chatbot/.env before running this check.',
  );
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': apiKey,
  },
  body: JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  }),
});

if (!response.ok) {
  const body = await response.text();
  console.error(`Google key check failed (${response.status}).`);
  console.error(body.slice(0, 600));
  process.exit(1);
}

const payload = await response.json();
const parts = payload?.candidates?.[0]?.content?.parts ?? [];
const text = parts
  .map((part) => (typeof part?.text === 'string' ? part.text : ''))
  .join('\n')
  .trim();

if (!text) {
  const reason = payload?.promptFeedback?.blockReason || payload?.promptFeedback?.blockReasonMessage;
  console.error(`Google key check returned no text output${reason ? ` (${reason})` : ''}.`);
  process.exit(1);
}

console.log(`[google:${model}] key check passed`);
console.log(text.slice(0, 500));
