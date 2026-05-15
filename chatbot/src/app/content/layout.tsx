import { ChatWidget } from '@/components/ChatWidget';

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  );
}
