'use client';

import React, { useState } from 'react';
import { PawPrint, ChevronDown, ChevronUp } from 'lucide-react';
import type { RecentMatch, UpcomingMatch } from '@/client/types.gen';
import { sortScorers } from './utils';
import { ScoreSection } from './ScoreSection';
import { ScorersSection } from './ScorersSection';
import { UpcomingSection } from './UpcomingSection';
import { StatsSection } from './StatsSection';
import { TacticalField } from './TacticalField';
import { MatchEvents } from './MatchEvents';

interface MatchResultCardProps {
  recentMatch?: RecentMatch | null;
  upcomingMatches?: UpcomingMatch[] | null;
}

export default function MatchResultCard({ recentMatch, upcomingMatches }: MatchResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!recentMatch) {
    return (
      <div className="bg-[#b92629] dark:bg-[#111318] dark:border dark:border-volt/10 text-white p-6 md:p-8 rounded-xl shadow-lg w-full max-w-none font-sans tracking-wide flex flex-col items-center justify-center min-h-[250px] border border-white/10 dark-card-pattern">
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

  const sortedScorers = sortScorers(recentMatch.scorers);
  const homeScorers = sortedScorers.filter(s => s.isHome);
  const awayScorers = sortedScorers.filter(s => !s.isHome);

  return (
    <div className="bg-[#b92629] dark:bg-[#111318] text-white rounded-xl shadow-lg w-full max-w-none font-sans tracking-wide flex flex-col overflow-hidden border border-white/10 dark:border-volt/10 transition-all duration-500 dark-card-pattern">
      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 md:gap-12 min-h-[250px]">
        {/* Left side: Match Result (70%) */}
        <div className="w-full md:w-[70%] flex flex-col pr-0 md:pr-8 md:border-r border-white/20">
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

          <div className="order-4 md:order-3 border-t border-white/20 mb-8 mx-2"></div>
        </div>

        {/* Right side: Upcoming Matches (30%) */}
        <UpcomingSection upcomingMatches={upcomingMatches} />
      </div>

      {/* Toggle Button */}
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

      {/* Accordion Content */}
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
    </div>
  );
}
