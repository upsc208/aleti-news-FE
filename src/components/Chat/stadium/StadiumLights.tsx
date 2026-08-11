'use client';

import { useEffect, useRef, useState } from 'react';

import { createStadiumLights, type StadiumLightsHandle } from './stadiumLightsGL';

interface StadiumLightsProps {
  /** 골 연출 중인가 — useGoalCelebration의 celebrating을 그대로 넘긴다 */
  active: boolean;
  /** 배경 흐리게(washed) — 가독성을 고른 사용자에게는 빛도 죽인다 */
  dimmed?: boolean;
}

/**
 * 골이 터지면 지붕 조명이 붉고 분홍빛으로 스탠드를 훑는다.
 *
 * WebGL을 못 쓰거나 모션을 줄인 사용자에게는 아무것도 렌더하지 않는다.
 * 이 층이 빠져도 흔들림·섬광·진동은 그대로 남으므로 골 연출이 사라지지는 않는다.
 */
export default function StadiumLights({ active, dimmed = false }: StadiumLightsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<StadiumLightsHandle | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 모션을 줄이기로 한 사용자에게는 컨텍스트조차 만들지 않는다
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const handle = createStadiumLights(canvas);
    if (!handle) return;

    handleRef.current = handle;
    setReady(true);

    return () => {
      handle.dispose();
      handleRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    handleRef.current?.setActive(active);
  }, [active]);

  useEffect(() => {
    handleRef.current?.setDimmed(dimmed);
  }, [dimmed]);

  return (
    <div
      className="stadium-lights"
      data-active={ready && active ? 'true' : 'false'}
      data-dimmed={dimmed ? 'true' : 'false'}
      aria-hidden="true"
    >
      {/* 빛이 보이려면 경기장이 먼저 어두워져야 한다 (globals.css 주석 참고).
          캔버스가 못 뜬 경우에는 이 층도 뜨지 않아야 배경만 까매지지 않는다 */}
      <div className="stadium-lights__dim" />
      <canvas ref={canvasRef} className="stadium-lights__canvas" />
    </div>
  );
}
