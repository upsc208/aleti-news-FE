/**
 * 좌석 배정 — 경기 채팅방에서 "직관 왔다"는 느낌을 만드는 가장 싼 장치.
 *
 * 서버는 좌석을 모른다. 닉네임 + 방 키만으로 결정론적으로 뽑기 때문에
 * 같은 사람은 새로고침해도, 다른 사람 화면에서 봐도 늘 같은 자리에 앉아 있다.
 * (닉네임을 바꾸면 자리도 바뀐다 — 그건 "자리 옮겼네"로 읽히니 괜찮다.)
 *
 * ipHash가 아니라 닉네임을 쓰는 이유: 내 좌석은 첫 메시지를 보내기 전에도
 * 화면에 띄워야 하는데, ipHash는 서버가 메시지에 붙여 돌려주기 전까지 알 수 없다.
 * 닉네임을 쓰면 내 좌석과 남이 보는 내 좌석이 항상 일치한다.
 */

/** 메트로폴리타노 스탠드. 남측(Fondo Sur)이 프렌테 아틀레티코가 서는 골대 뒤다. */
const SECTIONS = [
  'Fondo Sur',
  'Fondo Norte',
  'Lateral Este',
  'Lateral Oeste',
  'Preferencia',
] as const;

export type SectionName = (typeof SECTIONS)[number];

export interface Seat {
  section: SectionName;
  /** 3자리 좌석 번호 (100~399) */
  number: number;
  /** "Fondo Sur · 111" */
  label: string;
  /** 아바타 배경에 쓰는 0~359 색상각 */
  hue: number;
}

/** FNV-1a 32bit — 짧은 문자열을 고르게 흩어주면 충분해서 이걸로 족하다 */
function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function seatFor(nickname: string, matchId: string): Seat {
  const h = hash32(`${nickname.trim().toLowerCase()}@${matchId}`);
  const section = SECTIONS[h % SECTIONS.length];
  const number = 100 + ((h >>> 8) % 300);

  // 붉은색 계열(0~20, 340~360)은 피한다 — 내 말풍선/골 연출이 쓰는 색이라
  // 아바타까지 빨개지면 화면에서 강조가 사라진다.
  const hue = 25 + ((h >>> 16) % 300);

  return { section, number, label: `${section} · ${number}`, hue };
}

/** 아바타에 넣을 이니셜 — 한글은 첫 글자, 라틴은 두 글자까지 */
export function initialsOf(nickname: string): string {
  const trimmed = nickname.trim();
  if (!trimmed) return '?';
  const latin = trimmed.replace(/[^A-Za-z0-9]/g, '');
  if (latin.length >= 2) return latin.slice(0, 2).toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
}
