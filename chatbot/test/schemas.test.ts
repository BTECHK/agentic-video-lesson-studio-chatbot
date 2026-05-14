import { describe, it, expect } from 'vitest';
import { ChatRequestSchema, SessionRequestSchema } from '@/lib/types';

describe('ChatRequestSchema', () => {
  it('validates a correct chat request', () => {
    const result = ChatRequestSchema.safeParse({
      message: 'What is AI?',
      sessionId: 'abc-123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty message', () => {
    const result = ChatRequestSchema.safeParse({
      message: '',
      sessionId: 'abc-123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing sessionId', () => {
    const result = ChatRequestSchema.safeParse({
      message: 'Hello',
    });
    expect(result.success).toBe(false);
  });

  it('rejects message over 2000 characters', () => {
    const result = ChatRequestSchema.safeParse({
      message: 'a'.repeat(2001),
      sessionId: 'abc-123',
    });
    expect(result.success).toBe(false);
  });

  it('strips unknown fields (like accessMode)', () => {
    const result = ChatRequestSchema.safeParse({
      message: 'Hello',
      sessionId: 'abc-123',
      accessMode: 'student',
    });
    expect(result.success).toBe(true);
  });
});

describe('SessionRequestSchema', () => {
  it('defaults accessMode to demo', () => {
    const result = SessionRequestSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accessMode).toBe('demo');
    }
  });

  it('accepts student accessMode with accessCode', () => {
    const result = SessionRequestSchema.safeParse({
      accessMode: 'student',
      accessCode: 'demo-access-code',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid accessMode', () => {
    const result = SessionRequestSchema.safeParse({
      accessMode: 'admin',
    });
    expect(result.success).toBe(false);
  });
});
