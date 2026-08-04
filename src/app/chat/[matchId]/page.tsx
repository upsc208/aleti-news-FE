import type { Metadata } from 'next';
import ChatContainer from '@/components/Chat/ChatContainer';

// 백엔드 ChatService.FREE_ROOM_ID와 같은 값
const FREE_ROOM_ID = 'free';

interface MatchChatPageProps {
  params: Promise<{
    matchId: string;
  }>;
}

// 같은 라우트가 자유 채팅방(/chat/free)과 경기 채팅방(/chat/{matchId})을 모두 처리하므로
// 탭 제목도 방 종류에 맞춘다.
export async function generateMetadata({ params }: MatchChatPageProps): Promise<Metadata> {
  const { matchId } = await params;
  return matchId === FREE_ROOM_ID
    ? {
        title: '자유 채팅방 | 아틀레티 KR',
        description: '아틀레티코 마드리드 팬들을 위한 상시 자유 채팅방.',
      }
    : {
        title: '경기 라이브 채팅방 | 아틀레티 KR',
        description: '아틀레티코 마드리드 경기 실시간 응원 및 소통 라이브 채팅방.',
      };
}

export default async function MatchChatPage({ params }: MatchChatPageProps) {
  const resolvedParams = await params;
  return (
    <div className="w-full h-full bg-white flex flex-col items-center justify-center p-0 overflow-hidden">
      <ChatContainer initialMatchId={resolvedParams.matchId} />
    </div>
  );
}
