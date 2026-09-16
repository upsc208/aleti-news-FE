'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  DEFAULT_VENUE,
  formatMatchClock,
  type MatchPeriods,
  isAtleti,
  resolveLedMode,
  type BoardSpec,
  type LedMode,
  type SubEvent,
} from './boardModel';
import { latinCode, latinCompetition, latinTeam } from './boardNames';
import { createLedRing, type LedRingHandle } from './ledRingGL';

/** 교체 보드 등장에 이름이 모이는 시간 */
const SUB_SLIDE_MS = 450;

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
  /** 실제 전·후반 시작 시각. 있으면 예정 킥오프보다 이쪽이 정확하다 */
  periods?: MatchPeriods | null;
  /** 서버가 주는 경기 상태(`경기전`·`경기중`·`전반종료`…). 공이 굴렀는지 판정에 쓴다 */
  status?: string | null;
  /** 관리자가 올린 문구 — `mode === 'message'`일 때만 쓰인다 */
  message?: string;
  /** 교체 화면에 그릴 내용 — `mode === 'sub'`일 때만 쓰인다 */
  sub?: SubEvent;
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
  periods,
  status,
  sub,
  message,
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

  /*
    교체 보드 등장 — 이름 두 개가 바깥에서 가운데로 모인다.

    글자가 텍스처 안에 있어서 **다시 굽는 것 말고는 움직일 방법이 없다.** 보드가 휜 링이라
    CSS로 덧씌워도 글자 위치에 안 맞는다. 그래서 등장 0.45초 동안만 진행도를 굴리고
    멈춘다 — 60fps로 쳐도 스물몇 장이고, 골 연출처럼 내내 도는 비용이 아니다
    (aleti-news-BE/docs/round1.md의 GPU 항목).
  */
  const [subPhase, setSubPhase] = useState(1);
  useEffect(() => {
    if (mode !== 'sub' || !sub) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setSubPhase(1);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / SUB_SLIDE_MS);
      setSubPhase(t);
      if (t < 1) raf = requestAnimationFrame(step);
    };

    setSubPhase(0);
    raf = requestAnimationFrame(step);

    /*
      배경 탭에서는 requestAnimationFrame이 멈춘다. 그대로 두면 이름이 바깥에 나간 채로
      굳고, 사용자가 탭으로 돌아왔을 때 반쯤 그려진 보드를 보게 된다.
      끝나야 할 시각에 한 번 더 못을 박아 둔다 — 이미 끝났으면 같은 값이라 아무 일도 없다.
    */
    const settle = setTimeout(() => setSubPhase(1), SUB_SLIDE_MS + 120);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
  }, [mode, sub]);

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

  const clockText = clock ?? (now ? formatMatchClock(kickoff ?? '', now, periods, status) : null);
  // 킥오프 전에는 스코어보드 대신 후원 보드가 선다 (boardModel.resolveLedMode)
  const boardMode = resolveLedMode(mode, clockText, Boolean(clock) || now > 0);

  const spec = useMemo<BoardSpec>(() => {
    return {
      mode: boardMode,
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
      message,
      sub,
      subPhase,
    };
  }, [
    boardMode, competition, venue, clockText, sub, subPhase, message,
    homeTeam, awayTeam, homeScore, awayScore, scorer,
  ]);

  useEffect(() => {
    if (!ready) return;
    handleRef.current?.setSpec(spec);
  }, [ready, spec]);

  return (
    <div className="led-ring" data-mode={boardMode} role="presentation" aria-hidden="true">
      <canvas ref={canvasRef} className="led-ring__canvas" />

    </div>
  );
}
