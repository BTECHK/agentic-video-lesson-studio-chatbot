import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionStore } from '@/lib/session';

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(() => {
    store = new SessionStore();
  });

  it('creates a session with a UUID and correct access mode', () => {
    const session = store.create('demo');
    expect(session.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(session.accessMode).toBe('demo');
    expect(session.messages).toEqual([]);
  });

  it('creates student sessions', () => {
    const session = store.create('student');
    expect(session.accessMode).toBe('student');
  });

  it('retrieves a session by id', () => {
    const created = store.create('demo');
    const retrieved = store.get(created.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe(created.id);
  });

  it('returns undefined for nonexistent session', () => {
    expect(store.get('nonexistent-id')).toBeUndefined();
  });

  it('expires sessions after 30 minutes of inactivity', () => {
    const session = store.create('demo');
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 31 * 60 * 1000);
    expect(store.get(session.id)).toBeUndefined();
    vi.restoreAllMocks();
  });

  it('keeps sessions alive when accessed within timeout', () => {
    const session = store.create('demo');
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 25 * 60 * 1000);
    expect(store.get(session.id)).toBeDefined();
    vi.restoreAllMocks();
  });

  it('adds messages to a session', () => {
    const session = store.create('demo');
    store.addMessage(session.id, { role: 'user', content: 'Hello' });
    store.addMessage(session.id, { role: 'assistant', content: 'Hi there!' });
    const messages = store.getMessages(session.id);
    expect(messages).toHaveLength(2);
    expect(messages[0].content).toBe('Hello');
    expect(messages[1].content).toBe('Hi there!');
  });

  it('returns empty messages for nonexistent session', () => {
    expect(store.getMessages('nonexistent')).toEqual([]);
  });

  it('silently ignores addMessage for expired sessions', () => {
    const session = store.create('demo');
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 31 * 60 * 1000);
    store.addMessage(session.id, { role: 'user', content: 'Hello' });
    expect(store.getMessages(session.id)).toEqual([]);
    vi.restoreAllMocks();
  });

  it('cleans up expired sessions', () => {
    const session1 = store.create('demo');
    const session2 = store.create('student');
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 31 * 60 * 1000);
    store.cleanup();
    expect(store.get(session1.id)).toBeUndefined();
    expect(store.get(session2.id)).toBeUndefined();
    vi.restoreAllMocks();
  });
});
