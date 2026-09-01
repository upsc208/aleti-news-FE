'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const CELEBRATION_MS = 7000;

/** 승리 연출은 골보다 길다 — 색종이가 화면을 한 번 채우고 빠지려면 이 정도는 걸린다 */
const WIN_MS = 15000;

/** 모션을 줄이기로 한 사용자에게는 흔들림도 진동도 주지 않는다 */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * 방의 연출 상태 — 골과 승리.
 *
 * 화면 전체(LED·배경·흔들림·조명·색종이)가 같은 신호를 봐야 하므로 한 곳에서 관리한다.
 * 아직 골도 경기 종료도 알려주는 API가 없어서 지금 이 함수들을 부르는 건
 * 개발용 테스트 바뿐이지만, 이벤트 채널이 생기면 수신부에서 그대로 부르면 된다.
 *
 * 둘을 따로 두는 이유: 승리는 골이 아니다. 흔들림·섬광·조명은 7초짜리 사건에
 * 어울리는 연출이고, 승리는 그보다 길고 잔잔해야 그동안 채팅이 읽힌다.
 */
export function useGoalCelebration() {
  const [celebrating, setCelebrating] = useState(false);
  const [winning, setWinning] = useState(false);

  const goalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const winTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (goalTimerRef.current) clearTimeout(goalTimerRef.current);
    if (winTimerRef.current) clearTimeout(winTimerRef.current);
    goalTimerRef.current = null;
    winTimerRef.current = null;
    setCelebrating(false);
    setWinning(false);
  }, []);

  const celebrate = useCallback((durationMs: number = CELEBRATION_MS) => {
    setCelebrating(true);

    if (!prefersReducedMotion() && typeof navigator !== 'undefined') {
      // 골 순간의 체감은 진동이 절반이다. 지원 안 하는 기기는 조용히 무시된다.
      navigator.vibrate?.([90, 60, 90, 60, 220]);
    }

    if (goalTimerRef.current) clearTimeout(goalTimerRef.current);
    goalTimerRef.current = setTimeout(() => {
      goalTimerRef.current = null;
      setCelebrating(false);
    }, durationMs);
  }, []);

  /** 경기 승리 — 색종이가 쏟아진다 */
  const celebrateWin = useCallback((durationMs: number = WIN_MS) => {
    setWinning(true);

    if (!prefersReducedMotion() && typeof navigator !== 'undefined') {
      // 골보다 길고 느슨한 박자 — 사건이 아니라 마무리다
      navigator.vibrate?.([140, 90, 140, 90, 320]);
    }

    if (winTimerRef.current) clearTimeout(winTimerRef.current);
    winTimerRef.current = setTimeout(() => {
      winTimerRef.current = null;
      // 여기서 끄는 건 '뿌리기'까지다. 이미 떨어지고 있는 색종이는
      // 화면 밖으로 나갈 때까지 계속 떨어진다 (winConfetti.ts 참고).
      setWinning(false);
    }, durationMs);
  }, []);

  useEffect(() => {
    return () => {
      if (goalTimerRef.current) clearTimeout(goalTimerRef.current);
      if (winTimerRef.current) clearTimeout(winTimerRef.current);
    };
  }, []);

  return { celebrating, celebrate, winning, celebrateWin, stop };
}
