'use client';

import { useRef, useState } from 'react';
import type { AccessMode } from '@/lib/types';
import { AccessGate } from '@/components/AccessGate';
import { ChatInterface } from '@/components/ChatInterface';
import { LandingHero } from '@/components/LandingHero';

interface SessionInfo {
  accessMode: AccessMode;
  accessCode?: string;
}

export default function Home() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const accessRef = useRef<HTMLDivElement>(null);

  if (session) {
    return <ChatInterface accessMode={session.accessMode} accessCode={session.accessCode} />;
  }

  function scrollToAccess() {
    accessRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <LandingHero onCtaClick={scrollToAccess} />
      <div
        id="access"
        ref={accessRef}
        style={{ padding: '48px 0 80px' }}
      >
        <AccessGate onModeSelected={(mode, code) => setSession({ accessMode: mode, accessCode: code })} />
      </div>
    </div>
  );
}
