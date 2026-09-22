'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Megaphone,
  MessageSquare,
  Radio,
  Send,
  User,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';

import TicketNicknameModal from './TicketNicknameModal';
import { FREE_ROOM_ID, useChatRoom } from '../useChatRoom';
import StadiumLights from './StadiumLights';
import WinConfetti from './WinConfetti';
import LedStrip from './LedStrip';
import LedRing from './LedRing';
import StadiumMessageItem from './StadiumMessageItem';
import GoalCard from './GoalCard';
import { isAtleti, matchMinuteNow, type SubEvent } from './boardModel';
import type { LiveSubstitution } from '@/client/types.gen';
import { latinCompetition, latinPlayer, latinTeam } from './boardNames';
import { buildFeed, type GoalEvent } from './feed';
import { useGoalCelebration } from './useGoalCelebration';
import { previewGoals, previewMatch, previewMessages } from './previewData';
import AdminChatPanel from '../admin/AdminChatPanel';

interface StadiumChatContainerProps {
  initialMatchId: string;
  isPreview?: boolean;
  previewTicket?: boolean;
  previewPre?: boolean;
  previewSub?: boolean;
}

const SUB_BOARD_MS = 5000;

const MESSAGE_BOARD_MS = 20000;

const SUB_RESUME_MIN_MS = 1200;

const PREVIEW_SUB: SubEvent = {
  minute: "62'",
  playerIn: 'Giuliano Simeone',
  playerOut: 'Alexander Sørloth',
};

const SUB_FRESH_MINUTES = 3;

const FINAL_STATUS = new Set(['경기종료', '종료', '경기취소', '취소', '연기', '몰수']);

const MATCH_CHANTS = [
  '👍',
  '¡Vamos!',
  'GOOOL! ⚽',
  '¡Aúpa Atleti!',
  'Atleti! Atleti!',
];

/* 경기 채팅방 화면. LED 보드·골 연출·교체 보드·채팅을 한 화면으로 */
export default function StadiumChatContainer({
  initialMatchId,
  isPreview = false,
  previewTicket = false,
  previewPre = false,
  previewSub = false,
}: StadiumChatContainerProps) {
  const {
    matchId,
    recentMatch,
    messages,
    live,
    liveLoaded,
    onlineCount,
    ledMessage,
    isLoading,
    roomOpen,
    showDisconnected,
    errorNotice,
    setErrorNotice,
    myNickname,
    isNicknameModalOpen,
    nicknameError,
    handleNicknameSuccess,
    openNicknameModal,
    closeNicknameModal,
    inputContent,
    setInputContent,
    isSending,
    handleSendMessage,
    scrollContainerRef,
    isPlayingChant,
    toggleChant,
    playChant,
    handleBack,
  } = useChatRoom(initialMatchId);

  // 스포 방지 경기장 화면을 끄기
  const [lightsOff, setLightsOff] = useState(false);

  // WebGL을 못 쓰는 기기에서는 CSS 보드로
  const [ledFallback, setLedFallback] = useState(false);
  const handleLedUnavailable = useCallback(() => setLedFallback(true), []);

  const match = useMemo(
    () => recentMatch ?? (isPreview ? previewMatch(previewPre) : null),
    [recentMatch, isPreview, previewPre]
  );

  const { celebrating, celebrate, winning, celebrateWin } = useGoalCelebration();

  const goals = useMemo<GoalEvent[]>(() => {
    if (isPreview) return previewPre ? [] : previewGoals();
    if (!live) return [];

    const atletiIsHome = isAtleti(live.homeTeam);
    let home = 0;
    let away = 0;

    return live.scorers.map((s) => {
      const scoredForHome = s.isHome !== s.ownGoal;
      if (scoredForHome) home += 1;
      else away += 1;

      return {
        id: `${s.isHome ? 'H' : 'A'}|${s.time}+${s.addedTime}|${s.name}|${s.ownGoal}`,
        scorer: s.name,
        nameLatin: s.nameLatin ?? undefined,
        minute: s.addedTime ? `${s.time}+${s.addedTime}'` : `${s.time}'`,
        homeScore: home,
        awayScore: away,
        isAtleti: scoredForHome === atletiIsHome,
        ownGoal: s.ownGoal,
        at: live.updatedAt,
      };
    });
  }, [isPreview, previewPre, live]);

  const seenGoalIds = useRef<Set<string> | null>(null);
  const [celebratingGoal, setCelebratingGoal] = useState<GoalEvent | null>(null);

  useEffect(() => {
    if (isPreview || !live) return;

    const ids = new Set(goals.map((g) => g.id));
    const previous = seenGoalIds.current;
    seenGoalIds.current = ids;
    if (previous === null) return;

    const fresh = goals.filter((g) => g.isAtleti && !previous.has(g.id));
    if (fresh.length === 0) return;

    setCelebratingGoal(fresh[fresh.length - 1]);
    celebrate();
  }, [goals, live, isPreview, celebrate]);

  const seenSubKeys = useRef<Set<string> | null>(null);
  const [subEvent, setSubEvent] = useState<SubEvent | null>(null);
  // 교체는 한 번에 여러 건이 오면 순서대로 표기
  const [subQueue, setSubQueue] = useState<SubEvent[]>([]);
  const subShownMs = useRef(0);
  const [tabHidden, setTabHidden] = useState(false);

  useEffect(() => {
    if (isPreview || !live) return;

    const subs = live.substitutions ?? [];
    const keyOf = (s: LiveSubstitution) =>
      `${s.isHome ? 'H' : 'A'}|${s.minute}+${s.addedTime}|${s.playerOut}>${s.playerIn}`;

    const keys = new Set(subs.map(keyOf));
    const previous = seenSubKeys.current;
    seenSubKeys.current = keys;
    if (previous === null) return;

    const atletiIsHome = isAtleti(live.homeTeam);
    const fresh = subs.filter((s) => s.isHome === atletiIsHome && !previous.has(keyOf(s)));
    if (fresh.length === 0) return;

    const minuteNow = matchMinuteNow(live.kickoff ?? '', Date.now(), live.periods, live.status);
    const recent = fresh.filter(
      (s) => minuteNow === null || minuteNow - (s.minute + s.addedTime) <= SUB_FRESH_MINUTES
    );
    if (recent.length === 0) return;

    setSubQueue((prev) => [
      ...prev,
      ...recent.map((s) => ({
        minute: s.addedTime > 0 ? `${s.minute}+${s.addedTime}'` : `${s.minute}'`,
        playerOut: s.playerOut,
        playerIn: s.playerIn,
        injury: s.injury,
      })),
    ]);
  }, [live, isPreview]);

  useEffect(() => {
    const sync = () => setTabHidden(document.visibilityState === 'hidden');
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  const [boardMessage, setBoardMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!ledMessage) return;
    setBoardMessage(ledMessage.text);
    const timer = setTimeout(() => setBoardMessage(null), MESSAGE_BOARD_MS);
    return () => clearTimeout(timer);
  }, [ledMessage]);

  useEffect(() => {
    if (tabHidden || subEvent || subQueue.length === 0) return;

    setSubEvent(subQueue[0]);
    setSubQueue((prev) => prev.slice(1));
    subShownMs.current = 0;
  }, [tabHidden, subEvent, subQueue]);

  useEffect(() => {
    if (!subEvent || tabHidden) return;

    const left = Math.max(SUB_BOARD_MS - subShownMs.current, SUB_RESUME_MIN_MS);
    const since = Date.now();
    const timer = setTimeout(() => setSubEvent(null), left);

    return () => {
      clearTimeout(timer);
      subShownMs.current += Date.now() - since;
    };
  }, [subEvent, tabHidden]);

  const celebratedWin = useRef(false);
  useEffect(() => {
    if (isPreview || !live || celebratedWin.current) return;
    if (!FINAL_STATUS.has(live.status.replace(/\s/g, ''))) return;

    celebratedWin.current = true;
    const atletiIsHome = isAtleti(live.homeTeam);
    const ours = atletiIsHome ? live.homeScore : live.awayScore;
    const theirs = atletiIsHome ? live.awayScore : live.homeScore;
    if (ours <= theirs) return;

    celebrateWin();
    playChant();
  }, [live, isPreview, celebrateWin, playChant]);

  const shownNickname = isPreview && !myNickname ? '나' : myNickname;

  // 채팅과 골 카드를 시간순으로 한 줄에 합친다
  const feed = useMemo(() => {
    if (isPreview) return buildFeed(previewMessages(shownNickname), goals);
    return buildFeed(messages, []);
  }, [isPreview, shownNickname, messages, goals]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [feed.length, scrollContainerRef]);

  const boardMatch = isPreview || liveLoaded ? match : null;

  const lastGoal = goals[goals.length - 1];
  const homeScore = live?.homeScore ?? lastGoal?.homeScore ?? boardMatch?.homeScore ?? 0;
  const awayScore = live?.awayScore ?? lastGoal?.awayScore ?? boardMatch?.awayScore ?? 0;

  const homeTeam = latinTeam(
    live?.homeTeam ?? boardMatch?.homeTeam ?? 'Atlético de Madrid',
    live?.homeTeamLatin
  );
  const awayTeam = latinTeam(live?.awayTeam ?? boardMatch?.awayTeam ?? 'Rival', live?.awayTeamLatin);

  const boardGoal = celebratingGoal ?? (isPreview ? lastGoal : null);
  // 자책골에는 이름을 올리지 않는다. 우리 골을 넣은 선수로 읽힌다
  const boardScorer =
    boardGoal && boardGoal.isAtleti && !boardGoal.ownGoal
      ? latinPlayer(boardGoal.scorer, boardGoal.nameLatin) || undefined
      : undefined;

  const liveOpponent = live ? (isAtleti(live.homeTeam) ? live.awayTeam : live.homeTeam) : null;
  const opponent = liveOpponent ?? (match ? (match.isHome ? match.awayTeam : match.homeTeam) : null);
  const title = opponent ? `vs ${opponent}` : '아틀레티코 마드리드';

  const ticketFixture = opponent ? `vs ${latinTeam(opponent)}` : 'Atlético de Madrid';
  const ticketMeta = [
    latinCompetition(match?.tournament, 'Riyadh Air Metropolitano'),
    match?.matchDate
      ? new Date(match.matchDate).toLocaleString('ko-KR', {
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  // 화면: 헤더 · LED 보드 · 대화 · 입력창
  return (
    <div
      className={`stadium-room ${celebrating && !lightsOff ? 'is-celebrating' : ''}`}
      data-plain={lightsOff ? 'true' : 'false'}
    >
      <header className="stadium-header">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="stadium-icon-btn shrink-0"
            aria-label="이전 화면으로"
            title="이전 화면으로"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-sm font-black leading-tight tracking-tight text-gray-900 sm:text-base">
              {title}
            </h1>
            <p className="truncate text-[10px] font-medium leading-tight text-gray-500 sm:text-[11px]">
              {match?.tournament ? `${match.tournament} · ` : ''}
              실시간
              <span className="hidden xs:inline"> 채팅방</span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {roomOpen && (
            <span className="stadium-live-badge">
              <Radio size={11} className="animate-pulse" />
              <span className="hidden xs:inline">LIVE</span>
            </span>
          )}

          <span className="stadium-count">
            <Users size={12} className="shrink-0" />
            <span className="tabular-nums">{onlineCount.toLocaleString('ko-KR')}</span>
          </span>

          <AdminChatPanel matchId={matchId} />

          <button
            type="button"
            onClick={openNicknameModal}
            className={`stadium-namechip shrink-0 ${myNickname ? '' : 'is-empty'}`}
            title={myNickname ? `닉네임 변경 (${myNickname})` : '이름 정하기'}
            aria-label={myNickname ? `닉네임 변경. 현재 ${myNickname}` : '이름 정하기'}
          >
            <User size={12} className="shrink-0" />
            <span className={`truncate ${myNickname ? 'hidden xs:inline' : ''}`}>
              {myNickname || '이름 정하기'}
            </span>
          </button>

          <button
            type="button"
            onClick={toggleChant}
            className={`stadium-icon-btn shrink-0 ${isPlayingChant ? 'is-active' : ''}`}
            aria-pressed={isPlayingChant}
            title={isPlayingChant ? '응원가 끄기' : '응원가 켜기'}
          >
            {isPlayingChant ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
        </div>
      </header>

      <div className="stadium-pitchview">
        <div className="stadium-stage__photo" aria-hidden="true" />
        <div className="stadium-stage__scrim" aria-hidden="true" />

        {!lightsOff && (
          <div
            className="pointer-events-none absolute bottom-0 left-2 z-0 select-none opacity-40"
            aria-hidden="true"
          >
            <Image
              src="/magarita.png"
              alt=""
              width={29}
              height={32}
              className="object-contain"
              unoptimized
            />
          </div>
        )}

        <StadiumLights active={celebrating && !lightsOff} />

        {!lightsOff && (() => {
          const boardProps = {
            mode: celebrating
              ? ('goal' as const)
              : boardMessage
                ? ('message' as const)
                : subEvent || previewSub
                  ? ('sub' as const)
                  : ('idle' as const),
            message: boardMessage ?? undefined,
            homeTeam,
            awayTeam,
            homeScore,
            awayScore,
            competition: live?.competitionLatin ?? live?.competition ?? boardMatch?.tournament,
            venue: boardMatch?.isHome === false ? undefined : 'Riyadh Air Metropolitano',
            kickoff: live?.kickoff ?? boardMatch?.matchDate,
            periods: live?.periods,
            status: live?.status,
            scorer: boardScorer,
          };
          return ledFallback ? (
            <LedStrip {...boardProps} />
          ) : (
            <LedRing {...boardProps} onUnavailable={handleLedUnavailable} />
          );
        })()}

        <div className="stadium-stage">
        <div ref={scrollContainerRef} className="stadium-scroll">
          {isLoading && feed.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-12">
              <Loader2 className="h-7 w-7 animate-spin text-aleti-red" />
              <span className="stadium-meta text-xs font-bold tracking-wider text-slate-600">
                스탠드로 들어가는 중...
              </span>
            </div>
          ) : feed.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-900/10 bg-white/80 text-aleti-red shadow-sm backdrop-blur-md">
                <MessageSquare size={24} />
              </div>
              <p className="stadium-meta text-sm font-black text-slate-900">
                아직 스탠드가 조용해요
              </p>
              <p className="stadium-meta text-xs font-medium text-slate-600">
                첫 함성을 질러주세요. ¡Aúpa Atleti!
              </p>
            </div>
          ) : (
            feed.map((item) =>
              item.kind === 'goal' ? (
                <GoalCard key={item.key} goal={item.goal} />
              ) : (
                <StadiumMessageItem
                  key={item.key}
                  msg={item.msg}
                  myNickname={shownNickname}
                  matchId={matchId}
                />
              )
            )
          )}
        </div>

        {celebrating && !lightsOff && <div className="stadium-goal-flash" aria-hidden="true" />}

        {!roomOpen && !isLoading && !errorNotice && (
          <div className="stadium-notice-slot">
            <div className="stadium-notice">
              <span className="shrink-0">⏳</span>
              <span className="flex-1 leading-snug">
                이 경기 채팅방은 킥오프 1시간 전에 열려요. 그동안은{' '}
                <Link href={`/chat/${FREE_ROOM_ID}`} className="underline">
                  자유 채팅방
                </Link>
                에서 이야기 나눠요!
              </span>
            </div>
          </div>
        )}

        {(showDisconnected || errorNotice) && !isLoading && (
          <div className="stadium-notice-slot">
            <div
              role="status"
              className={`stadium-notice ${errorNotice ? 'stadium-notice--error' : ''}`}
            >
              <span className="shrink-0">{errorNotice ? '⚠️' : '🔌'}</span>
              <span className="flex-1 leading-snug">
                {errorNotice || '채팅 서버와 연결이 끊겼어요. 다시 연결하는 중...'}
              </span>
              {errorNotice && (
                <button
                  type="button"
                  onClick={() => setErrorNotice('')}
                  className="shrink-0 px-1.5 opacity-70 hover:opacity-100"
                  aria-label="알림 닫기"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      <div className="stadium-chants no-scrollbar">
        {MATCH_CHANTS.map((chant) => (
          <button
            key={chant}
            type="button"
            onClick={() => handleSendMessage(chant)}
            className="stadium-chip"
          >
            {chant}
          </button>
        ))}
      </div>

      <div className="stadium-composer">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 sm:gap-3"
        >
          <button
            type="button"
            onClick={() => setLightsOff((v) => !v)}
            className={`stadium-icon-btn stadium-icon-btn--round shrink-0 ${lightsOff ? 'is-active' : ''}`}
            aria-pressed={lightsOff}
            title={
              lightsOff
                ? '경기장 화면 켜기'
                : '경기장 화면 끄기 (스코어·연출을 감추고 대화만 봅니다)'
            }
          >
            <span className="stadium-off">OFF</span>
          </button>

          <div className="relative flex-1">
            <Megaphone
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder={
                myNickname ? '스탠드에서 함성 보내기...' : '닉네임을 먼저 정해주세요'
              }
              maxLength={200}
              className={`w-full rounded-full border border-gray-200 bg-white py-3 pl-10 text-base font-medium text-gray-900 placeholder-gray-400 transition focus:border-aleti-red focus:outline-none focus:ring-1 focus:ring-aleti-red sm:text-sm ${
                inputContent ? 'pr-14' : 'pr-4'
              }`}
            />
            {inputContent && (
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-gray-400">
                {inputContent.length}/200
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSending || !inputContent.trim()}
            className="stadium-send shrink-0"
            aria-label="전송"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      <WinConfetti active={winning && !lightsOff} />

      <TicketNicknameModal
        isOpen={previewTicket || (isNicknameModalOpen && !isPreview)}
        matchId={matchId}
        fixture={ticketFixture}
        meta={ticketMeta}
        currentNickname={myNickname}
        initialError={nicknameError}
        onSuccess={handleNicknameSuccess}
        onClose={closeNicknameModal}
      />
    </div>
  );
}
