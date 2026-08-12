import type { ChatMessage, RecentMatch } from '@/client/types.gen';
import type { GoalEvent } from './feed';

/**
 * 개발용 미리보기 데이터 — /chat/{matchId}?preview=1 (dev 빌드에서만 동작).
 *
 * 골 이벤트 API가 붙기 전까지는 백엔드 없이 화면을 볼 방법이 없어서,
 * 말풍선·좌석·응원 구호·골 카드가 실제로 어떻게 겹쳐 보이는지 확인하는 용도로만 쓴다.
 * 운영 빌드에서는 StadiumChatContainer가 이 모듈의 값을 아예 읽지 않는다.
 */

// 시각은 렌더 시점 기준으로 만든다 — 하드코딩하면 "3년 전 메시지"처럼 보인다.
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

export function previewMessages(myNickname: string): ChatMessage[] {
  const mine = myNickname || '나';
  return [
    {
      matchId: 'preview',
      type: 'USER' as const,
      nickname: '시메오네도',
      content: '메트로폴리타노 원정 온 형들 다 모여라 🔴⚪',
      sentAt: minutesAgo(9),
      ipHash: 'a1b2c3d4',
    },
    {
      matchId: 'preview',
      type: 'USER' as const,
      nickname: 'Marta_84',
      content: '선발 나왔다. 훌리안 + 그리즈만 투톱!',
      sentAt: minutesAgo(7),
      ipHash: 'e5f6a7b8',
    },
    {
      matchId: 'preview',
      type: 'USER' as const,
      nickname: 'colchonero_kr',
      content: 'ATLETI! ATLETI! ATLETI!',
      sentAt: minutesAgo(5),
      ipHash: 'c9d0e1f2',
    },
    {
      matchId: 'preview',
      type: 'USER' as const,
      nickname: mine,
      content: '오늘 무조건 이긴다. 심장 준비됐어',
      sentAt: minutesAgo(4),
    },
    {
      matchId: 'preview',
      type: 'USER' as const,
      nickname: 'SYSTEM',
      content: '후반 시작 — 교체: 코케 → 바리오스',
      sentAt: minutesAgo(2),
    },
    {
      matchId: 'preview',
      type: 'USER' as const,
      nickname: 'metroSur7',
      content: '¡Vamos Atleti!',
      sentAt: minutesAgo(1),
      ipHash: '11223344',
    },
  ];
}

/** 헤더와 LED 스코어 패널을 채우기 위한 가짜 경기. 미리보기에서만 쓴다. */
export function previewMatch(): RecentMatch {
  return {
    matchId: 'preview',
    homeTeam: 'Atlético Madrid',
    awayTeam: 'Real Betis',
    homeScore: 1,
    awayScore: 0,
    matchDate: minutesAgo(62),
    isHome: true,
    tournament: 'LALIGA EA SPORTS',
    stats: {},
  };
}

export function previewGoals(): GoalEvent[] {
  return [
    {
      id: 'preview-goal-1',
      scorer: '훌리안 알바레스',
      assist: '그리즈만',
      minute: "62'",
      homeScore: 1,
      awayScore: 0,
      isAtleti: true,
      at: minutesAgo(3),
    },
  ];
}
