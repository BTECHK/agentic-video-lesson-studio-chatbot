'use client';

import { useRef, useState } from 'react';
import type { AccessMode } from '@/lib/types';
import { AccessGate } from '@/components/AccessGate';
import { ChatInterface } from '@/components/ChatInterface';

interface SessionInfo {
  accessMode: AccessMode;
  accessCode?: string;
}

export default function ChatPage() {
  const [session, setSession] = useState<SessionInfo | null>(null);

  if (session) {
    return <ChatInterface accessMode={session.accessMode} accessCode={session.accessCode} />;
  }

  return (
    <AccessGate onModeSelected={(mode, code) => setSession({ accessMode: mode, accessCode: code })} />
  );
}
