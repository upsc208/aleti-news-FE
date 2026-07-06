import React from 'react';
import { formatKST } from './utils';

interface ScoreSectionProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  tournament: string;
  isHome: boolean;
}

export const ScoreSection = ({ 
  homeTeam, awayTeam, homeScore, awayScore, matchDate, tournament, isHome 
}: ScoreSectionProps) => {
  return (
    <>
      {/* Header */}
      <div className="order-1 flex justify-between items-center text-[10px] md:text-xs font-bold tracking-widest uppercase mb-8 md:mb-6 gap-4">
        <span className="shrink-0 bg-white/10 text-white dark:bg-white/5 px-2 py-0.5 rounded border border-white/10 dark:border-volt/10 text-[9px] md:text-[10px] font-black tracking-wider">Full Time</span>
        <div className="flex flex-wrap justify-end gap-x-1.5 text-right opacity-80">
          <span className="whitespace-nowrap">{formatKST(matchDate)}</span>
          <span className="opacity-40">&middot;</span>
          <span className="whitespace-nowrap">{tournament}</span>
          <span className="opacity-40">&middot;</span>
          <span className="whitespace-nowrap">{isHome ? 'HOME' : 'AWAY'}</span>
        </div>
      </div>

      {/* Score Main */}
      <div className="order-2 flex-1 flex flex-col md:flex-row items-center justify-between pb-6 md:pb-10 w-full gap-4 md:gap-0">
        {/* Home Team */}
        <div className="w-full md:w-[35%] lg:w-[38%] text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tighter text-white text-center md:text-left leading-tight break-words min-w-0 transition-all duration-300 uppercase">
          {homeTeam}
        </div>

        {/* Score - Fixed Center Width */}
        <div className="shrink-0 w-full md:w-[25%] lg:w-[20%] text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter text-center my-2 md:my-0 whitespace-nowrap transition-all duration-300 flex justify-center items-center px-4">
          <span className="bg-clip-text text-transparent bg-white">
            {homeScore} - {awayScore}
          </span>
        </div>

        {/* Away Team */}
        <div className="w-full md:w-[35%] lg:w-[38%] text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tighter text-white text-center md:text-right leading-tight break-words min-w-0 transition-all duration-300 uppercase">
          {awayTeam}
        </div>
      </div>
    </>
  );
};
