'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Megaphone,
  MessageSquare,
  Radio,
  Send,
  Sun,
  SunDim,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';

import NicknameModal from '../NicknameModal';
import { FREE_ROOM_ID, useChatRoom } from '../useChatRoom';
import StadiumLights from './StadiumLights';
import WinConfetti from './WinConfetti';
import LedStrip from './LedStrip';
import LedRing from './LedRing';
import StadiumMessageItem from './StadiumMessageItem';
import GoalCard from './GoalCard';
import { buildFeed, type GoalEvent } from './feed';
import { useGoalCelebration } from './useGoalCelebration';
import { previewGoals, previewMatch, previewMessages } from './previewData';

interface StadiumChatContainerProps {
  initialMatchId: string;
  /** 백엔드 없이 화면만 확인하는 모드 — 페이지가 dev 빌드에서만 켜준다 (?preview=1) */
  isPreview?: boolean;
}

// 목업의 빠른 응원 칩. 선수 이름이 들어간 건 라인업이 바뀌면 어색해지므로 넣지 않았다.
// 테스트 버튼이 돌려쓰는 득점자 이름. 실제 이벤트가 붙으면 서버 값을 쓴다.
const TEST_SCORERS = ['훌리안 알바레스', '그리즈만', '소를로트', '코케', '가야르도'];

const MATCH_CHANTS = [
  'Atleti! Atleti!',
  '¡Vamos!',
  '코르차네로 🔴⚪',
  'GOOOL! ⚽',
  '심판 뭐하나 😤',
  '¡Aúpa Atleti!',
];

export default function StadiumChatContainer({
  initialMatchId,
  isPreview = false,
}: StadiumChatContainerProps) {
  const {
    matchId,
    recentMatch,
    messages,
    onlineCount,
    isLoading,
    roomOpen,
    isConnected,
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
    handleBack,
  } = useChatRoom(initialMatchId);

  // 경기장 사진은 대비가 제멋대로라 글이 안 읽히는 경우가 생긴다.
  // 배경을 더 하얗게 눌러 대비를 올리는 통로를 준다.
  const [washed, setWashed] = useState(false);

  // 보드는 WebGL 곡면판(LedRing)이 기본이다. WebGL을 못 쓰는 기기에서만
  // CSS 보드(LedStrip)로 되돌린다 — 보드가 빠지면 헤더 아래가 빈 자리로 남는다.
  const [ledFallback, setLedFallback] = useState(false);
  const handleLedUnavailable = useCallback(() => setLedFallback(true), []);

  // 미리보기에서는 백엔드가 없으니 헤더·LED가 빈 채로 남는다. 가짜 경기로 채운다.
  const match = useMemo(
    () => recentMatch ?? (isPreview ? previewMatch() : null),
    [recentMatch, isPreview]
  );

  const { celebrating, celebrate, winning, celebrateWin } = useGoalCelebration();

  // 골 이벤트를 밀어주는 API가 아직 없다. 채널이 생기면 fireGoal()만 부르면
  // 피드·LED·연출이 전부 따라온다 (feed.ts 주석 참고).
  //
  // 미리보기 골도 같은 배열에 심는다 — 따로 두면 테스트 버튼이 그 골을 못 보고
  // 스코어를 0부터 다시 세서 1-0이 두 번 나온다.
  const [goals, setGoals] = useState<GoalEvent[]>(() => (isPreview ? previewGoals() : []));

  /**
   * 골 하나를 피드에 넣고 연출을 켠다.
   *
   * 지금은 아래 테스트 바가 유일한 호출자다. 나중에 이벤트 구독부에서
   * 서버가 준 값으로 이 함수를 부르면 되고, 테스트 바만 지우면 된다.
   */
  const fireGoal = useCallback(
    (isAtleti: boolean) => {
      setGoals((prev) => {
        // 직전 골의 스코어에서 이어간다. 첫 골이면 경기 정보의 현재 스코어에서 시작
        const last = prev[prev.length - 1];
        const home = last?.homeScore ?? match?.homeScore ?? 0;
        const away = last?.awayScore ?? match?.awayScore ?? 0;

        // 원정 경기면 아틀레티가 away 쪽이다
        const atletiIsHome = match?.isHome !== false;
        const homeScored = isAtleti ? atletiIsHome : !atletiIsHome;

        const index = prev.length;
        return [
          ...prev,
          {
            id: `goal-${index + 1}`,
            scorer: isAtleti ? TEST_SCORERS[index % TEST_SCORERS.length] : '상대 선수',
            assist: isAtleti && index % 2 === 0 ? '그리즈만' : undefined,
            minute: `${Math.min(90, 17 * (index + 1))}'`,
            homeScore: home + (homeScored ? 1 : 0),
            awayScore: away + (homeScored ? 0 : 1),
            isAtleti,
            at: new Date().toISOString(),
          },
        ];
      });

      // 실점에는 연출을 켜지 않는다 — 골이 짜릿하려면 실점은 조용해야 한다
      if (isAtleti) celebrate();
    },
    [match, celebrate]
  );

  // 미리보기에서는 닉네임 모달을 띄우지 않으므로 임시 이름으로 좌석/내 말풍선을 그린다
  const shownNickname = isPreview && !myNickname ? '나' : myNickname;

  const feed = useMemo(() => {
    const msgs = isPreview ? previewMessages(shownNickname) : messages;
    return buildFeed(msgs, goals);
  }, [isPreview, shownNickname, messages, goals]);

  // 골이 들어오면 카드가 화면 밖에 생기지 않도록 바닥으로 따라 내려간다.
  // (훅의 자동 스크롤은 messages만 보므로 골 카드는 놓친다)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [feed.length, scrollContainerRef]);

  // 지금 스코어 — 골이 들어올 때마다 헤더와 LED 스코어 패널이 같이 올라간다.
  // 경기 정보(match)는 방에 들어올 때 한 번 받은 값이라 그 뒤의 골은 골 이벤트가 들고 있다.
  const lastGoal = goals[goals.length - 1];
  const homeScore = lastGoal?.homeScore ?? match?.homeScore ?? 0;
  const awayScore = lastGoal?.awayScore ?? match?.awayScore ?? 0;

  const homeTeam = match?.homeTeam ?? 'Atlético de Madrid';
  const awayTeam = match?.awayTeam ?? 'Rival';

  // 헤더는 "누구와 붙는 경기인지 · 무슨 대회인지 · 여기가 실시간 채팅방"까지만 말한다.
  // 스코어와 경기장 이름은 바로 아래 LED 보드가 이미 크게 띄우고 있다.
  const opponent = match ? (match.isHome ? match.awayTeam : match.homeTeam) : null;
  const title = opponent ? `vs ${opponent}` : '아틀레티코 마드리드';

  return (
    <div
      className={`stadium-room ${celebrating ? 'is-celebrating' : ''}`}
      data-washed={washed ? 'true' : 'false'}
    >
      {/* ── 1. 헤더 ───────────────────────────────────────────── */}
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
            {/* 폰에서는 이 줄이 먼저 잘린다. 글자를 한 단계 줄이고 좁은 화면에서는
                "채팅방"을 떼어내 대회명이 밀려나지 않게 한다 (대회명은 폰에서
                LED 보드가 화면 밖으로 밀려 여기서만 볼 수 있다) */}
            <p className="truncate text-[10px] font-medium leading-tight text-gray-500 sm:text-[11px]">
              {match?.tournament ? `${match.tournament} · ` : ''}
              실시간
              <span className="hidden xs:inline"> 채팅방</span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* 좁은 화면에서는 점만 남긴다 — 글자까지 두면 제목 줄을 잡아먹고,
              부제목의 "실시간 채팅방"이 이미 같은 말을 한다 */}
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

      {/*
        ── 2~3. 스탠드에서 본 화면 ─────────────────────────────
        LED 보드와 피드를 한 틀에 넣는다. 사진이 이 틀 전체를 덮어야
        보드의 휜 모서리 사이로 뒤에 있는 경기장이 보인다 —
        보드를 별도 줄로 두면 그 자리에 빈 배경색이 드러난다.
      */}
      <div className="stadium-pitchview">
        {/* 경기장 사진. public/metropolitano-day.jpg 가 없으면 이 레이어는 그냥
            비어 있고 아래 CSS 폴백(잔디·조명 그라디언트)이 그대로 보인다 */}
        <div className="stadium-stage__photo" aria-hidden="true" />
        <div className="stadium-stage__scrim" aria-hidden="true" />

        {/* 골 순간 스탠드를 훑는 LED 조명 — 붉은빛 + 분홍빛 (WebGL).
            LedStrip보다 앞에 둬야 보드와 말풍선이 그 위에 그려진다.
            평상시에는 렌더 루프가 멈춰 있어 비용이 들지 않는다. */}
        <StadiumLights active={celebrating} dimmed={washed} />

        {/* 시계는 킥오프 시각에서 세는 근사값이다(하프타임 15분만 보정).
            서버가 진짜 경기 시계를 주면 clock prop으로 덮어쓰면 된다. */}
        {/* 두 보드는 프로퍼티가 같다 — 자리만 바꿔 끼운다 */}
        {(() => {
          const boardProps = {
            mode: celebrating ? ('goal' as const) : ('idle' as const),
            homeTeam,
            awayTeam,
            homeScore,
            awayScore,
            competition: match?.tournament,
            venue: match?.isHome === false ? undefined : 'Riyadh Air Metropolitano',
            kickoff: match?.matchDate,
            scorer: lastGoal?.isAtleti ? lastGoal.scorer : undefined,
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

        {/* 골 순간 화면을 훑고 지나가는 빛 — 흔들림과 LED만으로는 밋밋하다 */}
        {celebrating && <div className="stadium-goal-flash" aria-hidden="true" />}

        {/* 방이 아직 안 열림 — 경기 채팅방은 킥오프 1시간 전부터 종료 3시간 후까지만 열린다 */}
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

        {/* 연결 끊김 / 정책 위반 안내 */}
        {(!isConnected || errorNotice) && !isLoading && (
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

      {/*
        ── 테스트 바 ──────────────────────────────────────────
        골 이벤트 API가 붙기 전까지 연출을 손으로 켜보는 줄.
        실제 이벤트 구독부가 생기면 이 블록만 지우면 된다 — fireGoal()은 그대로 쓴다.
      */}
      <div className="stadium-testbar">
        <span className="stadium-testbar__tag">TEST</span>
        <button type="button" onClick={() => fireGoal(true)} className="stadium-testbar__btn is-goal">
          ⚽ 골 넣기
        </button>
        <button type="button" onClick={() => fireGoal(false)} className="stadium-testbar__btn">
          실점
        </button>
        <button
          type="button"
          onClick={() => setGoals([])}
          className="stadium-testbar__btn"
          disabled={goals.length === 0}
        >
          초기화
        </button>
        {/* 경기 종료를 알려주는 채널도 아직 없다. 생기면 "종료 + 아틀레티 승"에서
            celebrateWin()만 부르면 된다 — 이 버튼만 지우면 그대로 넘어간다. */}
        <button
          type="button"
          onClick={() => celebrateWin()}
          className="stadium-testbar__btn is-win"
        >
          🎉 승리
        </button>
      </div>

      {/* ── 4. 빠른 응원 ───────────────────────────────────────── */}
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

      {/* ── 5. 입력 바 ─────────────────────────────────────────── */}
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
            onClick={() => setWashed((v) => !v)}
            className={`stadium-icon-btn stadium-icon-btn--round shrink-0 ${washed ? 'is-active' : ''}`}
            aria-pressed={washed}
            title={washed ? '배경 선명하게' : '배경 흐리게 (글씨가 잘 보여요)'}
          >
            {washed ? <SunDim size={18} /> : <Sun size={18} />}
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
              /* iOS는 16px 미만 입력창에 포커스가 가면 화면을 확대한다.
                 모바일에서만 16px(text-base)로 올려 확대를 막는다 */
              className={`w-full rounded-full border border-gray-200 bg-white py-3 pl-10 text-base font-medium text-gray-900 placeholder-gray-400 transition focus:border-aleti-red focus:outline-none focus:ring-1 focus:ring-aleti-red sm:text-sm ${
                inputContent ? 'pr-14' : 'pr-4'
              }`}
            />
            {/* 글자수는 실제로 칠 때만 띄운다 — 좁은 화면에서 늘 떠 있으면
                placeholder 뒷부분을 잘라먹는다 */}
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

        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={openNicknameModal}
            className="text-[10px] font-bold text-gray-400 underline underline-offset-2 transition hover:text-gray-700"
          >
            닉네임 변경
          </button>
        </div>
      </div>

      {/* 승리 색종이는 방 전체를 덮는다 — 골 연출과 달리 경기장 사진 안에
          가둘 이유가 없다. 입력창 위로도 떨어져야 "방이 축제"로 읽힌다. */}
      <WinConfetti active={winning} />

      <NicknameModal
        isOpen={isNicknameModalOpen && !isPreview}
        matchId={matchId}
        currentNickname={myNickname}
        initialError={nicknameError}
        onSuccess={handleNicknameSuccess}
        onClose={myNickname ? closeNicknameModal : undefined}
      />
    </div>
  );
}
