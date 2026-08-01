'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MessageSquareText } from 'lucide-react';
import fichadoImg from '../../../public/fichado.png';

interface TributeBadgeProps {
  stats?: {
    label: string;
    value: string | number;
  }[];
}

export default function TributeBadge({ stats }: TributeBadgeProps) {
  const router = useRouter();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const isLongPressTriggered = useRef<boolean>(false);

  const LONG_PRESS_DURATION = 1000; // 1 second threshold

  const cancelPress = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsPressing(false);
    setPressProgress(0);
  }, []);

  const startPress = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default context menu or drag if needed
    isLongPressTriggered.current = false;
    startTimeRef.current = Date.now();
    setIsPressing(true);
    setPressProgress(0);

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(100, (elapsed / LONG_PRESS_DURATION) * 100);
      setPressProgress(progress);

      if (progress < 100) {
        animFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateProgress);

    timerRef.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(50);
      }
      setIsPressing(false);
      setPressProgress(100);
      router.push('/chat');
    }, LONG_PRESS_DURATION);
  }, [router]);

  const endPress = useCallback(() => {
    if (isLongPressTriggered.current) {
      cancelPress();
      return;
    }

    const pressDuration = Date.now() - startTimeRef.current;
    cancelPress();

    // If it was a short click (< 300ms), do normal flip on mobile
    if (pressDuration < 300) {
      if (window.innerWidth < 768) {
        setIsFlipped((prev) => !prev);
      }
    }
  }, [cancelPress]);

  return (
    <div
      className="relative group cursor-pointer w-[84px] md:w-[98px] h-12 md:h-14 [perspective:1000px] shrink-0 select-none"
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchCancel={cancelPress}
      title="1초 이상 누르면 라이브 채팅방으로 이동합니다 (베타)"
    >
      {/* Visual Feedback during long press hold */}
      {isPressing && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap">
          <div className="bg-aleti-navy/95 dark:bg-[#161824] text-white dark:text-volt text-[10px] font-black px-2 py-1 rounded-md shadow-xl border border-aleti-red/50 dark:border-volt/40 flex items-center gap-1 animate-bounce">
            <MessageSquareText size={12} className="text-aleti-red dark:text-volt animate-pulse" />
            <span>라이브 채팅 입장 중... ({Math.round(pressProgress)}%)</span>
          </div>
        </div>
      )}

      {/* Outer container with glowing progress border on press */}
      <div
        className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        } md:group-hover:[transform:rotateY(180deg)] md:group-hover:!rotate-y-180 ${
          isPressing ? 'scale-105' : ''
        }`}
      >
        {/* Progress Ring / Border effect */}
        {isPressing && (
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-aleti-red via-white to-volt opacity-80 blur-xs animate-pulse z-0" />
        )}

        {/* Front: Image only */}
        <div className="absolute inset-0 [backface-visibility:hidden] bg-white dark:bg-[#0a0b10] rounded-2xl border border-gray-100 dark:border-volt/10 shadow-sm transition-all md:group-hover:border-aleti-red/20 dark:md:group-hover:border-volt/15 overflow-hidden z-10">
          <Image
            src={fichadoImg}
            alt="Fichado"
            fill
            className="object-cover object-center"
            placeholder="blur"
            priority
          />
          {/* Fill overlay during press */}
          {isPressing && (
            <div
              className="absolute inset-0 bg-aleti-red/30 dark:bg-volt/20 backdrop-blur-[1px] transition-all"
              style={{ opacity: pressProgress / 100 }}
            />
          )}
        </div>

        {/* Back: Welcome Message */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-aleti-red dark:bg-[#0a0b10] dark:border dark:border-volt/20 rounded-2xl flex items-center justify-center px-1.5 text-white dark:text-volt shadow-lg z-10">
          <span className="text-[10px] md:text-[12px] font-black tracking-normal text-center leading-none uppercase font-sans">
            ¡BIENVENIDOS!
          </span>
        </div>
      </div>
    </div>
  );
}

