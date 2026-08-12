import type { Metadata } from 'next';
import ChatContainer from '@/components/Chat/ChatContainer';
import StadiumChatContainer from '@/components/Chat/stadium/StadiumChatContainer';

// 백엔드 ChatService.FREE_ROOM_ID와 같은 값
const FREE_ROOM_ID = 'free';

interface MatchChatPageProps {
  params: Promise<{
    matchId: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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

export default async function MatchChatPage({ params, searchParams }: MatchChatPageProps) {
  const { matchId } = await params;
  const query = await searchParams;

  // 자유 채팅방은 기존 화면 그대로 두고, 경기 채팅방만 직관 모드로 띄운다.
  // 두 화면은 껍데기만 다르고 동작(useChatRoom)은 같은 것을 쓴다.
  const isFreeRoom = matchId === FREE_ROOM_ID;

  // 백엔드 없이 직관 모드 디자인을 확인하는 통로(?preview=1).
  // 서버에서 판단해 넘겨야 클라이언트에서 location을 읽는 순간의
  // 하이드레이션 불일치가 생기지 않는다. dev 빌드에서만 켜진다.
  const isPreview =
    process.env.NODE_ENV === 'development' && query?.preview === '1';

  // 입장 티켓(닉네임 모달)만 띄워 확인하는 통로(?preview=1&ticket=1).
  // 평소 미리보기는 닉네임 모달을 건너뛰도록 되어 있어서, 티켓 디자인을 볼 방법이 없었다.
  const previewTicket = isPreview && query?.ticket === '1';

  return (
    // 큰 화면에서는 방(최대 896px) 양옆이 남는다. 밝은 직관 화면이 도드라지도록
    // 어두운 중립색으로 감싼다 — 극장 레터박스처럼.
    <div
      className={`w-full h-full flex flex-col items-center justify-center p-0 overflow-hidden ${
        isFreeRoom ? 'bg-white' : 'bg-[#0f172a]'
      }`}
    >
      {isFreeRoom ? (
        <ChatContainer initialMatchId={matchId} />
      ) : (
        <StadiumChatContainer
          initialMatchId={matchId}
          isPreview={isPreview}
          previewTicket={previewTicket}
        />
      )}
    </div>
  );
}
