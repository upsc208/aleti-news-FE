'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Star, Award, Loader2, X, ChevronRight, Lock, Clock } from 'lucide-react';
import { getRatings, submitRating } from '@/client/sdk.gen';
import type { RecentMatch, PlayerRatingResponse } from '@/client/types.gen';

// Rating window: open for 24h after kickoff, then results-only
const RATING_WINDOW_MS = 24 * 60 * 60 * 1000;

interface PlayerRatingsSectionProps {
  recentMatch: RecentMatch;
}

export default function PlayerRatingsSection({ recentMatch }: PlayerRatingsSectionProps) {
  const [ratings, setRatings] = useState<PlayerRatingResponse[]>([]);
  const [unsavedRatings, setUnsavedRatings] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'rate' | 'results'>('rate');
  const [hasRatedBefore, setHasRatedBefore] = useState(false);
  const [ratingClosed, setRatingClosed] = useState(false);
  const [now, setNow] = useState(0);
  const [closesAt, setClosesAt] = useState(0);

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
      // If the API already knows this user's score, they've rated before → unlock results
      setHasRatedBefore(merged.some((m) => m.myScore !== undefined && m.myScore > 0));
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
      setIsModalOpen(false);
      setViewMode('rate');
    }
  }, [recentMatch?.matchId]);

  // Keep the countdown fresh and flip to results-only exactly at the deadline.
  // Deferred/interval updates (not synchronous) keep render pure.
  useEffect(() => {
    if (!recentMatch.matchDate) return;
    const closes = new Date(recentMatch.matchDate).getTime() + RATING_WINDOW_MS;
    const update = () => {
      const n = Date.now();
      setNow(n);
      setClosesAt(closes);
      setRatingClosed(n > closes);
    };
    const timeout = setTimeout(update, 0);
    const interval = setInterval(update, 60 * 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [recentMatch.matchDate]);

  // Lock background scroll & allow ESC-to-close while the mobile modal is open
  useEffect(() => {
    if (!isModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isModalOpen]);

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
      // Refresh averages from API, then reveal the results
      await fetchAndMergeRatings();
      setViewMode('results');
    } catch (err) {
      console.error('Failed to submit ratings:', err);
      alert('평점 제출 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Interactive star rating: large touch targets, half-star support, hover preview
  const StarRating = ({
    playerName,
    value = 0,
  }: {
    playerName: string;
    value?: number;
  }) => {
    const [hoverValue, setHoverValue] = useState<number | null>(null);
    const display = hoverValue ?? value;
    // Big on mobile (panel is full-width) and lg; a touch smaller on the tight md column
    const starSize = 'w-8 h-8 md:w-6 md:h-6 lg:w-7 lg:h-7';

    return (
      <div
        className="flex items-center w-full select-none"
        onMouseLeave={() => setHoverValue(null)}
      >
        {[1, 2, 3, 4, 5].map((starIdx) => {
          const isFull = display >= starIdx;
          const isHalf = display >= starIdx - 0.5 && display < starIdx;

          return (
            <div
              key={starIdx}
              className="relative flex-1 h-11 flex items-center justify-center"
            >
              {/* Visual star — clicks pass through to the zones beneath */}
              <div className={`relative ${starSize} pointer-events-none`}>
                {isFull ? (
                  <Star className={`absolute inset-0 ${starSize} text-volt fill-volt`} />
                ) : isHalf ? (
                  <>
                    <Star className={`absolute inset-0 ${starSize} text-white/20 fill-white/[0.06]`} />
                    <div className="absolute inset-0 w-1/2 overflow-hidden">
                      <Star className={`${starSize} text-volt fill-volt`} />
                    </div>
                  </>
                ) : (
                  <Star className={`absolute inset-0 ${starSize} text-white/20 fill-white/[0.06]`} />
                )}
              </div>

              {/* Left half → X.5 point (full-cell hit area, min 44px tall) */}
              <button
                type="button"
                aria-label={`${playerName} ${starIdx - 0.5}점`}
                className="absolute inset-y-0 left-0 w-1/2 z-10"
                onMouseEnter={() => setHoverValue(starIdx - 0.5)}
                onClick={() => handleRate(playerName, starIdx - 0.5)}
              />
              {/* Right half → whole point */}
              <button
                type="button"
                aria-label={`${playerName} ${starIdx}점`}
                className="absolute inset-y-0 right-0 w-1/2 z-10"
                onMouseEnter={() => setHoverValue(starIdx)}
                onClick={() => handleRate(playerName, starIdx)}
              />
            </div>
          );
        })}

        {/* Selected score readout */}
        <span className="ml-1.5 w-7 shrink-0 text-right text-sm font-black tabular-nums text-volt">
          {display > 0 ? display.toFixed(1) : ''}
        </span>
      </div>
    );
  };

  // Rating progress helpers
  const allPlayersRated = ratings.every((p) => {
    const score = unsavedRatings[p.playerName] !== undefined ? unsavedRatings[p.playerName] : p.myScore;
    return score !== undefined && score > 0;
  });
  const myRatedCount = ratings.filter((p) => {
    const score = unsavedRatings[p.playerName] !== undefined ? unsavedRatings[p.playerName] : p.myScore;
    return score !== undefined && score > 0;
  }).length;
  const hasUnsavedChanges = Object.keys(unsavedRatings).length > 0;
  const isSubmitDisabled = isSubmitting || !allPlayersRated || !hasUnsavedChanges;

  // ratingClosed is computed off-render (in the match effect) to keep render pure.
  // Once rating closes, everyone sees results (no anchoring risk left).
  // While open, results stay hidden until the user saves their own rating.
  const resultsUnlocked = ratingClosed || hasRatedBefore || submitSuccess;
  const effectiveView = ratingClosed ? 'results' : viewMode;

  // "N시간 M분 남음" label for the rating deadline (urgency to participate early)
  const remainingMs = closesAt > 0 && now > 0 ? closesAt - now : 0;
  const remainingLabel = (() => {
    if (remainingMs <= 0) return null;
    const totalMin = Math.floor(remainingMs / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return h >= 1 ? `${h}시간 ${m}분` : `${m}분`;
  })();

  // Read-only star bar for the results view
  const StaticStars = ({ value = 0 }: { value?: number }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const isFull = value >= i;
        const isHalf = value >= i - 0.5 && value < i;
        return (
          <div key={i} className="relative w-5 h-5">
            {isFull ? (
              <Star className="absolute inset-0 w-5 h-5 text-volt fill-volt" />
            ) : isHalf ? (
              <>
                <Star className="absolute inset-0 w-5 h-5 text-white/15 fill-white/[0.04]" />
                <div className="absolute inset-0 w-1/2 overflow-hidden">
                  <Star className="w-5 h-5 text-volt fill-volt" />
                </div>
              </>
            ) : (
              <Star className="absolute inset-0 w-5 h-5 text-white/15 fill-white/[0.04]" />
            )}
          </div>
        );
      })}
    </div>
  );

  // Segmented tabs: 평가하기 | 결과 보기 (results locked until the user has saved)
  const renderTabs = () => (
    <div className="flex gap-1 p-1 bg-black/20 dark:bg-black/40 rounded-lg shrink-0">
      <button
        type="button"
        onClick={() => setViewMode('rate')}
        className={`flex-1 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider transition-all ${
          viewMode === 'rate'
            ? 'bg-white/15 text-white shadow-sm dark:bg-volt/15 dark:text-volt'
            : 'text-white/50 hover:text-white/80'
        }`}
      >
        평가하기
      </button>
      <button
        type="button"
        onClick={() => resultsUnlocked && setViewMode('results')}
        disabled={!resultsUnlocked}
        title={resultsUnlocked ? undefined : '내 평점을 저장하면 공개됩니다'}
        className={`flex-1 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
          !resultsUnlocked
            ? 'text-white/25 cursor-not-allowed'
            : viewMode === 'results'
              ? 'bg-white/15 text-white shadow-sm dark:bg-volt/15 dark:text-volt'
              : 'text-white/50 hover:text-white/80'
        }`}
      >
        {!resultsUnlocked && <Lock size={11} />}
        결과 보기
      </button>
    </div>
  );

  // Status row: tabs while rating is open, a "closed" banner once the 24h window passes
  const renderStatusRow = () =>
    ratingClosed ? (
      <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-black/20 dark:bg-black/40 text-white/50 shrink-0">
        <Lock size={11} />
        <span className="text-[11px] font-black uppercase tracking-wider">평가 마감 · 팬 평점 결과</span>
      </div>
    ) : (
      renderTabs()
    );

  // RATE view: interactive stars only — deliberately NO average/vote count (avoid anchoring)
  const renderRateRows = () =>
    ratings.length > 0 ? (
      ratings.map((p) => (
        <div
          key={p.playerName}
          className="flex flex-col gap-1 py-2 border-b border-white/5 last:border-b-0 shrink-0"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {p.shirt && (
              <span className="text-[9px] font-black text-white/60 bg-white/10 px-1 py-0.5 rounded shrink-0">
                {p.shirt}
              </span>
            )}
            <span className="text-sm md:text-xs font-bold text-white/95 truncate leading-tight">
              {p.playerName}
            </span>
          </div>
          <StarRating playerName={p.playerName} value={p.myScore} />
        </div>
      ))
    ) : (
      <div className="flex flex-col items-center justify-center py-8 text-center text-white/30 h-full">
        <span className="text-xs uppercase font-bold tracking-wider">명단이 존재하지 않습니다</span>
      </div>
    );

  // RESULTS view: read-only community averages, sorted highest first
  const renderResultRows = () => {
    const rated = [...ratings]
      .filter((p) => p.voteCount > 0)
      .sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));

    if (rated.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center text-white/30 h-full gap-2">
          <Award size={28} className="opacity-40" />
          <span className="text-xs uppercase font-bold tracking-wider">아직 집계된 평점이 없습니다</span>
        </div>
      );
    }

    return rated.map((p, idx) => (
      <div
        key={p.playerName}
        className="flex items-center justify-between gap-3 py-2.5 border-b border-white/5 last:border-b-0 shrink-0"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`shrink-0 w-4 text-center text-xs font-black tabular-nums ${idx === 0 ? 'text-volt' : 'text-white/40'}`}>
            {idx + 1}
          </span>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              {p.shirt && (
                <span className="text-[9px] font-black text-white/60 bg-white/10 px-1 py-0.5 rounded shrink-0">
                  {p.shirt}
                </span>
              )}
              <span className="text-sm md:text-xs font-bold text-white/95 truncate leading-tight">
                {p.playerName}
              </span>
            </div>
            <span className="text-[10px] text-white/40 mt-0.5 truncate">
              {p.voteCount}명 참여{p.myScore ? ` · 내 평점 ${p.myScore.toFixed(1)}` : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StaticStars value={p.averageScore} />
          <span className="w-8 text-right text-sm font-black tabular-nums text-volt">
            {p.averageScore.toFixed(1)}
          </span>
        </div>
      </div>
    ));
  };

  // Submit button + guidance (rate mode only)
  const renderSubmitBar = () => (
    <>
      <button
        onClick={handleSubmitRatings}
        disabled={isSubmitDisabled}
        className={`w-full py-2.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
          isSubmitDisabled
            ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
            : 'bg-aleti-navy text-white hover:scale-[1.02] hover:bg-aleti-navy/90 active:scale-95 shadow-md dark:bg-volt dark:text-black dark:hover:bg-volt/95 dark:shadow-volt/10'
        }`}
      >
        {isSubmitting
          ? '제출 중...'
          : !allPlayersRated
            ? '모든 선수 평점 입력 필요'
            : `평점 저장하기 (${Object.keys(unsavedRatings).length})`}
      </button>
      <p className="text-[10px] text-white/40 text-center font-medium tracking-tight">
        {submitSuccess ? '저장 완료! 결과가 공개되었습니다.' : '저장하면 다른 팬들의 평점이 공개됩니다.'}
      </p>
    </>
  );

  return (
    <>
      {/* ===== Desktop: inline panel ===== */}
      <div className="hidden md:flex w-full flex-col h-full bg-black/10 dark:bg-black/25 rounded-lg pt-4 pb-4 pl-4 pr-0 border border-white/5">
        {isLoading ? (
          <div className="flex-1 min-h-[220px] flex flex-col items-center justify-center text-white/50">
            <Loader2 className="w-8 h-8 animate-spin text-white mb-2" />
            <span className="text-xs font-semibold tracking-wider uppercase">Loading squad...</span>
          </div>
        ) : (
          <>
            {/* Title */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 pr-4 shrink-0">
              <div className="flex items-center gap-1.5">
                <Award className="text-volt" size={16} />
                <span className="text-xs font-black tracking-wider uppercase text-white">이번 경기 선수 평점</span>
              </div>
              {effectiveView === 'rate' && (
                <span className="text-[10px] font-bold text-white/50 tracking-tight">0~5</span>
              )}
            </div>

            {/* Tabs / closed banner */}
            <div className="pr-4 mb-3 shrink-0">{renderStatusRow()}</div>

            {/* Deadline countdown (rate mode) */}
            {effectiveView === 'rate' && remainingLabel && (
              <div className="pr-4 mb-3 shrink-0">
                <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-volt/10 text-volt">
                  <Clock size={12} />
                  <span className="text-[11px] font-black tracking-tight">평가 마감까지 {remainingLabel} 남음</span>
                </div>
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto pr-1.5 flex flex-col gap-1.5 custom-scrollbar-red">
              {effectiveView === 'rate' ? renderRateRows() : renderResultRows()}
            </div>

            {/* Submission Actions (rate mode only) */}
            {effectiveView === 'rate' && (
              <div className="pt-3 border-t border-white/10 mt-3 flex flex-col gap-1.5 pr-4 shrink-0">
                {renderSubmitBar()}
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== Mobile: trigger that opens the full-screen modal ===== */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="md:hidden w-full flex items-center justify-between gap-3 bg-black/10 dark:bg-black/25 rounded-lg p-4 border border-white/5 text-left active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Award className="text-volt shrink-0" size={20} />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black tracking-wider uppercase text-white">
              {ratingClosed ? '선수 평점 결과' : '선수 평점 매기기'}
            </span>
            <span className="text-[10px] font-bold text-white/50 tracking-tight truncate">
              {isLoading
                ? '불러오는 중...'
                : ratingClosed
                  ? '평가 마감 · 결과 보기'
                  : ratings.length > 0
                    ? `${myRatedCount}/${ratings.length}명 평가함${remainingLabel ? ` · 마감 ${remainingLabel} 전` : ' · 탭하여 매기기'}`
                    : '명단 준비중'}
            </span>
          </div>
        </div>
        <ChevronRight className="text-white/50 shrink-0" size={18} />
      </button>

      {/*
        ===== Mobile: full-screen modal =====

        **body로 내보내야 한다(포털).** 이 컴포넌트가 놓인 자리는 매치 카드 안이고,
        그 위에 animate-pageSlide가 걸린 칸이 있다. 애니메이션이 끝나도 transform이
        남아 있어서(fill-mode) 그 칸이 fixed의 기준이 되어 버린다. 그러면 inset-0은
        화면이 아니라 그 좁은 칸을 덮고, 카드의 overflow-hidden이 나머지를 잘라내
        평점 팝업이 '경기 상세 정보 보기' 버튼과 겹쳐 보인다.
        기준을 화면으로 되돌리려면 카드 바깥에서 그려야 한다.
      */}
      {/* isModalOpen은 클릭으로만 켜지므로 서버 렌더에서는 항상 닫혀 있다 —
          document가 없는 시점에 포털이 열릴 일은 없다 */}
      {isModalOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="이번 경기 선수 평점"
          className="md:hidden fixed inset-0 z-[100] flex flex-col bg-aleti-red dark:bg-[#0d0e14] animate-fadeIn"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 h-14 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Award className="text-volt shrink-0" size={18} />
              <span className="text-sm font-black tracking-wider uppercase text-white">이번 경기 선수 평점</span>
              {effectiveView === 'rate' && (
                <span className="text-[10px] font-bold text-white/40 tracking-tight ml-0.5 shrink-0">0~5</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              aria-label="닫기"
              className="p-2 -mr-2 text-white/70 hover:text-white active:scale-90 transition"
            >
              <X size={22} />
            </button>
          </div>

          {/* Tabs / closed banner */}
          <div className="px-5 pt-3 shrink-0">{renderStatusRow()}</div>

          {/* Deadline countdown (rate mode) */}
          {effectiveView === 'rate' && remainingLabel && (
            <div className="px-5 pt-3 shrink-0">
              <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-volt/10 text-volt">
                <Clock size={13} />
                <span className="text-xs font-black tracking-tight">평가 마감까지 {remainingLabel} 남음</span>
              </div>
            </div>
          )}

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto px-5 pt-3 pb-3 flex flex-col gap-1.5 custom-scrollbar-red">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-white/50">
                <Loader2 className="w-8 h-8 animate-spin text-white mb-2" />
                <span className="text-xs font-semibold tracking-wider uppercase">Loading squad...</span>
              </div>
            ) : effectiveView === 'rate' ? (
              renderRateRows()
            ) : (
              renderResultRows()
            )}
          </div>

          {/* Fixed submit bar (rate mode only) — 홈 인디케이터에 저장 버튼이 가리지 않게 */}
          {effectiveView === 'rate' && (
            <div className="shrink-0 px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] border-t border-white/10 bg-black/10 flex flex-col gap-1.5">
              {renderSubmitBar()}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
