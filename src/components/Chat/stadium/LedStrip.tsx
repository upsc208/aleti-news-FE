'use client';

import React, { useEffect, useMemo, useState } from 'react';

export type LedMode = 'idle' | 'goal';

interface LedStripProps {
  mode?: LedMode;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  /** 대회명 — "LALIGA EA SPORTS", "UEFA CHAMPIONS LEAGUE" */
  competition?: string;
  /** 경기장 이름 */
  venue?: string;
  /**
   * 경기 시계("56:38"). 보드 정중앙에 놓인다.
   * 서버가 정확한 값을 내려주면 이걸 쓰고, 없으면 아래 kickoff로 직접 센다.
   */
  clock?: string;
  /** 킥오프 시각(ISO). clock이 없을 때 여기서 경과 시간을 계산한다 */
  kickoff?: string;
  /** 골 연출 중 흘려보낼 득점자 이름 */
  scorer?: string;
}

type Cell =
  | { kind: 'panel'; tone: 'red' | 'blue' | 'white'; text: string }
  | { kind: 'gap' }
  | { kind: 'score' };

const DEFAULT_VENUE = 'RIYADH AIR METROPOLITANO';

const HALF_MS = 45 * 60_000;
const BREAK_MS = 15 * 60_000;
const FULL_MS = 90 * 60_000;

/**
 * 킥오프 시각에서 경기 시계를 만든다 — "47:12" 형식.
 *
 * 벽시계로 세는 근사값이다. 하프타임 15분만 빼주고 추가시간·중단은 모른다.
 * 서버가 진짜 경기 시계를 내려주면 clock prop으로 덮어쓰는 게 맞다.
 */
function formatMatchClock(kickoffIso: string, now: number): string | null {
  const kickoff = new Date(kickoffIso).getTime();
  if (isNaN(kickoff)) return null;

  let elapsed = now - kickoff;
  if (elapsed < 0) return null;                       // 아직 킥오프 전

  if (elapsed > HALF_MS + BREAK_MS) elapsed -= BREAK_MS;   // 후반 — 휴식만큼 되돌린다
  else if (elapsed > HALF_MS) elapsed = HALF_MS;           // 하프타임 동안은 45:00에 멈춘다

  const capped = Math.min(elapsed, FULL_MS);
  const minutes = Math.floor(capped / 60_000);
  const seconds = Math.floor((capped % 60_000) / 1000);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const isAtleti = (team: string) => /atl[ée]tico|아틀레티|아틀레띠/i.test(team);

/** 흰 칸은 그 자체가 구분자 역할을 하므로 옆에 또 흰 칸을 붙이지 않는다 */
const isWhitePanel = (cell: Cell) => cell.kind === 'panel' && cell.tone === 'white';

/**
 * 팀 약칭 — 스코어 묶음의 흰 칸에 들어간다.
 *
 * 실제 보드는 여기에 구단 엠블럼이 붙지만, 엠블럼과 대회 로고는 상표·저작물이라
 * 라이선스 없이 쓸 수 없다. 글자로 팀을 가리키는 건 지시적 사용이라 문제가 없다.
 */
function codeOf(team: string): string {
  const name = team.trim();
  if (isAtleti(name)) return 'ATM';

  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }
  return name.slice(0, 3).toUpperCase();
}

/**
 * 헤더 아래에 상시 켜져 있는 360도 LED 보드.
 *
 * 평상시에는 움직이지 않는다. 경기 시계가 보드 정중앙에 고정되고
 * 양옆으로 팀 약칭·득점, 그 바깥으로 구단명·대회명·경기장 이름이 대칭으로 깔린다.
 * 시계가 정확히 가운데에 오도록 좌우 칸은 폭을 맞춰 두었다.
 *
 * 골이 들어가면 그때만 보드가 흐른다 — 득점자 이름과 GOOOOOOOL이 지나간다.
 * 평소에 멈춰 있어야 이 순간이 사건으로 읽힌다.
 *
 * 칸 색: 스코어·시계·경기장 = 파랑/흰글자, 대회명 = 흰색/붉은글자,
 * 구단명 = 빨강/흰글자. 색 칸 사이에는 좁은 흰 칸이 하나씩 낀다.
 * 실물 보드는 흰 칸과 팀 자리에 로고가 들어가지만 전부 라이선스 대상이라 글자만 쓴다.
 */
export default function LedStrip({
  mode = 'idle',
  homeTeam = 'Atlético de Madrid',
  awayTeam = 'Rival',
  homeScore = 0,
  awayScore = 0,
  competition,
  venue = DEFAULT_VENUE,
  clock,
  kickoff,
  scorer,
}: LedStripProps) {
  const atletiName = isAtleti(homeTeam) ? homeTeam : awayTeam;

  // 시계는 이 안에서만 돌린다 — 위로 올리면 1초마다 채팅 전체가 다시 그려진다.
  // 첫 값을 setTimeout으로 미루는 이유: effect 본문에서 곧바로 setState하면
  // 연쇄 렌더를 유발하고, 렌더 중 Date.now()를 읽는 것도 순수하지 않아 둘 다 피한다.
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (clock || !kickoff) return;
    const update = () => setNow(Date.now());
    const first = setTimeout(update, 0);
    const timer = setInterval(update, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [clock, kickoff]);

  const clockText =
    clock ?? (kickoff && now ? formatMatchClock(kickoff, now) : null);

  /**
   * 스코어 묶음 — [득점][홈 약칭][시계][원정 약칭][득점].
   * 양옆 칸의 폭을 고정해 두어야 약칭 길이(ATM/RB)가 달라도 시계가 가운데에 선다.
   */
  const renderScore = (key: string) => (
    <span className="led-strip__score" key={key}>
      <span className="led-strip__cell led-strip__cell--blue led-strip__cell--num">
        <span className="led-strip__num">{homeScore}</span>
      </span>
      <span className="led-strip__cell led-strip__cell--code">
        <span className={`led-strip__code ${isAtleti(homeTeam) ? 'is-atleti' : 'is-rival'}`}>
          {codeOf(homeTeam)}
        </span>
      </span>
      <span className="led-strip__cell led-strip__cell--blue led-strip__cell--clock">
        <span className="led-strip__clock">{clockText ?? '—'}</span>
      </span>
      <span className="led-strip__cell led-strip__cell--code">
        <span className={`led-strip__code ${isAtleti(awayTeam) ? 'is-atleti' : 'is-rival'}`}>
          {codeOf(awayTeam)}
        </span>
      </span>
      <span className="led-strip__cell led-strip__cell--blue led-strip__cell--num">
        <span className="led-strip__num">{awayScore}</span>
      </span>
    </span>
  );

  // ── 골 연출: 이때만 보드가 흐른다 ──────────────────────────
  const goalCells = useMemo<Cell[]>(() => {
    const list: Cell[] = [
      { kind: 'score' },
      { kind: 'panel', tone: 'red', text: 'GOOOOOOOL!!!' },
      ...(scorer ? ([{ kind: 'panel', tone: 'white', text: scorer }] as Cell[]) : []),
      { kind: 'panel', tone: 'red', text: '¡GOL DEL ATLETI!' },
      { kind: 'score' },
      { kind: 'panel', tone: 'red', text: 'AÚPA ATLETI' },
    ];

    // 색 칸 사이마다 좁은 흰 칸을 끼워 넣는다. 흰 칸 옆은 건너뛴다 —
    // 흰 판에 또 흰 칸을 붙이면 그냥 넓은 여백이 된다.
    // 목록 끝과 처음 사이에도 넣어야 반복될 때 이음새가 보이지 않는다.
    const out: Cell[] = [];
    list.forEach((cell, i) => {
      if (i > 0 && !isWhitePanel(cell) && !isWhitePanel(list[i - 1])) {
        out.push({ kind: 'gap' });
      }
      out.push(cell);
    });
    if (!isWhitePanel(list[list.length - 1]) && !isWhitePanel(list[0])) {
      out.push({ kind: 'gap' });
    }
    return out;
  }, [scorer]);

  // 한 벌이 보드 너비보다 짧으면 -50% 지점에서 빈 구간이 보인다.
  const goalRun = useMemo<Cell[]>(() => {
    const out: Cell[] = [];
    while (out.length < 24) out.push(...goalCells);
    return out;
  }, [goalCells]);

  const renderCell = (cell: Cell, key: string) => {
    if (cell.kind === 'gap') {
      return <span className="led-strip__cell led-strip__cell--gap" key={key} />;
    }
    if (cell.kind === 'score') {
      return renderScore(key);
    }
    return (
      <span className={`led-strip__cell led-strip__cell--${cell.tone}`} key={key}>
        <span className="led-strip__text">{cell.text}</span>
      </span>
    );
  };

  const body =
    mode === 'goal' ? (
      <div className="led-strip__track">
        {['a', 'b'].map((runKey) => (
          <span className="led-strip__run" key={runKey}>
            {goalRun.map((cell, i) => renderCell(cell, `${runKey}-${i}`))}
          </span>
        ))}
      </div>
    ) : (
      // 평상시 — 정지된 대칭 배치. 가운데가 시계다.
      <div className="led-strip__static">
        <span className="led-strip__cell led-strip__cell--white led-strip__cell--fill">
          <span className="led-strip__text">{competition ?? venue}</span>
        </span>
        <span className="led-strip__cell led-strip__cell--red">
          <span className="led-strip__text">{atletiName}</span>
        </span>
        <span className="led-strip__cell led-strip__cell--gap" />
        {renderScore('score')}
        <span className="led-strip__cell led-strip__cell--gap" />
        <span className="led-strip__cell led-strip__cell--red">
          <span className="led-strip__text">{atletiName}</span>
        </span>
        <span className="led-strip__cell led-strip__cell--white led-strip__cell--fill">
          <span className="led-strip__text">{competition ?? venue}</span>
        </span>
      </div>
    );

  return (
    <div className="led-strip" data-mode={mode} role="presentation" aria-hidden="true">
      {/* 아래에서 올려다보는 각도 — 아랫단이 앞으로 나오고 윗단이 뒤로 물러난다 */}
      <div className="led-strip__tilt">
        {body}
        {/* 픽셀 격자 한 겹. 가까이서 보면 LED 패널로 읽히고, 멀리서는 안 보일 만큼만 얕다 */}
        <span className="led-strip__pixels" />
        {/* 판의 입체 — 윗면 그늘, 앞으로 나온 아랫단의 빛 */}
        <span className="led-strip__form" />
        {/* 링의 맞은편이 멀어 보이도록 가운데를 눌러주는 겹 */}
        <span className="led-strip__depth" />
      </div>
    </div>
  );
}
