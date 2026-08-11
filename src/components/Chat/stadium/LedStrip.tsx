'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { DEFAULT_VENUE, formatMatchClock, isAtleti, type LedMode } from './boardModel';
import { latinCode, latinCompetition, latinPlayer, latinTeam } from './boardNames';

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

/** 골 연출 때 흐르는 판 한 장. tone은 CSS의 .led-strip__cell--{tone} 이다 */
interface GoalPanel {
  tone: 'red' | 'scorer';
  text: string;
}

/**
 * 헤더 아래에 상시 켜져 있는 360도 LED 보드.
 *
 * 평상시에는 움직이지 않는다. 경기 시계가 보드 정중앙에 고정되고
 * 양옆으로 팀 약칭·득점, 그 바깥으로 구단명·대회명·경기장 이름이 대칭으로 깔린다.
 * 시계가 정확히 가운데에 오도록 좌우 칸은 폭을 맞춰 두었다.
 *
 * 골이 들어가면 그때만 보드가 흐른다 — 흰 판의 득점자 이름(파란 글자)과
 * 빨간 판의 함성, 두 장만 번갈아 지나간다. 두 판은 폭이 같고 맞닿는 자리는
 * 그라데이션으로 이어진다(globals.css). 평소에 멈춰 있어야 이 순간이 사건으로 읽힌다.
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
  // 보드는 실물처럼 라틴 표기다 — 화면의 나머지는 한국어 그대로다 (boardNames.ts)
  const atletiName = latinTeam(isAtleti(homeTeam) ? homeTeam : awayTeam);
  const competitionText = latinCompetition(competition, venue);

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
          {latinCode(homeTeam)}
        </span>
      </span>
      <span className="led-strip__cell led-strip__cell--blue led-strip__cell--clock">
        <span className="led-strip__clock">{clockText ?? '—'}</span>
      </span>
      <span className="led-strip__cell led-strip__cell--code">
        <span className={`led-strip__code ${isAtleti(awayTeam) ? 'is-atleti' : 'is-rival'}`}>
          {latinCode(awayTeam)}
        </span>
      </span>
      <span className="led-strip__cell led-strip__cell--blue led-strip__cell--num">
        <span className="led-strip__num">{awayScore}</span>
      </span>
    </span>
  );

  // ── 골 연출: 이때만 보드가 흐른다 ──────────────────────────
  // 흰 판에 득점자(파란 글자), 빨간 판에 GOOOOOOOL!!!! — 이 두 장만 번갈아 흐른다.
  // 스코어·대회명·구분 칸은 넣지 않는다. 골이 터진 순간에 읽을 것이 적을수록 세다.
  const goalPanels = useMemo<GoalPanel[]>(() => {
    const shout: GoalPanel = { tone: 'red', text: 'GOOOOOOOL!!!!' };
    // 득점자를 모르는 골(서버가 이름을 안 준 경우)에는 함성만 흐른다
    return scorer ? [{ tone: 'scorer', text: latinPlayer(scorer) }, shout] : [shout];
  }, [scorer]);

  // 한 벌이 보드 너비보다 짧으면 -50% 지점에서 빈 구간이 드러난다.
  // 다만 판이 두 장뿐이라 예전(24칸)만큼 늘리면 띠가 길어진 만큼 스크롤이 빨라진다 —
  // 애니메이션은 길이와 무관하게 10초에 -50%를 가므로, 보드를 덮을 만큼만 채운다.
  const goalRun = useMemo<GoalPanel[]>(() => {
    const out: GoalPanel[] = [];
    while (out.length < 6) out.push(...goalPanels);
    return out;
  }, [goalPanels]);

  const body =
    mode === 'goal' ? (
      <div className="led-strip__track">
        {['a', 'b'].map((runKey) => (
          <span className="led-strip__run" key={runKey}>
            {goalRun.map((panel, i) => (
              <span
                className={`led-strip__cell led-strip__cell--${panel.tone}`}
                key={`${runKey}-${i}`}
              >
                <span className="led-strip__text">{panel.text}</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    ) : (
      // 평상시 — 정지된 대칭 배치. 가운데가 시계다.
      <div className="led-strip__static">
        <span className="led-strip__cell led-strip__cell--white led-strip__cell--fill">
          <span className="led-strip__text">{venue}</span>
        </span>
        <span className="led-strip__cell led-strip__cell--red">
          <span className="led-strip__text">{atletiName}</span>
        </span>
        <span className="led-strip__cell led-strip__cell--league">
          <span className="led-strip__text">{competitionText}</span>
        </span>
        {renderScore('score')}
        <span className="led-strip__cell led-strip__cell--league">
          <span className="led-strip__text">{competitionText}</span>
        </span>
        <span className="led-strip__cell led-strip__cell--red">
          <span className="led-strip__text">{atletiName}</span>
        </span>
        <span className="led-strip__cell led-strip__cell--white led-strip__cell--fill">
          <span className="led-strip__text">{venue}</span>
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
