import React from 'react';
import type { RecentMatch, UpcomingMatch } from '@/client/types.gen';

const SoccerBall = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polygon points="12 7 9 10 10 14 14 14 15 10" strokeLinejoin="round" />
    <line x1="12" y1="7" x2="12" y2="2" />
    <line x1="9" y1="10" x2="3" y2="9" />
    <line x1="15" y1="10" x2="21" y2="9" />
    <line x1="10" y1="14" x2="7" y2="19" />
    <line x1="14" y1="14" x2="17" y2="19" />
  </svg>
);

const formatKST = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(d);
  } catch {
    return dateStr;
  }
};

interface MatchResultCardProps {
  recentMatch?: RecentMatch | null;
  upcomingMatches?: UpcomingMatch[] | null;
}

export default function MatchResultCard({ recentMatch, upcomingMatches }: MatchResultCardProps) {
  if (!recentMatch) {
    return null; // Don't render if no recent match is available
  }

  return (
    <div className="bg-[#b92629] text-white p-6 md:p-8 rounded-xl shadow-lg w-full max-w-none font-sans tracking-wide flex flex-col md:flex-row gap-8 md:gap-12 min-h-[250px]">
      
      {/* Left side: Match Result (70%) */}
      <div className="w-full md:w-[70%] flex flex-col pr-0 md:pr-8 md:border-r border-white/20">
        {/* Header */}
        <div className="flex justify-between items-center text-[10px] md:text-xs font-bold tracking-widest uppercase mb-10">
          <span>Full Time</span>
          <span>{formatKST(recentMatch.matchDate)} &middot; {recentMatch.tournament} &middot; {recentMatch.isHome ? 'HOME' : 'AWAY'}</span>
        </div>

        {/* Score Section */}
        <div className="flex items-center justify-between mb-10 px-2 md:px-8 w-full gap-4">
          <div className="flex-1 text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white text-left leading-none break-words">
            {recentMatch.homeTeam}
          </div>
          <div className="shrink-0 text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-center">
            {recentMatch.homeScore}-{recentMatch.awayScore}
          </div>
          <div className="flex-1 text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white text-right leading-none break-words">
            {recentMatch.awayTeam}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 mb-6"></div>

        {/* Goalscorers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm md:text-base font-bold tracking-wide max-h-[80px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {recentMatch.scorers && recentMatch.scorers.map((scorer, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span>{scorer.minute}' {scorer.name}</span>
              <SoccerBall />
            </div>
          ))}
        </div>
      </div>

      {/* Right side: Upcoming Matches (30%) */}
      <div className="w-full md:w-[30%] flex flex-col pt-4 md:pt-0">
        <div className="text-[10px] md:text-xs font-bold tracking-widest uppercase mb-6 opacity-70">
          Upcoming Matches
        </div>
        
        <div className="flex flex-col gap-6">
          {upcomingMatches && upcomingMatches.slice(0, 3).map((match, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xl md:text-2xl font-black tracking-tight">
                <span>vs</span>
                <span>{match.opponent}</span>
              </div>
              <div className="text-xs md:text-sm font-medium opacity-80 uppercase tracking-widest">
                {formatKST(match.matchDate)} &middot; {match.tournament} &middot; {match.isHome ? 'HOME' : 'AWAY'}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
