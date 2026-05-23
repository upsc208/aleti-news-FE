'use client';

import React, { useState } from 'react';
import { PawPrint, ChevronDown, ChevronUp, ArrowLeftRight } from 'lucide-react';
import { IoMdFootball } from 'react-icons/io';
import { GiSonicShoes } from 'react-icons/gi';
import { MdRectangle } from 'react-icons/md';
import type { RecentMatch, UpcomingMatch } from '@/client/types.gen';

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
  const [isExpanded, setIsExpanded] = useState(false);

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

  const sortedScorers = [...(recentMatch.scorers || [])].sort((a, b) => {
    const timeA = parseInt(a.time.replace(/[^0-9]/g, '')) || 0;
    const timeB = parseInt(b.time.replace(/[^0-9]/g, '')) || 0;
    return timeA - timeB;
  });

  const homeScorers = sortedScorers.filter(s => s.isHome);
  const awayScorers = sortedScorers.filter(s => !s.isHome);

  // Helper component for a single shared horizontal football field
  const HorizontalMatchField = ({ lineup, homeTeam, awayTeam }: { lineup: any, homeTeam: string, awayTeam: string }) => {
    const renderTeam = (teamLineup: any, isHome: boolean) => {
      const formation = teamLineup.formation || '4-4-2';
      const starters = teamLineup.starters || [];
      const rows = [1, ...formation.split('-').map(Number)];
      
      let playerIdx = 0;
      const playerRows = rows.map(count => {
        const rowPlayers = starters.slice(playerIdx, playerIdx + count);
        playerIdx += count;
        return rowPlayers;
      });

      return (
        <div className={`flex-1 flex ${isHome ? 'flex-row' : 'flex-row-reverse'} justify-between items-center h-full px-2 sm:px-4 md:px-8`}>
          {playerRows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex flex-col justify-around h-full py-1 sm:py-2 md:py-4">
              {[...row].reverse().map((player: any, pIdx: number) => (
                <div key={pIdx} className="flex flex-col items-center gap-0.5 sm:gap-1 group/player">
                  <div className={`w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-white text-black flex items-center justify-center font-black text-[7px] sm:text-[9px] md:text-xs shadow-lg border sm:border-2 ${isHome ? 'border-[#b92629]' : 'border-blue-600'} transition-transform group-hover/player:scale-110`}>
                    {player.shirt}
                  </div>
                  <div className="text-[6px] sm:text-[8px] md:text-[10px] font-bold text-white text-center leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] max-w-[35px] sm:max-w-[50px] md:max-w-[70px] truncate">
                    {player.name.split(' ').pop()}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="flex justify-between items-center px-4 font-black uppercase tracking-tighter text-[10px] sm:text-sm md:text-base">
          <div className="flex items-center gap-1.5 text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-[#b92629]"></span>
            <span>{homeTeam}</span>
            <span className="opacity-60">({lineup.home.formation})</span>
          </div>
          <div className="flex items-center gap-1.5 text-white">
            <span className="opacity-60">({lineup.away.formation})</span>
            <span>{awayTeam}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
          </div>
        </div>

        <div className="relative w-full aspect-[2/1] sm:aspect-[2.2/1] bg-[#2d5a27] rounded-lg sm:rounded-xl border border-white/20 overflow-hidden shadow-2xl group">
          {/* Field Pattern (Horizontal Stripes) */}
          <div className="absolute inset-0 flex">
            {[...Array(10)].map((_, i) => (
              <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-black/5' : ''}`} />
            ))}
          </div>

          {/* Field Markings */}
          <div className="absolute inset-0 border border-white/20 pointer-events-none">
            {/* Center Line & Circle */}
            <div className="absolute inset-y-0 left-1/2 w-px bg-white/20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/4 aspect-square border border-white/20 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white/40 rounded-full" />

            {/* Penalty Areas */}
            <div className="absolute inset-y-1/4 left-0 w-[12%] border border-white/20 border-l-0" />
            <div className="absolute inset-y-[35%] left-0 w-[5%] border border-white/20 border-l-0" />
            
            <div className="absolute inset-y-1/4 right-0 w-[12%] border border-white/20 border-r-0" />
            <div className="absolute inset-y-[35%] right-0 w-[5%] border border-white/20 border-r-0" />
          </div>

          {/* Teams Container */}
          <div className="absolute inset-0 flex">
            {renderTeam(lineup.home, true)}
            {renderTeam(lineup.away, false)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#b92629] text-white rounded-xl shadow-lg w-full max-w-none font-sans tracking-wide flex flex-col overflow-hidden border border-white/10 transition-all duration-500">
      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 md:gap-12 min-h-[250px]">

      {/* Left side: Match Result (70%) */}
      <div className="w-full md:w-[70%] flex flex-col pr-0 md:pr-8 md:border-r border-white/20">
        {/* Header */}
        <div className="order-1 flex justify-between items-start text-[10px] md:text-xs font-bold tracking-widest uppercase mb-8 md:mb-6 gap-4">
          <span className="shrink-0">Full Time</span>
          <div className="flex flex-wrap justify-end gap-x-1.5 text-right">
            <span className="whitespace-nowrap">{formatKST(recentMatch.matchDate)}</span>
            <span className="opacity-40">&middot;</span>
            <span className="whitespace-nowrap">{recentMatch.tournament}</span>
            <span className="opacity-40">&middot;</span>
            <span className="whitespace-nowrap">{recentMatch.isHome ? 'HOME' : 'AWAY'}</span>
          </div>
        </div>

        {/* Score Section - Centered Vertically */}
        <div className="order-2 flex-1 flex flex-col md:flex-row items-center justify-center md:justify-between pb-6 md:pb-10 px-2 w-full gap-2 md:gap-6">
          <div className="w-full md:flex-1 text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-black tracking-tighter text-white text-center md:text-left leading-tight break-normal min-w-0 transition-all duration-300 uppercase">
            {recentMatch.homeTeam}
          </div>
          <div className="shrink-0 text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter text-center my-2 md:my-0 whitespace-nowrap transition-all duration-300">
            {recentMatch.homeScore} - {recentMatch.awayScore}
          </div>
          <div className="w-full md:flex-1 text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-black tracking-tighter text-white text-center md:text-right leading-tight break-normal min-w-0 transition-all duration-300 uppercase">
            {recentMatch.awayTeam}
          </div>
        </div>

        {/* Scorers Section - Order swaps on PC/Mobile */}
        {sortedScorers.length > 0 && (
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
        )}

        {/* Separator Line - Order swaps on PC/Mobile */}
        <div className="order-4 md:order-3 border-t border-white/20 mb-8 mx-2"></div>
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
              <div className="text-[10px] md:text-xs font-medium opacity-80 uppercase tracking-widest mt-1 flex flex-wrap gap-x-1.5">
                <span className="whitespace-nowrap">{formatKST(match.matchDate)}</span>
                <span className="opacity-40">&middot;</span>
                <span className="whitespace-nowrap">{match.tournament}</span>
                <span className="opacity-40">&middot;</span>
                <span className="whitespace-nowrap">{match.isHome ? 'HOME' : 'AWAY'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

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
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-6 md:p-8 bg-black/10 flex flex-col gap-12 border-t border-white/5">

          {/* 1. Stats Section */}
          {recentMatch.stats && Object.keys(recentMatch.stats).length > 0 && (
            <div className="flex flex-col gap-8">
              <h4 className="text-sm md:text-base font-black tracking-widest uppercase text-white text-center">경기 통계</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-4xl mx-auto w-full">
                {Object.entries(recentMatch.stats)
                  .sort(([a], [b]) => {
                    // Custom order logic to swap xG and Pass Accuracy
                    const order = [
                      'Possession', 'Expected Goals', 'Pass Accuracy', 'Shots', 'Shots on Target', 
                      'Saves', 'Corners', 'Fouls', 'Yellow Cards', 'Red Cards'
                    ];
                    let idxA = order.indexOf(a);
                    let idxB = order.indexOf(b);
                    if (idxA === -1) idxA = 99;
                    if (idxB === -1) idxB = 99;
                    return idxA - idxB;
                  })
                  .map(([label, val], idx) => {
                  const homeVal = parseFloat(val.home.replace(/[^0-9.]/g, '')) || 0;
                  const awayVal = parseFloat(val.away.replace(/[^0-9.]/g, '')) || 0;
                  const total = homeVal + awayVal;
                  const homePct = total === 0 ? 50 : (homeVal / total) * 100;

                  // Translate common stats labels
                  const translatedLabel = {
                    'Possession': '점유율',
                    'Shots': '슈팅',
                    'Shots on Target': '유효 슈팅',
                    'Corners': '코너킥',
                    'Offsides': '오프사이드',
                    'Fouls': '파울',
                    'Yellow Cards': '경고',
                    'Red Cards': '퇴장',
                    'Saves': '선방',
                    'Expected Goals': 'Expected Goals (xG)',
                    'Pass Accuracy': '패스 성공률',
                    'Big Chances': '결정적 찬스',
                    'Total Passes': '전체 패스',
                    'Tackles': '태클',
                    'Interceptions': '인터셉트',
                    'Clearances': '클리어링',
                    'Distance Covered': '활동량'
                  }[label] || label;

                  return (
                    <div key={idx} className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs md:text-sm font-bold uppercase tracking-tight px-1 text-white">
                        <span>{val.home}</span>
                        <span>{translatedLabel}</span>
                        <span>{val.away}</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-white transition-all duration-1000"
                          style={{ width: `${isExpanded ? homePct : 0}%` }}
                        />
                        <div
                          className="h-full bg-white/30 transition-all duration-1000"
                          style={{ width: `${isExpanded ? 100 - homePct : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Lineup Section */}
          {recentMatch.lineup && (
            <div className="flex flex-col gap-8 -mx-6 md:mx-0">
              <h4 className="text-sm md:text-base font-black tracking-widest uppercase text-white text-center px-6">선발 명단 및 전술</h4>
              <div className="w-full overflow-hidden">
                <HorizontalMatchField 
                  lineup={recentMatch.lineup} 
                  homeTeam={recentMatch.homeTeam} 
                  awayTeam={recentMatch.awayTeam} 
                />
              </div>
            </div>
          )}

          {/* 3. Events Section (Subs & Cards) */}
          {(recentMatch.substitutions?.length || 0) + (recentMatch.cards?.length || 0) > 0 && (
            <div className="flex flex-col gap-6 md:gap-8">
              <h4 className="text-sm md:text-base font-black tracking-widest uppercase text-white text-center">주요 경기 상황</h4>
              <div className="flex flex-row md:gap-24 justify-center items-stretch md:items-start min-h-[80px]">
                {/* Home Events */}
                <div className="flex-1 flex flex-col gap-3 md:gap-2 pr-2 md:pr-0">
                  {[...(recentMatch.substitutions || []), ...(recentMatch.cards || [])]
                    .filter(e => e.isHome)
                    .sort((a, b) => parseInt(a.time) - parseInt(b.time))
                    .map((e, i) => (
                      <div key={i} className="flex items-center gap-1.5 md:gap-3 text-[9px] md:text-sm py-0.5 md:py-1.5 md:px-3 md:bg-white/5 md:rounded-lg">
                        <span className="font-bold opacity-40 min-w-[20px] md:min-w-[28px]">{e.time}&apos;</span>
                        {'inName' in e ? (
                          <div className="flex items-center gap-1 md:gap-2 flex-1 min-w-0">
                            <ArrowLeftRight size={10} className="text-green-400 shrink-0 md:w-3.5 md:h-3.5" />
                            <div className="flex flex-col leading-tight min-w-0">  
                              <span className="font-bold text-white text-[9px] md:text-base truncate">{e.inName}</span>
                              <span className="text-[7px] md:text-xs opacity-50 italic truncate">for {e.outName}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 md:gap-2 flex-1 min-w-0">
                            <MdRectangle
                              size={12}
                              style={{
                                color: e.color?.toLowerCase() === 'yellow' || e.color === 'Y' ? '#facc15' : '#ff0000'
                              }}
                              className="rotate-90 shrink-0 md:w-4 md:h-4"
                            />
                            <span className="font-bold text-white text-[9px] md:text-base truncate">{e.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>

                {/* Central Divider Line (Mobile Only) */}
                <div className="w-px bg-white/20 self-stretch md:hidden"></div>

                {/* Away Events */}
                <div className="flex-1 flex flex-col gap-3 md:gap-2 pl-2 md:pl-0 text-right">
                  {[...(recentMatch.substitutions || []), ...(recentMatch.cards || [])]
                    .filter(e => !e.isHome)
                    .sort((a, b) => parseInt(a.time) - parseInt(b.time))
                    .map((e, i) => (
                      <div key={i} className="flex items-center gap-1.5 md:gap-3 text-[9px] md:text-sm py-0.5 md:py-1.5 md:px-3 md:bg-white/5 md:rounded-lg flex-row-reverse md:text-right">
                        <span className="font-bold opacity-40 min-w-[20px] md:min-w-[28px]">{e.time}&apos;</span>
                        {'inName' in e ? (
                          <div className="flex items-center gap-1 md:gap-2 flex-1 flex-row-reverse text-right min-w-0">
                            <ArrowLeftRight size={10} className="text-green-400 shrink-0 md:w-3.5 md:h-3.5" />
                            <div className="flex flex-col leading-tight min-w-0">  
                              <span className="font-bold text-white text-[9px] md:text-base truncate">{e.inName}</span>
                              <span className="text-[7px] md:text-xs opacity-50 italic truncate">for {e.outName}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 md:gap-2 flex-1 flex-row-reverse text-right min-w-0">
                            <MdRectangle
                              size={12}
                              style={{
                                color: e.color?.toLowerCase() === 'yellow' || e.color === 'Y' ? '#facc15' : '#ff0000'
                              }}
                              className="rotate-90 shrink-0 md:w-4 md:h-4"
                            />
                            <span className="font-bold text-white text-[9px] md:text-base truncate">{e.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
