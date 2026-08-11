'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const CELEBRATION_MS = 6000;

/** 모션을 줄이기로 한 사용자에게는 흔들림도 진동도 주지 않는다 */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * 골 연출 상태.
 *
 * 화면 전체(LED·배경·흔들림)가 같은 신호를 봐야 하므로 한 곳에서 관리한다.
 * 아직 골을 알려주는 API가 없어서 celebrate()를 부르는 건 개발용 미리보기뿐이지만,
 * 이벤트 채널이 생기면 수신부에서 이 함수만 부르면 된다.
 */
export function useGoalCelebration() {
  const [celebrating, setCelebrating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setCelebrating(false);
  }, []);

  const celebrate = useCallback((durationMs: number = CELEBRATION_MS) => {
    setCelebrating(true);

    if (!prefersReducedMotion() && typeof navigator !== 'undefined') {
      // 골 순간의 체감은 진동이 절반이다. 지원 안 하는 기기는 조용히 무시된다.
      navigator.vibrate?.([90, 60, 90, 60, 220]);
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setCelebrating(false);
    }, durationMs);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { celebrating, celebrate, stop };
}
