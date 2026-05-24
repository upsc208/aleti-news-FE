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
      <div className="order-1 flex justify-between items-start text-[10px] md:text-xs font-bold tracking-widest uppercase mb-8 md:mb-6 gap-4">
        <span className="shrink-0">Full Time</span>
        <div className="flex flex-wrap justify-end gap-x-1.5 text-right">
          <span className="whitespace-nowrap">{formatKST(matchDate)}</span>
          <span className="opacity-40">&middot;</span>
          <span className="whitespace-nowrap">{tournament}</span>
          <span className="opacity-40">&middot;</span>
          <span className="whitespace-nowrap">{isHome ? 'HOME' : 'AWAY'}</span>
        </div>
      </div>

      {/* Score Main */}
      <div className="order-2 flex-1 flex flex-col md:flex-row items-center justify-center md:justify-between pb-6 md:pb-10 px-2 w-full gap-2 md:gap-6">
        <div className="w-full md:flex-1 text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-black tracking-tighter text-white text-center md:text-left leading-tight break-normal min-w-0 transition-all duration-300 uppercase">
          {homeTeam}
        </div>
        <div className="shrink-0 text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter text-center my-2 md:my-0 whitespace-nowrap transition-all duration-300">
          {homeScore} - {awayScore}
        </div>
        <div className="w-full md:flex-1 text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-black tracking-tighter text-white text-center md:text-right leading-tight break-normal min-w-0 transition-all duration-300 uppercase">
          {awayTeam}
        </div>
      </div>
    </>
  );
};
