'use client';

import { useState } from 'react';
import type { AccessMode } from '@/lib/types';

export function AccessGate({
  onModeSelected,
}: {
  onModeSelected: (mode: AccessMode, accessCode?: string) => void;
}) {
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  async function handleStudentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessCode.trim()) return;
    setIsValidating(true);
    setError('');

    try {
      const res = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode }),
      });
      const data = await res.json();
      if (data.valid) {
        onModeSelected('student', accessCode);
      } else {
        setError(
          'Invalid access code. Check your enrollment email from Sample Academy.',
        );
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsValidating(false);
    }
  }

  return (
    <main
      className="flex-1 flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      <div
        className="w-full max-w-sm overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          className="h-1"
          style={{ backgroundColor: 'var(--accent)' }}
        />
        <div className="p-8 text-center">
          <h1 className="text-3xl mb-1" style={{ fontWeight: 800 }}>
            Tutor
          </h1>
          <p
            className="mb-8"
            style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}
          >
            Your Sample Academy AI Teaching Assistant
          </p>

          {!showCodeInput ? (
            <div className="space-y-3">
              <button
                onClick={() => onModeSelected('demo')}
                className="w-full py-3 px-4 text-white font-semibold cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent)',
                  borderRadius: 'var(--radius)',
                  border: 'none',
                }}
              >
                Try Demo
              </button>
              <button
                onClick={() => setShowCodeInput(true)}
                className="w-full py-3 px-4 font-semibold cursor-pointer"
                style={{
                  backgroundColor: 'transparent',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent)',
                }}
              >
                I&#39;m a Student
              </button>
            </div>
          ) : (
            <form onSubmit={handleStudentSubmit} className="space-y-3">
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter your access code"
                autoFocus
                className="w-full px-3 py-2 text-sm outline-none"
                style={{
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  fontFamily: 'var(--font)',
                }}
              />
              {error && (
                <p className="text-xs" style={{ color: 'var(--accent)' }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={isValidating || !accessCode.trim()}
                className="w-full py-3 px-4 text-white font-semibold cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--accent)',
                  borderRadius: 'var(--radius)',
                  border: 'none',
                }}
              >
                {isValidating ? 'Verifying...' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCodeInput(false);
                  setError('');
                  setAccessCode('');
                }}
                className="w-full py-2 text-sm cursor-pointer"
                style={{
                  color: 'var(--text-muted)',
                  background: 'none',
                  border: 'none',
                }}
              >
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
