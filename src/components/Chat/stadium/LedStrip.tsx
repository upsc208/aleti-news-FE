'use client';

import React, { useEffect, useMemo, useState } from 'react';

import {
  DEFAULT_VENUE,
  formatMatchClock,
  isAtleti,
  PRE_LG,
  PRE_SPONSOR,
  resolveLedMode,
  type LedMode,
  type MatchPeriods,
  type SubEvent,
} from './boardModel';
import { latinCode, latinCompetition, latinPlayer, latinTeam } from './boardNames';

interface LedStripProps {
  mode?: LedMode;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  competition?: string;
  venue?: string;
  clock?: string;
  kickoff?: string;
  periods?: MatchPeriods | null;
  status?: string | null;
  message?: string;
  sub?: SubEvent;
  scorer?: string;
}

interface GoalPanel {
  tone: 'red' | 'scorer' | 'in' | 'out' | 'arrow-in' | 'arrow-out';
  text: string;
}

/**
 * 헤더 아래에 상시 켜져 있는 360도 LED 보드(CSS).
 * 평상시는 시계가 정중앙에 선 정지 배치, 골·교체·관리자 문구·킥오프 전에는 해당 판이 흐른다.
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
  periods,
  status,
  sub,
  message,
  scorer,
}: LedStripProps) {
  const atletiName = latinTeam(isAtleti(homeTeam) ? homeTeam : awayTeam);
  const competitionText = latinCompetition(competition, venue);

  const [now, setNow] = useState(0);
  useEffect(() => {
    if (clock || (!kickoff && !periods)) return;
    const update = () => setNow(Date.now());
    const first = setTimeout(update, 0);
    const timer = setInterval(update, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [clock, kickoff, periods]);

  const clockText =
    clock ?? (now ? formatMatchClock(kickoff ?? '', now, periods, status) : null);

  const boardMode = resolveLedMode(mode, clockText, Boolean(clock) || now > 0);

  const venueWords = venue.trim().split(' ').filter(Boolean);
  const venueLead = venueWords.length > 1 ? venueWords.slice(0, -1).join(' ') : '';
  const venueTail = venueWords[venueWords.length - 1];

  const venueCell = (cellKey: string, bar?: 'left' | 'right') => (
    <span
      className={`led-strip__cell led-strip__cell--venue ${bar ? `led-strip__cell--bar-${bar}` : ''}`}
      key={cellKey}
    >
      <span className="led-strip__text">
        <span className="led-strip__strong">{venueLead}</span>
        {venueLead ? ' ' : ''}
        {venueTail}
      </span>
    </span>
  );

  const league = competitionText.toUpperCase();
  const isLaliga = league.startsWith('LALIGA');
  const isUcl = league.includes('CHAMPIONS LEAGUE');
  const leagueCell = (cellKey: string) =>
    isLaliga ? (
      <span className="led-strip__cell led-strip__cell--laliga" key={cellKey}>
        <span className="led-strip__text">LALIGA</span>
        <span className="led-strip__ea">EA</span>
      </span>
    ) : isUcl ? (
      <span className="led-strip__cell led-strip__cell--ucl" key={cellKey}>
        <span className="led-strip__text">{competitionText}</span>
      </span>
    ) : (
      <span className="led-strip__cell led-strip__cell--league" key={cellKey}>
        <span className="led-strip__text">{competitionText}</span>
      </span>
    );

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

  const goalPanels = useMemo<GoalPanel[]>(() => {
    const shout: GoalPanel = { tone: 'red', text: 'GOOOOOOOL!!!!' };
    const name = scorer ? latinPlayer(scorer) : '';
    return name ? [{ tone: 'scorer', text: name }, shout] : [shout];
  }, [scorer]);

  const goalRun = useMemo<GoalPanel[]>(() => {
    const out: GoalPanel[] = [];
    while (out.length < 6) out.push(...goalPanels);
    return out;
  }, [goalPanels]);

  const subSet = useMemo<GoalPanel[]>(() => {
    if (!sub) return [];
    return [
      { tone: 'scorer', text: latinPlayer(sub.playerIn) },
      { tone: 'arrow-in', text: '>>>' },
      { tone: 'in', text: 'IN' },
      { tone: 'out', text: 'OUT' },
      { tone: 'arrow-out', text: '<<<' },
      { tone: 'scorer', text: latinPlayer(sub.playerOut) },
    ];
  }, [sub]);

  const messageRun = message?.trim();

  // 모드별 보드 내용 — message·goal·pre는 흐르고, sub는 한 벌로 서고, 그 외는 정지 배치
  const body =
    boardMode === 'message' && messageRun ? (
      <div className="led-strip__track">
        {['a', 'b'].map((runKey) => (
          <span className="led-strip__run" key={runKey}>
            <span className="led-strip__cell led-strip__cell--message">
              <span className="led-strip__text">{messageRun}</span>
            </span>
          </span>
        ))}
      </div>
    ) :
    boardMode === 'sub' && subSet.length ? (
      <div className="led-strip__sub">
        {subSet.map((panel, i) => (
          <span className={`led-strip__cell led-strip__cell--${panel.tone}`} key={i}>
            <span className="led-strip__text">{panel.text}</span>
          </span>
        ))}
      </div>
    ) : boardMode === 'goal' ? (
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
    ) : boardMode === 'pre' ? (
      <div className="led-strip__track">
        {['a', 'b'].map((runKey) => (
          <span className="led-strip__run" key={runKey}>
            {[0, 1, 2].map((run) => (
              <React.Fragment key={run}>
                <span className="led-strip__cell led-strip__cell--club">
                  <span className="led-strip__text">{atletiName}</span>
                </span>
                <span className="led-strip__cell led-strip__cell--lg">
                  <span className="led-strip__text">{PRE_LG}</span>
                </span>
                {venueCell(`${runKey}${run}-venue`)}
                <span className="led-strip__cell led-strip__cell--sponsor">
                  {PRE_SPONSOR.split(' ').map((word) => (
                    <span className="led-strip__text" key={word}>
                      {word}
                    </span>
                  ))}
                </span>
              </React.Fragment>
            ))}
          </span>
        ))}
      </div>
    ) : (
      <div className="led-strip__static">
        <span className="led-strip__cell led-strip__cell--red led-strip__cell--fill">
          <span className="led-strip__text">{atletiName}</span>
        </span>
        {venueCell('venue-left', 'left')}
        {leagueCell('league-left')}
        {renderScore('score')}
        {leagueCell('league-right')}
        {venueCell('venue-right', 'right')}
        <span className="led-strip__cell led-strip__cell--red led-strip__cell--fill">
          <span className="led-strip__text">{atletiName}</span>
        </span>
      </div>
    );

  return (
    <div className="led-strip" data-mode={boardMode} role="presentation" aria-hidden="true">
      <div className="led-strip__tilt">
        {body}
        <span className="led-strip__pixels" />
        <span className="led-strip__form" />
        <span className="led-strip__depth" />
      </div>
    </div>
  );
}
