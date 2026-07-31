import type { Metadata } from 'next';
import ChatContainer from '@/components/Chat/ChatContainer';

export const metadata: Metadata = {
  title: '경기 라이브 채팅방 | 아틀레티 KR',
  description: '아틀레티코 마드리드 경기 실시간 응원 및 소통 라이브 채팅방.',
};

interface MatchChatPageProps {
  params: Promise<{
    matchId: string;
  }>;
}

export default async function MatchChatPage({ params }: MatchChatPageProps) {
  const resolvedParams = await params;
  return (
    <div className="w-full h-dvh min-h-dvh bg-white flex flex-col items-center justify-center p-0 overflow-hidden">
      <ChatContainer initialMatchId={resolvedParams.matchId} />
    </div>
  );
}
