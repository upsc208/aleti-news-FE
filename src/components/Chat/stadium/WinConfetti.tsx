'use client';

import { useEffect, useRef } from 'react';

import { createWinConfetti, type WinConfettiHandle } from './winConfettiCanvas';

interface WinConfettiProps {
  /** 승리 연출 중인가 — useGoalCelebration의 winning을 그대로 넘긴다 */
  active: boolean;
}

/**
 * 이겼을 때 방 위로 쏟아지는 흰색·빨간색 색종이.
 *
 * 모션을 줄인 사용자에게는 아무것도 렌더하지 않는다.
 * 골 연출과 달리 화면을 어둡게 누르지 않는다 — 연출이 길어서(기본 9초)
 * 그동안 채팅이 계속 읽혀야 한다.
 */
export default function WinConfetti({ active }: WinConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<WinConfettiHandle | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const handle = createWinConfetti(canvas);
    if (!handle) return;

    handleRef.current = handle;

    return () => {
      handle.dispose();
      handleRef.current = null;
    };
  }, []);

  useEffect(() => {
    handleRef.current?.setActive(active);
  }, [active]);

  return <canvas ref={canvasRef} className="stadium-confetti" aria-hidden="true" />;
}
