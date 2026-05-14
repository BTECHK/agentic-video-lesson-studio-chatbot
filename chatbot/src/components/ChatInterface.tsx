'use client';

import { useState, useEffect, useRef } from 'react';
import type { AccessMode, ChatMessage, Citation } from '@/lib/types';
import { MessageBubble } from './MessageBubble';

export function ChatInterface({ accessMode }: { accessMode: AccessMode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessMode }),
    })
      .then((res) => res.json())
      .then((data: { sessionId: string }) => setSessionId(data.sessionId))
      .catch(console.error);
  }, [accessMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || !sessionId || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      citations: [],
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId, accessMode }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Request failed');
      }

      const data: { message: string; citations: Citation[] } = await res.json();
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-resp`,
        role: 'assistant',
        content: data.message,
        citations: data.citations,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: `Sorry, something went wrong. ${error instanceof Error ? error.message : 'Please try again.'}`,
        citations: [],
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto w-full">
      <header
        className="p-4 border-b"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
      >
        <h1 className="text-lg" style={{ fontWeight: 700 }}>
          Tutor
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          Sample Academy AI Teaching Assistant
        </p>
      </header>

      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ backgroundColor: 'var(--bg-base)' }}
      >
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center h-full">
            <p
              className="text-center text-sm"
              style={{ color: 'var(--text-muted)', maxWidth: '300px' }}
            >
              Ask Tutor anything about AI tools and the course material
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 border-t flex gap-2"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask Tutor a question..."
          disabled={isLoading || !sessionId}
          className="flex-1 px-3 py-2 text-sm outline-none"
          style={{
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font)',
            backgroundColor: 'var(--bg-base)',
          }}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading || !sessionId}
          className="px-4 py-2 text-sm text-white font-semibold cursor-pointer disabled:opacity-50"
          style={{
            backgroundColor: 'var(--accent)',
            borderRadius: 'var(--radius)',
            border: 'none',
            fontFamily: 'var(--font)',
          }}
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
