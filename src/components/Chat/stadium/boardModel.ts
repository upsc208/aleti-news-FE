/**
 * LED 보드가 쓰는 값과 계산 — CSS 보드(LedStrip)와 WebGL 보드(LedRing)가 같이 쓴다.
 *
 * 두 보드가 같은 경기를 다르게 표시하면 안 되므로 계산은 여기 한 곳에만 둔다.
 */

/**
 * 보드가 그리는 화면들.
 *
 * `pre`는 킥오프 전이다 — 셀 시계도, 벌어질 스코어도 아직 없다.
 * 그 상태로 스코어보드를 세워두면 `0 ATM — ATM 0`짜리 죽은 보드가 되므로,
 * 실물 경기장이 경기 전에 그러듯 후원 판을 세워둔다.
 * `message`는 관리자가 채팅에 '/'로 올린 문구다 — 경기 중 안내를 보드로 띄운다.
 */
export type LedMode = 'pre' | 'idle' | 'goal' | 'sub' | 'message';

/**
 * 보드에 잠깐 띄울 교체 한 건 — 이름은 라틴 표기뿐이다 (FotMob이 유일한 소스).
 *
 * 보드는 `[들어오는 선수][IN][OUT][나가는 선수]` 네 칸만 그린다. [minute]과 [injury]는
 * 지금 화면에 안 나가지만 서버가 주는 값이라 들고 있는다 — 나중에 표기를 늘릴 때 쓴다.
 */
export interface SubEvent {
  /** `46'` / `45+2'` */
  minute: string;
  playerOut: string;
  playerIn: string;
  injury?: boolean;
}

export const BOARD_RED = '#cf1126';
export const BOARD_BLUE = '#1668e3';
export const BOARD_WHITE = '#ffffff';

/** 교체 보드의 IN 칸 — 실물 교체판이 들어오는 선수 쪽에 쓰는 연두다 */
export const BOARD_GREEN = '#22a447';

/**
 * 링에 감는 띠를 보이는 폭보다 이만큼 넓게 펼친다.
 *
 * 그래서 **텍스처 양 끝은 화면 뒤로 돌아가 안 보인다.** 반복되는 화면은 상관없지만,
 * 한 벌만 그리는 교체 보드는 이 안쪽에 넣어야 이름이 안 잘린다
 * (ledRingGL이 띠를 만들고, ledBoardPainter가 그 위에 그린다 — 값이 갈리면 바로 잘린다).
 */
export const UNROLL_RATIO = 1.15;
/**
 * 챔피언스리그 판의 두 파랑 — 대회 고유의 밤하늘 색이다.
 *
 * 짙은 쪽에서 밝은 쪽으로 번지게 칠한다. 한 가지 파랑으로 채우면 그냥 파란 판이고,
 * 두 색이 겹쳐야 깊이가 생겨 우주처럼 읽힌다.
 */
export const UCL_DEEP = '#020a24';
export const UCL_GLOW = '#3b82f6';

/** 킥오프 전 보드의 LG 칸 글자색 — LG가 로고에 쓰는 그 진한 자홍빛이다 */
export const LG_PINK = '#a50034';
/** 후원 판의 남색 — 보드의 밝은 파랑(BOARD_BLUE)보다 어둡되 푸른 기가 남아 있다 */
export const ATLETI_NAVY = '#223a84';

export const DEFAULT_VENUE = 'RIYADH AIR METROPOLITANO';

/**
 * 킥오프 전 보드에 도는 후원 문구.
 *
 * 로고는 상표라 못 쓰지만 이름을 글자로 적는 것은 지시적 사용이라 문제가 없다
 * (보드가 구단 엠블럼 대신 약칭을 쓰는 것과 같은 이유다 — boardNames.latinCode).
 */
export const PRE_SPONSOR = 'VISIT RWANDA';

/**
 * 지금 보드가 그릴 화면을 고른다.
 *
 * [clockText]가 없으면 아직 공이 안 굴렀다는 뜻이다(formatMatchClock이 킥오프 전에 null을 준다).
 * 다만 시계를 아직 한 번도 재보지 않은 첫 프레임(now === 0)도 같은 모양이라,
 * 그때는 지금까지처럼 스코어보드를 세워둔다 — 안 그러면 진행 중인 경기에 들어갈 때마다
 * 후원 보드가 한 프레임 스쳤다가 바뀐다.
 */
export function resolveLedMode(
  requested: LedMode,
  clockText: string | null,
  clockEvaluated: boolean
): LedMode {
  // 골이 먼저다 — 교체 화면이 떠 있는데 골이 터지면 골로 덮는다
  if (requested === 'goal') return 'goal';
  // 골 다음은 관리자 문구다. 교체·후원 화면보다 먼저 보여준다 — 사람이 직접 띄운 것이다
  if (requested === 'message') return 'message';
  // 킥오프 전이면 교체가 있을 리 없다. 순서상 pre보다 먼저 걸러 둔다
  if (requested === 'sub' && !(clockEvaluated && clockText === null)) return 'sub';
  return clockEvaluated && clockText === null ? 'pre' : 'idle';
}

const HALF_MS = 45 * 60_000;
const BREAK_MS = 15 * 60_000;
const FULL_MS = 90 * 60_000;

/** 서버가 주는 실제 전·후반 시작 시각 (LiveMatchState.periods) */
export interface MatchPeriods {
  firstHalfStarted?: string;
  firstHalfEnded?: string;
  secondHalfStarted?: string;
  /** 경기가 끝난 시각. 시계를 여기서 멈춘다 */
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

/**
 * 경기 시계 — "47:12" 형식. 추가시간은 45:00에서 멈추지 않고 그대로 흘러간다
 * (실물 보드가 그렇다. "45+2"는 중계 화면 표기법이다).
 *
 * [periods]가 있으면 **실제로 공이 굴러간 시각**을 기준으로 센다. 이게 있으면
 * 킥오프 지연·하프타임 길이·전반 추가시간이 전부 저절로 맞는다.
 *
 * 없으면 예정 킥오프로 어림한다 — 하프타임을 15분으로 가정하므로 그만큼 어긋난다.
 */
/**
 * 서버(네이버)가 주는 상태 문구 중 "아직 공이 안 굴렀다"는 것들.
 *
 * **대회마다 표기가 다르다.** 라리가는 `경기전`인데 K리그는 `시작전`이다(2026-08-20 실측).
 * 지금 이 방은 아틀레티 경기만 쓰지만, 모르는 표기가 들어오면 "굴렀다"로 보고 예전처럼
 * 어림하므로 새 표기를 놓쳐도 시계가 죽지는 않는다.
 */
const NOT_STARTED = new Set(['경기전', '시작전', '경기취소', '취소', '연기']);

/**
 * 공이 굴렀는가 — 서버 상태 문구로 판정한다.
 *
 * 모르면(`status`가 없으면) **굴렀다고 본다.** 서버가 상태를 안 주는 상황에서 시계를
 * 통째로 끄면 진행 중인 경기에서 보드가 죽는다.
 */
export const hasKickedOff = (status?: string | null): boolean =>
  !status ? true : !NOT_STARTED.has(status.replace(/\s/g, ''));

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

  // 경기 종료 — 끝난 시각에 멈춰 세운다 (95:12처럼).
  //
  // 이 분기가 없으면 아래 후반 계산이 계속 더해져 경기가 끝나고도 시계가 올라간다.
  // **화면 상태가 아니라 서버 값으로 멈춘다** — 늦게 들어오거나 새로고침한 사람도
  // 같은 값을 봐야 하기 때문이다.
  if (secondEnd !== null && secondStart !== null && now >= secondEnd) {
    return mmss(HALF_MS + (secondEnd - secondStart));
  }

  // 후반 — 45:00부터 다시 센다. 전반 추가시간이 몇 분이었든 상관없다
  if (secondStart !== null && now >= secondStart) return mmss(HALF_MS + (now - secondStart));

  // 하프타임 — 전반이 끝난 시각에 멈춰 세운다 (45:00이 아니라 49:45처럼)
  if (firstEnd !== null && firstStart !== null && now >= firstEnd) return mmss(firstEnd - firstStart);

  // 전반
  if (firstStart !== null) return now >= firstStart ? mmss(now - firstStart) : null;

  // ── 기준점이 아직 없을 때: 예정 킥오프로 어림한다 ──
  //
  // 다만 **경기가 실제로 시작했을 때만** 어림한다. 2026-08-20 말라가전에서 가드 오브 아너와
  // 추모 세레머니로 실제 킥오프가 예정보다 8분 20초 늦었는데, 예정 시각이 되자마자 시계가
  // 돌기 시작해 8분 넘게 틀린 값을 자신 있게 띄웠다. 서버가 `경기전`이라고 말해주고 있었는데
  // 그걸 안 보고 있었던 것이다. (docs/round1.md)
  //
  // 안 굴렀으면 null을 돌려주고, 보드는 후원 화면(pre)으로 남는다 — 실물 링이 경기 전에
  // 그러는 모습 그대로다 (resolveLedMode).
  if (!hasKickedOff(status)) return null;

  const kickoff = at(kickoffIso);
  if (kickoff === null) return null;

  let elapsed = now - kickoff;
  if (elapsed < 0) return null;                            // 아직 킥오프 전

  if (elapsed > HALF_MS + BREAK_MS) elapsed -= BREAK_MS;   // 후반 — 휴식만큼 되돌린다
  else if (elapsed > HALF_MS) elapsed = HALF_MS;           // 하프타임 동안은 45:00에 멈춘다

  return mmss(Math.min(elapsed, FULL_MS));
}

/**
 * 지금 경기 시계가 몇 분인지 — 모르면 null.
 *
 * 교체가 **방금 일어난 것인지** 판단할 때 쓴다. FotMob은 캐시를 길게 잡아서
 * (2026-08-20 종료 경기 실측 `max-age=900`) 한참 지난 교체가 뒤늦게 올 수 있는데,
 * 그걸 방금 일어난 것처럼 보드에 띄우면 없느니만 못하다.
 *
 * 시계 계산은 [formatMatchClock] 하나로 두고 여기서는 분만 떼어 쓴다 — 규칙이 둘로
 * 갈리면 보드의 시계와 이 판정이 서로 다른 분을 보게 된다.
 */
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

/**
 * 이 이름이 아틀레티코인지.
 *
 * `AT 마드리드`는 네이버 표기이자 **라이브 스코어가 실제로 주는 값**이다. 이게 빠지면
 * 보드가 아틀레티를 상대팀으로 보고 큰 구단명 자리에 상대 이름을 띄운다.
 * `마드리드`만으로 판정하면 레알 마드리드전에서 뒤집히므로 `AT`를 붙여 좁힌다.
 */
export const isAtleti = (team: string) =>
  /atl[ée]tico|아틀레티|아틀레띠|at\s*마드리드/i.test(team);

/** 보드 한 장에 그려야 할 내용 전부. 이 값이 같으면 텍스처를 다시 그리지 않는다. */
export interface BoardSpec {
  mode: LedMode;
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
  /** 관리자가 올린 문구 — `mode === 'message'`일 때만 본다 */
  message?: string;
  /** 교체 화면에 그릴 내용 — `mode === 'sub'`일 때만 본다 */
  sub?: SubEvent;
  /**
   * 교체 보드 등장 진행도 0~1. 이름 두 개가 바깥에서 가운데로 모이는 데 쓴다.
   *
   * 글자가 텍스처 안에 있어서 **다시 굽는 것 말고는 움직일 방법이 없다**(보드가 휜 링이라
   * CSS로 덧씌울 수도 없다). 그래서 등장 0.45초 동안만 값이 바뀌고 그 뒤로는 1에 멈춘다 —
   * 골 연출처럼 내내 도는 비용이 아니라 한 번에 끝나는 비용이다.
   */
  subPhase?: number;
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
    a.scorer === b.scorer &&
    a.message === b.message &&
    // 교체가 연달아 오면 여기서 걸러야 보드가 다시 그려진다
    a.sub?.playerIn === b.sub?.playerIn &&
    a.sub?.playerOut === b.sub?.playerOut &&
    a.subPhase === b.subPhase
  );
}
