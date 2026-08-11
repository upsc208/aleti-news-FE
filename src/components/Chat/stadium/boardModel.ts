/**
 * LED 보드가 쓰는 값과 계산 — CSS 보드(LedStrip)와 WebGL 보드(LedRing)가 같이 쓴다.
 *
 * 두 보드가 같은 경기를 다르게 표시하면 안 되므로 계산은 여기 한 곳에만 둔다.
 */

export type LedMode = 'idle' | 'goal';

export const BOARD_RED = '#cf1126';
export const BOARD_BLUE = '#1668e3';
export const BOARD_WHITE = '#ffffff';

export const DEFAULT_VENUE = 'RIYADH AIR METROPOLITANO';

const HALF_MS = 45 * 60_000;
const BREAK_MS = 15 * 60_000;
const FULL_MS = 90 * 60_000;

/**
 * 킥오프 시각에서 경기 시계를 만든다 — "47:12" 형식.
 *
 * 벽시계로 세는 근사값이다. 하프타임 15분만 빼주고 추가시간·중단은 모른다.
 * 서버가 진짜 경기 시계를 내려주면 clock prop으로 덮어쓰는 게 맞다.
 */
export function formatMatchClock(kickoffIso: string, now: number): string | null {
  const kickoff = new Date(kickoffIso).getTime();
  if (isNaN(kickoff)) return null;

  let elapsed = now - kickoff;
  if (elapsed < 0) return null;                            // 아직 킥오프 전

  if (elapsed > HALF_MS + BREAK_MS) elapsed -= BREAK_MS;   // 후반 — 휴식만큼 되돌린다
  else if (elapsed > HALF_MS) elapsed = HALF_MS;           // 하프타임 동안은 45:00에 멈춘다

  const capped = Math.min(elapsed, FULL_MS);
  const minutes = Math.floor(capped / 60_000);
  const seconds = Math.floor((capped % 60_000) / 1000);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export const isAtleti = (team: string) => /atl[ée]tico|아틀레티|아틀레띠/i.test(team);

/** 보드 한 장에 그려야 할 내용 전부. 이 값이 같으면 텍스처를 다시 그리지 않는다. */
export interface BoardSpec {
  mode: 'idle' | 'goal';
  /** 스코어 양옆 리그 칸 — "LALIGA EA SPORTS" */
  competition: string;
  /** 바깥 칸 — 경기장 이름. 리그와 같은 글자를 네 번 돌리지 않으려고 나눠 둔다 */
  venue: string;
  clock: string;
  atletiName: string;
  homeCode: string;
  awayCode: string;
  homeIsAtleti: boolean;
  awayIsAtleti: boolean;
  homeScore: number;
  awayScore: number;
  scorer?: string;
}

/** 얕은 비교 — 필드가 전부 원시값이라 이걸로 충분하다 */
export function sameSpec(a: BoardSpec | null, b: BoardSpec): boolean {
  if (!a) return false;
  return (
    a.mode === b.mode &&
    a.competition === b.competition &&
    a.venue === b.venue &&
    a.clock === b.clock &&
    a.atletiName === b.atletiName &&
    a.homeCode === b.homeCode &&
    a.awayCode === b.awayCode &&
    a.homeIsAtleti === b.homeIsAtleti &&
    a.awayIsAtleti === b.awayIsAtleti &&
    a.homeScore === b.homeScore &&
    a.awayScore === b.awayScore &&
    a.scorer === b.scorer
  );
}
