/** LED 보드가 쓰는 값과 계산 — CSS 보드(LedStrip)와 WebGL 보드(LedRing)가 같이 쓴다 */

/**
 * 보드가 그리는 화면들.
 * pre: 킥오프 전 후원 판 / idle: 스코어·시계 / goal: 골 연출 / sub: 교체 / message: 관리자 문구
 */
export type LedMode = 'pre' | 'idle' | 'goal' | 'sub' | 'message';

export interface SubEvent {
  minute: string;
  playerOut: string;
  playerIn: string;
  injury?: boolean;
}

export const BOARD_RED = '#cf1126';
export const BOARD_BLUE = '#1668e3';
export const BOARD_WHITE = '#ffffff';

export const BOARD_GREEN = '#22a447';

export const UNROLL_RATIO = 1.15;

export const UCL_DEEP = '#020a24';
export const UCL_GLOW = '#3b82f6';

export const LG_PINK = '#a50034';
export const ATLETI_NAVY = '#223a84';

export const DEFAULT_VENUE = 'RIYADH AIR METROPOLITANO';

export const PRE_SPONSOR = 'VISIT RWANDA';

export const PRE_LG = "Life's Good";

export function resolveLedMode(
  requested: LedMode,
  clockText: string | null,
  clockEvaluated: boolean
): LedMode {
  if (requested === 'goal') return 'goal';
  if (requested === 'message') return 'message';
  if (requested === 'sub' && !(clockEvaluated && clockText === null)) return 'sub';
  return clockEvaluated && clockText === null ? 'pre' : 'idle';
}

const HALF_MS = 45 * 60_000;
const BREAK_MS = 15 * 60_000;
const FULL_MS = 90 * 60_000;

export interface MatchPeriods {
  firstHalfStarted?: string;
  firstHalfEnded?: string;
  secondHalfStarted?: string;
  secondHalfEnded?: string;
}

const at = (iso?: string): number | null => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return isNaN(t) ? null : t;
};

const mmss = (ms: number): string => {
  const clamped = Math.max(0, ms);
  return (
    `${String(Math.floor(clamped / 60_000)).padStart(2, '0')}:` +
    `${String(Math.floor((clamped % 60_000) / 1000)).padStart(2, '0')}`
  );
};

const NOT_STARTED = new Set(['경기전', '시작전', '경기취소', '취소', '연기']);

export const hasKickedOff = (status?: string | null): boolean =>
  !status ? true : !NOT_STARTED.has(status.replace(/\s/g, ''));

/** 경기 시계 — "47:12" 형식. 추가시간도 멈추지 않고 흐른다. periods가 있으면 실제 킥오프 기준, 없으면 예정 킥오프로 어림한다 */
export function formatMatchClock(
  kickoffIso: string,
  now: number,
  periods?: MatchPeriods | null,
  status?: string | null
): string | null {
  const firstStart = at(periods?.firstHalfStarted);
  const firstEnd = at(periods?.firstHalfEnded);
  const secondStart = at(periods?.secondHalfStarted);
  const secondEnd = at(periods?.secondHalfEnded);

  if (secondEnd !== null && secondStart !== null && now >= secondEnd) {
    return mmss(HALF_MS + (secondEnd - secondStart));
  }

  if (secondStart !== null && now >= secondStart) return mmss(HALF_MS + (now - secondStart));

  if (firstEnd !== null && firstStart !== null && now >= firstEnd) return mmss(firstEnd - firstStart);

  if (firstStart !== null) return now >= firstStart ? mmss(now - firstStart) : null;

  if (!hasKickedOff(status)) return null;

  const kickoff = at(kickoffIso);
  if (kickoff === null) return null;

  let elapsed = now - kickoff;
  if (elapsed < 0) return null;

  if (elapsed > HALF_MS + BREAK_MS) elapsed -= BREAK_MS;
  else if (elapsed > HALF_MS) elapsed = HALF_MS;

  return mmss(Math.min(elapsed, FULL_MS));
}

export function matchMinuteNow(
  kickoffIso: string,
  now: number,
  periods?: MatchPeriods | null,
  status?: string | null
): number | null {
  const text = formatMatchClock(kickoffIso, now, periods, status);
  if (!text) return null;
  const minute = Number(text.split(':')[0]);
  return Number.isFinite(minute) ? minute : null;
}

export const isAtleti = (team: string) =>
  /atl[ée]tico|아틀레티|아틀레띠|at\s*마드리드/i.test(team);

export interface BoardSpec {
  mode: LedMode;
  competition: string;
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
  message?: string;
  sub?: SubEvent;
  subPhase?: number;
}

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
    a.scorer === b.scorer &&
    a.message === b.message &&
    a.sub?.playerIn === b.sub?.playerIn &&
    a.sub?.playerOut === b.sub?.playerOut &&
    a.subPhase === b.subPhase
  );
}
