import type { Metadata } from 'next';
import ChatContainer from '@/components/Chat/ChatContainer';

export const metadata: Metadata = {
  title: '라이브 채팅방 (베타) | 아틀레티 KR',
  description: '아틀레티코 마드리드 팬들을 위한 실시간 라이브 채팅방. 콜초네로 팬들과 함게 경기 응원!',
};

export default function ChatPage() {
  return (
    <div className="w-full h-dvh min-h-dvh bg-white flex flex-col items-center justify-center p-0 overflow-hidden">
      <ChatContainer initialMatchId="recent" />
    </div>
  );
}
