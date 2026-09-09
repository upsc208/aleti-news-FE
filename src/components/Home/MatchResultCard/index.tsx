'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PawPrint, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Sparkles, Newspaper } from 'lucide-react';
import type { RecentMatch, UpcomingMatch, HeadlineResponse } from '@/client/types.gen';
import { sortScorers, formatKST } from './utils';
import { ScoreSection } from './ScoreSection';
import { ScorersSection } from './ScorersSection';
import { UpcomingSection } from './UpcomingSection';
import { StatsSection } from './StatsSection';
import { TacticalField } from './TacticalField';
import { MatchEvents } from './MatchEvents';
import PlayerRatingsSection from './PlayerRatingsSection';

interface MatchResultCardProps {
  recentMatch?: RecentMatch | null;
  upcomingMatches?: UpcomingMatch[] | null;
  headlines?: HeadlineResponse[] | null;
}

/** 자동으로 다음 장으로 넘어가기까지 (ms) */
const AUTOPLAY_MS = 7000;

export default function MatchResultCard({ recentMatch, upcomingMatches, headlines }: MatchResultCardProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * 자동 넘김 — 사람이 한 번이라도 직접 넘기면 멈춘다.
   *
   * 잠깐 쉬었다 다시 도는 방식도 있지만, 그러면 읽고 있는 사람에게서 카드를 다시
   * 빼앗는다. 페이지를 고른 것은 "이걸 보겠다"는 뜻이라 그 뜻을 그대로 둔다.
   */
  const [autoPlay, setAutoPlay] = useState(true);
  const [hovered, setHovered] = useState(false);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    setAutoPlay(false);
  }, []);

  useEffect(() => {
    // 경기 결과가 없으면 2장은 안내 문구뿐이다 — 굳이 거기로 넘길 이유가 없다
    if (!autoPlay || hovered || isExpanded || !recentMatch) return;
    // 움직임을 줄여달라고 해둔 사람에게는 저절로 움직이는 화면을 주지 않는다
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const timer = setInterval(() => {
      // 안 보이는 탭에서는 넘기지 않는다 — 돌아왔을 때 엉뚱한 장이 떠 있게 된다
      if (document.hidden) return;
      setCurrentPage((page) => (page === 0 ? 1 : 0));
    }, AUTOPLAY_MS);

    return () => clearInterval(timer);
  }, [autoPlay, hovered, isExpanded, recentMatch]);

  // Touch swipe navigation (mobile): swipe left → next page, swipe right → previous
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    // Ignore taps and vertical scrolls; act only on a clear horizontal swipe
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    goToPage(dx < 0 ? 1 : 0);
  };

  // If there is no data at all, show the loading/fallback container
  if (!recentMatch && (!headlines || headlines.length === 0)) {
    return (
      <div className="bg-aleti-red dark:bg-[#111318] dark:border dark:border-volt/10 text-white p-6 md:p-8 rounded-xl shadow-lg w-full max-w-none font-sans tracking-wide flex flex-col items-center justify-center min-h-[250px] border border-white/10 dark-card-pattern">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="scale-[2.5] mb-2 opacity-50 animate-bounce">
            <PawPrint />
          </div>
          <h3 className="text-xl md:text-2xl font-black tracking-tighter opacity-90 animate-pulse">
            준비중입니다....
          </h3>
          <p className="text-xs md:text-sm font-medium opacity-60 uppercase tracking-widest">
            Data loading or currently unavailable
          </p>
        </div>
      </div>
    );
  }

  const sortedScorers = recentMatch ? sortScorers(recentMatch.scorers) : [];
  const homeScorers = sortedScorers.filter(s => s.isHome);
  const awayScorers = sortedScorers.filter(s => !s.isHome);

  const safeHeadlines = Array.isArray(headlines) ? headlines : [];

  // Always create a list of exactly 5 slots to keep the card height fixed
  const headlineList = Array.from({ length: 5 }, (_, i) => {
    if (safeHeadlines[i]) {
      return safeHeadlines[i];
    }
    return null;
  });

  return (
    <div className="bg-aleti-red dark:bg-[#111318] text-white rounded-xl shadow-lg w-full max-w-none font-sans tracking-wide flex flex-col overflow-hidden border border-white/10 dark:border-volt/10 transition-all duration-500 dark-card-pattern relative">
      
      {/* Main card content */}
      <div
        className="p-6 md:p-8 flex flex-col md:flex-row gap-8 md:gap-12 min-h-[280px] relative touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        /* 읽는 동안 카드가 넘어가지 않도록 — 마우스를 올려두면 멈춘다 */
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        
        {/* Left side: Match Result or Headlines (70%) - Divider border styled in Atlético Navy in light mode */}
        <div className="relative w-full md:w-[70%] flex flex-col pr-0 md:pr-8 md:border-r border-aleti-navy/30 dark:border-white/10">
          
          {/* Header Row: Title - Bottom border styled in Atlético Navy in light mode */}
          <div className="flex justify-between items-center mb-6 border-b border-aleti-navy/25 dark:border-white/10 pb-4 px-0">
            <div className="flex items-center gap-2">
              {currentPage === 0 ? (
                <>
                  <Sparkles className="text-volt dark:text-volt animate-pulse" size={16} />
                  <span className="text-xs md:text-sm font-black tracking-widest uppercase">
                    알레띠 헤드라인
                  </span>
                </>
              ) : (
                <>
                  <PawPrint className="text-white" size={16} />
                  <span className="text-xs md:text-sm font-black tracking-widest uppercase">
                    경기 결과
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Content Area — per-page horizontal padding keeps text clear of the ‹/› edge buttons */}
          <div className="flex-1 flex flex-col justify-center min-h-[160px]">
            {currentPage === 0 ? (
              /* Page 1: Headlines */
              <div className="flex flex-col gap-2.5 justify-center h-full animate-pageSlide">
                {headlineList.map((hl, idx) => {
                  if (hl) {
                    return (
                      <div 
                        key={hl.id} 
                        className="group flex items-center gap-3.5 p-3 rounded-lg border transition-all duration-300 bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 hover:border-l-white dark:hover:border-l-volt dark:bg-black/20 dark:border-white/[0.03] dark:hover:bg-black/35 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] border-l-2 border-l-transparent"
                      >
                        <span className="shrink-0 flex items-center justify-center w-5.5 h-5.5 rounded-md bg-white/15 dark:bg-volt/10 text-[10px] font-black text-white dark:text-volt tracking-tight group-hover:scale-105 transition-all shadow-sm">
                          {idx + 1}
                        </span>
                        <p className="text-sm font-semibold tracking-tight text-white/90 line-clamp-2 sm:line-clamp-1 flex-1 leading-snug">
                          {hl.content}
                        </p>
                        <span className="shrink-0 text-[10px] font-bold opacity-45 uppercase tracking-widest whitespace-nowrap hidden sm:inline-block">
                          {formatKST(hl.createdAt)}
                        </span>
                      </div>
                    );
                  }

                  // If there are no headlines at all, show the empty message in the 3rd row (index 2)
                  if (!headlines || headlines.length === 0) {
                    if (idx === 2) {
                      return (
                        <div key="empty-msg" className="flex items-center justify-center p-3 text-center text-white/40 dark:text-white/30 text-xs font-bold uppercase tracking-wider">
                          <Newspaper size={14} className="inline mr-2 animate-pulse" />
                          등록된 헤드라인이 없습니다.
                        </div>
                      );
                    }
                  }

                  // Transparent placeholder row to maintain exact height
                  return (
                    <div 
                      key={`spacer-${idx}`} 
                      className="flex items-center gap-3.5 p-3 rounded-lg border border-transparent select-none pointer-events-none opacity-0"
                    >
                      <span className="shrink-0 flex items-center justify-center w-5.5 h-5.5 rounded-md text-[10px]">
                        &nbsp;
                      </span>
                      <p className="text-sm font-semibold flex-1 leading-snug">
                        &nbsp;
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Page 2: Match Result */
              <div className="flex flex-col h-full justify-between animate-pageSlide px-3 md:px-0">
                {recentMatch ? (
                  <>
                    <ScoreSection 
                      homeTeam={recentMatch.homeTeam}
                      awayTeam={recentMatch.awayTeam}
                      homeScore={recentMatch.homeScore}
                      awayScore={recentMatch.awayScore}
                      matchDate={recentMatch.matchDate}
                      tournament={recentMatch.tournament}
                      isHome={recentMatch.isHome}
                    />

                    <ScorersSection 
                      homeScorers={homeScorers}
                      awayScorers={awayScorers}
                    />

                    {/* Horizontal divider line styled in Atlético Navy in light mode */}
                    <div className="order-4 md:order-3 border-t border-aleti-navy/30 dark:border-white/10 mb-4 mx-2"></div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center h-full">
                    <PawPrint size={36} className="opacity-30 mb-2 animate-bounce" />
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-50">
                      경기 결과 정보가 아직 없습니다.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Page Dots Indicator */}
          {/* 점 자체는 6px이라 터치 대상 최소 크기(24px)에 못 미친다.
              보이는 크기는 그대로 두고, 버튼이 24px 히트 영역을 갖도록 감쌌다. */}
          <div className="flex justify-center items-center gap-1 mt-6 px-6 md:px-0">
            <button
              onClick={() => goToPage(0)}
              aria-label="1페이지 (헤드라인)"
              aria-current={currentPage === 0 ? 'true' : undefined}
              className="flex h-6 min-w-6 items-center justify-center"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-300 ${currentPage === 0 ? 'bg-white dark:bg-volt w-5' : 'bg-white/30 dark:bg-white/20 w-1.5'}`}
              />
            </button>
            <button
              onClick={() => goToPage(1)}
              aria-label="2페이지 (경기 결과)"
              aria-current={currentPage === 1 ? 'true' : undefined}
              className="flex h-6 min-w-6 items-center justify-center"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-300 ${currentPage === 1 ? 'bg-white dark:bg-volt w-5' : 'bg-white/30 dark:bg-white/20 w-1.5'}`}
              />
            </button>
          </div>

        </div>

        {/* Right side: Upcoming Matches (Page 1) or Player Ratings (Page 2) */}
        {/* key를 페이지에 걸어 두면 장이 바뀔 때마다 다시 마운트되면서
            왼쪽 본문과 같은 타이밍으로 슥 들어온다 */}
        <div
          key={currentPage}
          className="w-full md:w-[26%] lg:w-[25%] shrink-0 md:absolute md:right-8 md:top-8 md:bottom-8 md:flex md:flex-col animate-pageSlide"
        >
          {currentPage === 0 ? (
            <UpcomingSection upcomingMatches={upcomingMatches} />
          ) : (
            recentMatch ? (
              <PlayerRatingsSection recentMatch={recentMatch} />
            ) : (
              <div className="w-full h-full bg-black/10 dark:bg-black/25 rounded-lg p-4 border border-white/5 flex items-center justify-center text-white/30 text-center flex-1">
                <span className="text-xs uppercase font-bold tracking-wider">경기 정보 없음</span>
              </div>
            )
          )}
        </div>

        {/* Floating Slide Navigation - Left Edge of the Entire Card */}
        {currentPage > 0 && (
          <button 
            onClick={() => goToPage(0)}
            className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-black/25 hover:bg-black/50 border border-white/10 hover:border-white/20 text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-md dark:bg-black/50 dark:hover:bg-black/75 dark:border-volt/20 dark:hover:border-volt/40 backdrop-blur-xs group"
            title="이전 페이지"
          >
            <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Floating Slide Navigation - Right Edge of the Entire Card */}
        {currentPage < 1 && (
          <button 
            onClick={() => goToPage(1)}
            className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-black/25 hover:bg-black/50 border border-white/10 hover:border-white/20 text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-md dark:bg-black/50 dark:hover:bg-black/75 dark:border-volt/20 dark:hover:border-volt/40 backdrop-blur-xs group"
            title="다음 페이지"
          >
            <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Toggle Button for Details (Only visible on Match Result page when match is loaded) */}
      {recentMatch && currentPage === 1 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-3 bg-black/10 hover:bg-black/20 border-t border-white/10 flex items-center justify-center gap-2 transition-all duration-300 group"
        >
          <span className="text-xs font-bold tracking-widest uppercase opacity-60 group-hover:opacity-100">
            {isExpanded ? '경기 상세 정보 닫기' : '경기 상세 정보 보기'}
          </span>
          {isExpanded ? (
            <ChevronUp size={16} className="opacity-60 group-hover:opacity-100" />
          ) : (
            <ChevronDown size={16} className="opacity-60 group-hover:opacity-100" />
          )}
        </button>
      )}

      {/* Accordion Content (Only visible on Match Result page when expanded) */}
      {recentMatch && currentPage === 1 && (
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-6 md:p-8 bg-black/10 flex flex-col gap-12 border-t border-white/5">
            <StatsSection stats={recentMatch.stats} isExpanded={isExpanded} />

            {recentMatch.lineup && (
              <div className="flex flex-col gap-8 -mx-6 md:mx-0">
                <h4 className="text-sm md:text-base font-black tracking-widest uppercase text-white text-center px-6">선발 명단 및 전술</h4>
                <div className="w-full overflow-hidden">
                  <TacticalField 
                    lineup={recentMatch.lineup}
                    homeTeam={recentMatch.homeTeam}
                    awayTeam={recentMatch.awayTeam}
                  />
                </div>
              </div>
            )}

            <MatchEvents 
              substitutions={recentMatch.substitutions}
              cards={recentMatch.cards}
            />
          </div>
        </div>
      )}
    </div>
  );
}
