import React from 'react';
import { IoMdFootball } from 'react-icons/io';
import { GiSonicShoes } from 'react-icons/gi';

interface ScorersSectionProps {
  homeScorers: any[];
  awayScorers: any[];
}

export const ScorersSection = ({ homeScorers, awayScorers }: ScorersSectionProps) => {
  return (
    <div className="order-3 md:order-4 flex flex-row justify-between px-1 md:px-2 w-full mb-6 md:mb-8 gap-2 md:gap-4">
      {/* Home Scorers */}
      <div className="flex-1 flex flex-col items-start gap-2 min-w-0">
        {homeScorers.map((scorer, i) => (
          <div key={i} className="text-[11px] md:text-base font-bold tracking-tight flex flex-nowrap items-center gap-x-1.5 md:gap-x-2 whitespace-nowrap w-full">
            <span className="min-w-[20px] md:min-w-[24px] shrink-0">{scorer.time}&apos;</span>
            <div className="flex items-center gap-1 shrink-0 px-0.5">
              <IoMdFootball size={14} className="opacity-90 shrink-0 md:w-4 md:h-4" />
              <span className="opacity-95">{scorer.name}</span>
            </div>
            {scorer.assist && (
              <div className="flex items-center gap-0.5 opacity-50 font-medium text-[9px] md:text-sm italic shrink-0">
                <GiSonicShoes size={14} className="shrink-0 md:w-4 md:h-4" />
                <span>{scorer.assist}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="shrink-0 w-2 md:w-16"></div>

      {/* Away Scorers */}
      <div className="flex-1 flex flex-col items-end gap-2 text-right min-w-0">
        {awayScorers.map((scorer, i) => (
          <div key={i} className="text-[11px] md:text-base font-bold tracking-tight flex flex-nowrap items-center justify-end gap-x-1.5 md:gap-x-2 whitespace-nowrap w-full">
            <span className="min-w-[20px] md:min-w-[24px] shrink-0">{scorer.time}&apos;</span>
            <div className="flex items-center gap-1 shrink-0 px-0.5">
              <IoMdFootball size={14} className="opacity-90 shrink-0 md:w-4 md:h-4" />
              <span className="opacity-95">{scorer.name}</span>
            </div>
            {scorer.assist && (
              <div className="flex items-center gap-0.5 opacity-50 font-medium text-[9px] md:text-sm italic shrink-0">
                <GiSonicShoes size={14} className="shrink-0 md:w-4 md:h-4" />
                <span>{scorer.assist}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
