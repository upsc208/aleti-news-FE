import type { ChatMessage } from '@/client/types.gen';

/**
 * 경기 채팅방 피드에는 사람이 친 메시지 말고 경기 이벤트(골)도 섞인다.
 * 아직 이벤트를 밀어주는 API가 없어서 goals는 비어 있지만,
 * 나중에 /topic/match/{matchId} 같은 채널이 생기면 이 배열만 채우면 된다.
 */

export interface GoalEvent {
  /** 같은 골이 두 번 터지지 않게 하는 키 — 서버 이벤트 id를 그대로 쓰면 된다 */
  id: string;
  /** 한글 표기 — 채팅·골 카드에 쓴다 */
  scorer: string;
  /**
   * 같은 선수의 라틴 표기. 서버가 FotMob의 같은 골에서 찾아 붙여 준다.
   * LED 보드 전용이고, 못 찾았으면 없다 (그때는 boardNames의 표로 넘어간다).
   */
  nameLatin?: string;
  assist?: string;
  /** "62'" 같은 표기. 모르면 비워둔다 */
  minute?: string;
  homeScore: number;
  awayScore: number;
  /** 우리 골인지 — 실점이면 연출 톤이 반대로 간다 */
  isAtleti: boolean;
  /** 자책골. 넣은 선수와 점수가 오르는 팀이 반대라 이름을 그대로 띄우면 오해를 부른다 */
  ownGoal?: boolean;
  /** ISO 문자열. 피드 정렬에 쓴다 */
  at: string;
}

export type FeedItem =
  | { kind: 'message'; key: string; at: number; msg: ChatMessage }
  | { kind: 'goal'; key: string; at: number; goal: GoalEvent };

const timeOf = (raw?: string): number => {
  if (!raw) return 0;
  const t = new Date(raw).getTime();
  return isNaN(t) ? 0 : t;
};

/**
 * 메시지와 골을 시간순으로 합친다.
 *
 * sentAt이 없는 메시지는 시각을 0으로 두면 전부 맨 위로 올라가버리므로,
 * 정렬은 "시각이 있는 것만" 기준으로 하고 나머지는 원래 순서를 지킨다.
 * (서버가 이미 시간순으로 보내주므로 원래 순서가 곧 올바른 순서다.)
 */
export function buildFeed(messages: ChatMessage[], goals: GoalEvent[]): FeedItem[] {
  const items: FeedItem[] = messages.map((msg, i) => ({
    kind: 'message',
    key: `m-${i}-${msg.sentAt ?? ''}-${msg.nickname}`,
    at: timeOf(msg.sentAt),
    msg,
  }));

  if (goals.length === 0) return items;

  for (const goal of goals) {
    const at = timeOf(goal.at);
    // 골보다 나중에 온 첫 메시지 앞에 끼워 넣는다.
    // 시각이 없는(0) 메시지는 비교 대상에서 빼야 골이 맨 앞으로 밀리지 않는다.
    const idx = items.findIndex((it) => it.at > 0 && it.at > at);
    const entry: FeedItem = { kind: 'goal', key: `g-${goal.id}`, at, goal };
    if (idx === -1) items.push(entry);
    else items.splice(idx, 0, entry);
  }

  return items;
}

const CHANT_WORDS = [
  'ATLETI',
  'AUPA',
  'AÚPA',
  'VAMOS',
  'ROJIBLANCO',
  'COLCHONERO',
  'GOL',
  '아틀레티',
  '아우파',
  '바모스',
];

/**
 * 응원 구호인지 — 맞으면 말풍선을 크게, 붉게 그린다.
 *
 * 짧고, 느낌표가 있고, 소문자가 거의 없거나 알려진 응원 단어가 들어간 문장만
 * 통과시킨다. 일반 대화가 잘못 걸리면 화면이 온통 커져버리므로 조건은 좁게 잡았다.
 */
export function isChant(content: string): boolean {
  const text = content.trim();
  if (text.length === 0 || text.length > 40) return false;
  if (!/[!¡]/.test(text)) return false;

  const upper = text.toUpperCase();
  const hasChantWord = CHANT_WORDS.some((w) => upper.includes(w));

  // 라틴 대문자로만 지른 문장. 대문자가 하나라도 있어야 한다는 조건이 없으면
  // 한글에는 대소문자가 없어서 느낌표 붙은 평범한 한국어 문장이 전부 걸린다.
  const isShouted = /[A-Z]/.test(text) && !/[a-z]/.test(text);

  return hasChantWord || isShouted;
}
