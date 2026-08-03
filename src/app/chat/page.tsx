import type { Metadata } from 'next';
import RoomSelector from '@/components/Chat/RoomSelector';

export const metadata: Metadata = {
  title: '채팅방 선택 | 아틀레티 KR',
  description:
    '아틀레티코 마드리드 팬 채팅방. 24시간 열려 있는 자유 채팅방과 경기 킥오프 1시간 전에 열리는 경기 채팅방 중에서 골라보세요.',
};

// 방 선택 화면. 실제 채팅방은 /chat/free(자유) · /chat/{matchId}(경기)
export default function ChatRoomsPage() {
  return <RoomSelector />;
}
