import React from 'react';
import { PawPrint } from 'lucide-react';
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
    return (
      <div className="bg-[#b92629] text-white p-6 md:p-8 rounded-xl shadow-lg w-full max-w-none font-sans tracking-wide flex flex-col items-center justify-center min-h-[250px] border border-white/10">
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

  return (
    <div className="bg-[#b92629] text-white p-6 md:p-8 rounded-xl shadow-lg w-full max-w-none font-sans tracking-wide flex flex-col md:flex-row gap-8 md:gap-12 min-h-[250px]">

      {/* Left side: Match Result (70%) */}
      <div className="w-full md:w-[70%] flex flex-col pr-0 md:pr-8 md:border-r border-white/20">
        {/* Header */}
        <div className="flex justify-between items-start text-[10px] md:text-xs font-bold tracking-widest uppercase mb-10 gap-4">
          <span className="shrink-0">Full Time</span>
          <span className="text-right break-words">{formatKST(recentMatch.matchDate)} &middot; {recentMatch.tournament} &middot; {recentMatch.isHome ? 'HOME' : 'AWAY'}</span>
        </div>

        {/* Score Section */}
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between mb-10 px-2 w-full gap-4 md:gap-6">
          <div className="w-full md:flex-1 text-3xl sm:text-4xl md:text-3xl lg:text-5xl font-black tracking-tighter text-white text-center md:text-left leading-tight break-words min-w-0">
            {recentMatch.homeTeam}
          </div>
          <div className="shrink-0 text-5xl sm:text-6xl md:text-5xl lg:text-7xl font-black tracking-tighter text-center my-2 md:my-0 whitespace-nowrap">
            {recentMatch.homeScore} - {recentMatch.awayScore}
          </div>
          <div className="w-full md:flex-1 text-3xl sm:text-4xl md:text-3xl lg:text-5xl font-black tracking-tighter text-white text-center md:text-right leading-tight break-words min-w-0">
            {recentMatch.awayTeam}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 mb-6"></div>

        {/* Goalscorers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm md:text-base font-bold tracking-wide max-h-[80px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {recentMatch.scorers && recentMatch.scorers.map((scorer, idx) => (
            <div key={idx} className="flex justify-between items-center gap-2">
              <span className="truncate">{scorer.minute}' {scorer.name}</span>
              <span className="shrink-0"><SoccerBall /></span>
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
              <div className="flex items-start gap-2 text-lg sm:text-xl md:text-2xl font-black tracking-tight leading-tight">
                <span className="shrink-0 mt-0.5">vs</span>
                <span className="break-words min-w-0">{match.opponent}</span>
              </div>
              <div className="text-[10px] md:text-xs font-medium opacity-80 uppercase tracking-widest break-words mt-1">
                {formatKST(match.matchDate)} &middot; {match.tournament} &middot; {match.isHome ? 'HOME' : 'AWAY'}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
