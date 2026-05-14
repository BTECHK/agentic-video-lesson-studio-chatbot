'use client';

import { useState } from 'react';
import type { AccessMode } from '@/lib/types';
import { AccessGate } from '@/components/AccessGate';
import { ChatInterface } from '@/components/ChatInterface';

export default function Home() {
  const [accessMode, setAccessMode] = useState<AccessMode | null>(null);

  if (accessMode) {
    return <ChatInterface accessMode={accessMode} />;
  }

  return <AccessGate onModeSelected={setAccessMode} />;
}
