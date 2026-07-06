'use client';

import React, { useState, useEffect } from 'react';
import { Star, Award, Loader2 } from 'lucide-react';
import { getRatings, submitRating } from '@/client/sdk.gen';
import type { RecentMatch, PlayerRatingResponse } from '@/client/types.gen';

interface PlayerRatingsSectionProps {
  recentMatch: RecentMatch;
}

export default function PlayerRatingsSection({ recentMatch }: PlayerRatingsSectionProps) {
  const [ratings, setRatings] = useState<PlayerRatingResponse[]>([]);
  const [unsavedRatings, setUnsavedRatings] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch ratings from backend and merge with match lineup
  const fetchAndMergeRatings = async () => {
    try {
      setIsLoading(true);
      const res = await getRatings({
        path: {
          matchId: recentMatch.matchId,
        },
      });

      const apiRatings = res.data || [];

      // Extract players from the lineup who participated in the match
      const matchPlayers: Array<{ name: string; shirt?: string }> = [];
      
      if (recentMatch.lineup) {
        const teamLineup = recentMatch.isHome ? recentMatch.lineup.home : recentMatch.lineup.away;
        if (teamLineup && teamLineup.starters) {
          teamLineup.starters.forEach((p) => {
            matchPlayers.push({ name: p.name, shirt: p.shirt });
          });
        }
      }

      // Add subbed-in players as well
      if (recentMatch.substitutions) {
        recentMatch.substitutions.forEach((sub) => {
          if (sub.isHome === recentMatch.isHome) {
            if (!matchPlayers.some((p) => p.name === sub.inName)) {
              matchPlayers.push({ name: sub.inName, shirt: undefined });
            }
          }
        });
      }

      // Merge lineup list with API ratings to ensure all participating players are listed
      const merged: PlayerRatingResponse[] = matchPlayers.map((p) => {
        const apiRating = apiRatings.find((r) => r.playerName.toLowerCase() === p.name.toLowerCase());
        return {
          playerName: p.name,
          shirt: p.shirt || apiRating?.shirt,
          averageScore: apiRating?.averageScore ?? 0,
          voteCount: apiRating?.voteCount ?? 0,
          myScore: apiRating?.myScore,
        };
      });

      // Append any players that are returned by the API but not in our lineup extraction (fallback)
      apiRatings.forEach((r) => {
        if (!merged.some((m) => m.playerName.toLowerCase() === r.playerName.toLowerCase())) {
          merged.push(r);
        }
      });

      setRatings(merged);
    } catch (err) {
      console.error('Failed to fetch player ratings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (recentMatch?.matchId) {
      fetchAndMergeRatings();
      setUnsavedRatings({});
      setSubmitSuccess(false);
    }
  }, [recentMatch?.matchId]);

  // Handle rating click
  const handleRate = (playerName: string, score: number) => {
    setUnsavedRatings((prev) => ({
      ...prev,
      [playerName]: score,
    }));

    // Update local state immediately for instant feedback
    setRatings((prev) =>
      prev.map((r) =>
        r.playerName === playerName ? { ...r, myScore: score } : r
      )
    );
    setSubmitSuccess(false);
  };

  // Submit all ratings in sequence
  const handleSubmitRatings = async () => {
    if (Object.keys(unsavedRatings).length === 0) return;

    setIsSubmitting(true);
    try {
      // Send individual rating requests in parallel
      await Promise.all(
        Object.entries(unsavedRatings).map(([playerName, score]) =>
          submitRating({
            path: {
              matchId: recentMatch.matchId,
            },
            body: {
              playerName,
              score,
            },
          })
        )
      );

      setSubmitSuccess(true);
      setUnsavedRatings({});
      // Refresh averages from API
      await fetchAndMergeRatings();
    } catch (err) {
      console.error('Failed to submit ratings:', err);
      alert('평점 제출 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Interactive Star component supporting half stars
  const StarRating = ({ 
    playerName, 
    value = 0 
  }: { 
    playerName: string; 
    value?: number;
  }) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((starIdx) => {
          const isFull = value >= starIdx;
          const isHalf = value === starIdx - 0.5;

          return (
            <div key={starIdx} className="relative w-4 h-4 cursor-pointer">
              {/* Visual stars layered using clip-path for half star */}
              {isFull ? (
                <Star className="absolute inset-0 w-4 h-4 text-volt fill-volt" />
              ) : isHalf ? (
                <div className="relative w-4 h-4">
                  <Star className="absolute inset-0 w-4 h-4 text-white/20 fill-transparent" />
                  <div className="absolute inset-0 w-1/2 overflow-hidden">
                    <Star className="w-4 h-4 text-volt fill-volt" />
                  </div>
                </div>
              ) : (
                <Star className="absolute inset-0 w-4 h-4 text-white/20 fill-transparent" />
              )}

              {/* Click detection zones */}
              {/* Left half zone: rate (idx - 0.5) */}
              <div 
                className="absolute left-0 top-0 w-1/2 h-full z-10" 
                onClick={() => handleRate(playerName, starIdx - 0.5)}
                title={`${starIdx - 0.5}점`}
              />
              {/* Right half zone: rate (idx) */}
              <div 
                className="absolute right-0 top-0 w-1/2 h-full z-10" 
                onClick={() => handleRate(playerName, starIdx)}
                title={`${starIdx}점`}
              />
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[220px] flex flex-col items-center justify-center text-white/50">
        <Loader2 className="w-8 h-8 animate-spin text-white mb-2" />
        <span className="text-xs font-semibold tracking-wider uppercase">Loading squad...</span>
      </div>
    );
  }

  // Check if all players in ratings have a score (either already rated or currently rated in unsavedRatings)
  const allPlayersRated = ratings.every(p => {
    const score = unsavedRatings[p.playerName] !== undefined ? unsavedRatings[p.playerName] : p.myScore;
    return score !== undefined && score > 0;
  });

  const hasUnsavedChanges = Object.keys(unsavedRatings).length > 0;
  const isSubmitDisabled = isSubmitting || !allPlayersRated || !hasUnsavedChanges;

  return (
    <div className="w-full flex flex-col h-full bg-black/10 dark:bg-black/25 rounded-lg pt-4 pb-4 pl-4 pr-0 border border-white/5">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 pr-4">
        <div className="flex items-center gap-1.5">
          <Award className="text-volt" size={16} />
          <span className="text-xs font-black tracking-wider uppercase text-white">선수 평점</span>
        </div>
        <span className="text-[10px] font-bold text-white/50 tracking-tight">별 반개 가능</span>
      </div>

      {/* Players List with stylized scrollbar */}
      <div className="flex-1 max-h-[170px] md:max-h-none overflow-y-auto pr-1.5 flex flex-col gap-2 custom-scrollbar-red">
        {ratings.length > 0 ? (
          ratings.map((p) => (
            <div 
              key={p.playerName} 
              className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-b-0 gap-2 shrink-0"
            >
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  {p.shirt && (
                    <span className="text-[9px] font-black text-white/60 bg-white/10 px-1 py-0.5 rounded shrink-0">
                      {p.shirt}
                    </span>
                  )}
                  <span className="text-xs font-bold text-white/95 truncate leading-tight">
                    {p.playerName}
                  </span>
                </div>
                <div className="text-[9px] text-white/40 flex items-center gap-0.5 mt-0.5">
                  <Star size={8} className="fill-volt text-volt" />
                  <span>{p.averageScore > 0 ? p.averageScore.toFixed(1) : '평점 없음'} ({p.voteCount}명)</span>
                </div>
              </div>

              {/* Star Rating Selectors */}
              <StarRating playerName={p.playerName} value={p.myScore} />
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center text-white/30 h-full">
            <span className="text-xs uppercase font-bold tracking-wider">명단이 존재하지 않습니다</span>
          </div>
        )}
      </div>

      {/* Submission Actions */}
      <div className="pt-3 border-t border-white/10 mt-3 flex flex-col gap-1.5 pr-4">
        <button
          onClick={handleSubmitRatings}
          disabled={isSubmitDisabled}
          className={`w-full py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
            isSubmitDisabled
              ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
              : 'bg-aleti-navy text-white hover:scale-[1.02] hover:bg-aleti-navy/90 active:scale-95 shadow-md dark:bg-volt dark:text-black dark:hover:bg-volt/95 dark:shadow-volt/10'
          }`}
        >
          {isSubmitting 
            ? '제출 중...' 
            : !allPlayersRated 
              ? '모든 선수 평점 입력 필요' 
              : `평점 저장하기 (${Object.keys(unsavedRatings).length})`
          }
        </button>
        {submitSuccess && (
          <div className="text-[10px] text-volt text-center font-bold tracking-tight animate-pulse">
            평점이 성공적으로 저장되었습니다!
          </div>
        )}
      </div>
    </div>
  );
}
