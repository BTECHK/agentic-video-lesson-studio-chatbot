'use client';

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Citation } from '@/lib/types';

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !sessionId) {
      fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessMode: 'demo' }),
      })
        .then((r) => r.json())
        .then((d: { sessionId: string }) => setSessionId(d.sessionId))
        .catch(console.error);
    }
  }, [open, sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !sessionId || isLoading) return;

    const userMsg: ChatMessage = {
      id: `w-${Date.now()}`,
      role: 'user',
      content: text,
      citations: [],
      timestamp: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      });
      const data: { message: string; citations: Citation[] } = await res.json();
      setMessages((m) => [
        ...m,
        {
          id: `w-${Date.now()}-r`,
          role: 'assistant',
          content: data.message,
          citations: data.citations,
          timestamp: Date.now(),
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `w-${Date.now()}-e`,
          role: 'assistant',
          content: 'Sorry, something went wrong.',
          citations: [],
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: '50%',
          backgroundColor: 'var(--accent)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.25rem',
          boxShadow: '0 4px 16px rgba(28, 28, 28, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          transition: 'transform 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        title="Ask Tutor"
      >
        T
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 360,
        height: 480,
        borderRadius: 'var(--radius)',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 32px rgba(28, 28, 28, 0.18)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 1000,
        fontFamily: 'var(--font)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.625rem 0.75rem',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Tutor</div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Ask about AI tools</div>
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            color: 'var(--text-muted)',
            padding: '0.25rem',
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.75rem',
          backgroundColor: 'var(--bg-base)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2rem' }}>
            Ask about tools, capabilities, or comparisons
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius)',
              backgroundColor: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-card)',
              color: msg.role === 'user' ? '#fff' : 'var(--text)',
              fontSize: '0.8125rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
            }}
          >
            {msg.content}
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={send}
        style={{
          display: 'flex',
          gap: '0.375rem',
          padding: '0.5rem 0.75rem',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Tutor..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '0.375rem 0.5rem',
            fontSize: '0.8125rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font)',
            backgroundColor: 'var(--bg-base)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          style={{
            padding: '0.375rem 0.75rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            backgroundColor: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            fontFamily: 'var(--font)',
            opacity: !input.trim() || isLoading ? 0.5 : 1,
          }}
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
