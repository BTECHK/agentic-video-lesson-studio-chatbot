'use client';

import type { ChatMessage } from '@/lib/types';
import { CitationBadge } from './CitationBadge';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <span
        className="text-xs mb-1 px-1"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font)', fontWeight: 600 }}
      >
        {isUser ? 'You' : 'Tutor'}
      </span>
      <div
        className="max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
        style={{
          backgroundColor: isUser ? 'var(--accent)' : 'var(--bg-card)',
          color: isUser ? '#FFFFFF' : 'var(--text)',
          borderRadius: 'var(--radius)',
          fontFamily: 'var(--font)',
        }}
      >
        {message.content}
        {!isUser && message.citations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.citations.map((c) => (
              <CitationBadge key={c.id} citation={c} />
            ))}
          </div>
        )}
      </div>
      <span
        className="text-xs mt-1 px-1"
        style={{ color: 'var(--text-muted)', fontSize: '0.625rem' }}
      >
        {new Date(message.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  );
}
