'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  DEFAULT_VENUE,
  formatMatchClock,
  isAtleti,
  type BoardSpec,
  type LedMode,
} from './boardModel';
import { latinCode, latinCompetition, latinTeam } from './boardNames';
import { createLedRing, type LedRingHandle } from './ledRingGL';

interface LedRingProps {
  mode?: LedMode;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  competition?: string;
  venue?: string;
  clock?: string;
  kickoff?: string;
  scorer?: string;
  /**
   * WebGL을 못 쓸 때 한 번 불린다. 보드는 다른 연출과 달리 빠지면
   * 그 자리가 빈 공간으로 남으므로, 호출부가 CSS 보드로 되돌려야 한다.
   */
  onUnavailable?: () => void;
}

/**
 * LED 보드의 WebGL 판 — 진짜 곡면.
 *
 * LedStrip과 프로퍼티가 같아서 그 자리에 그대로 끼워 넣을 수 있다.
 * 다른 점은 하나뿐이다: 여기서는 맞은편(화면 가운데) 글자가 실제로 눌린다.
 *
 * WebGL을 못 쓰면 onUnavailable로 알린다. 호출부는 LedStrip으로 되돌려야 한다 —
 * 조명이나 색종이는 빠져도 나머지가 남지만, 보드는 빠지면 빈 자리가 드러난다.
 */
export default function LedRing({
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
  onUnavailable,
}: LedRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<LedRingHandle | null>(null);
  const [ready, setReady] = useState(false);

  // 아래 마운트 effect는 한 번만 돌아야 하므로(GL 컨텍스트를 만든다) 콜백을 ref로 받는다.
  // 호출부가 useCallback을 잊어도 컨텍스트가 매 렌더 다시 만들어지지 않는다.
  // effect는 선언 순서대로 도니 이 줄이 마운트 effect보다 먼저 채워진다.
  const unavailableRef = useRef(onUnavailable);
  useEffect(() => {
    unavailableRef.current = onUnavailable;
  }, [onUnavailable]);

  // 시계는 이 안에서만 돌린다 — 위로 올리면 1초마다 채팅 전체가 다시 그려진다.
  // (LedStrip과 같은 이유로 첫 값을 setTimeout으로 미룬다)
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handle = createLedRing(canvas);
    if (!handle) {
      unavailableRef.current?.();
      return;
    }

    handleRef.current = handle;
    setReady(true);

    return () => {
      handle.dispose();
      handleRef.current = null;
      setReady(false);
    };
  }, []);

  const spec = useMemo<BoardSpec>(() => {
    const clockText = clock ?? (kickoff && now ? formatMatchClock(kickoff, now) : null);
    return {
      mode,
      // 보드는 실물처럼 라틴 표기다 — 화면의 나머지는 한국어 그대로다 (boardNames.ts)
      competition: latinCompetition(competition, venue).toUpperCase(),
      venue: venue.toUpperCase(),
      clock: clockText ?? '—',
      atletiName: latinTeam(isAtleti(homeTeam) ? homeTeam : awayTeam),
      homeCode: latinCode(homeTeam),
      awayCode: latinCode(awayTeam),
      homeIsAtleti: isAtleti(homeTeam),
      awayIsAtleti: isAtleti(awayTeam),
      homeScore,
      awayScore,
      scorer,
    };
  }, [
    mode, competition, venue, clock, kickoff, now,
    homeTeam, awayTeam, homeScore, awayScore, scorer,
  ]);

  useEffect(() => {
    if (!ready) return;
    handleRef.current?.setSpec(spec);
  }, [ready, spec]);

  return (
    <div className="led-ring" data-mode={mode} role="presentation" aria-hidden="true">
      <canvas ref={canvasRef} className="led-ring__canvas" />
    </div>
  );
}
