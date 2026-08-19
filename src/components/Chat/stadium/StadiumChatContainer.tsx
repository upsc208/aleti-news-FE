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
import { isAtleti } from './boardModel';
import { latinCompetition, latinPlayer, latinTeam } from './boardNames';
import { buildFeed, type GoalEvent } from './feed';
import { useGoalCelebration } from './useGoalCelebration';
import { previewGoals, previewMatch, previewMessages } from './previewData';

interface StadiumChatContainerProps {
  initialMatchId: string;
  /** 백엔드 없이 화면만 확인하는 모드 — 페이지가 dev 빌드에서만 켜준다 (?preview=1) */
  isPreview?: boolean;
  /** 입장 티켓 디자인만 띄워 보는 모드 (?preview=1&ticket=1) */
  previewTicket?: boolean;
  /** 킥오프 전 화면을 띄워 보는 모드 (?preview=1&pre=1) */
  previewPre?: boolean;
}


const MATCH_CHANTS = [
  '👍',
  '¡Vamos!',
  'GOOOL! ⚽',
  '¡Aúpa Atleti!',
  'Atleti! Atleti!',
];

export default function StadiumChatContainer({
  initialMatchId,
  isPreview = false,
  previewTicket = false,
  previewPre = false,
}: StadiumChatContainerProps) {
  const {
    matchId,
    recentMatch,
    messages,
    live,
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

  /**
   * 경기장 화면을 통째로 끄는 스위치.
   *
   * 배경 사진도 LED 보드도 없이 흰 바탕에 대화만 남는다. 스코어가 적힌 것(보드)과
   * 골이 터진 것을 알리는 연출(조명·섬광·흔들림·색종이)을 전부 렌더하지 않으므로,
   * 경기를 나중에 볼 사람이 결과를 모른 채 채팅만 따라갈 수 있다.
   */
  const [lightsOff, setLightsOff] = useState(false);

  // 보드는 WebGL 곡면판(LedRing)이 기본이다. WebGL을 못 쓰는 기기에서만
  // CSS 보드(LedStrip)로 되돌린다 — 보드가 빠지면 헤더 아래가 빈 자리로 남는다.
  const [ledFallback, setLedFallback] = useState(false);
  const handleLedUnavailable = useCallback(() => setLedFallback(true), []);

  // 미리보기에서는 백엔드가 없으니 헤더·LED가 빈 채로 남는다. 가짜 경기로 채운다.
  const match = useMemo(
    () => recentMatch ?? (isPreview ? previewMatch(previewPre) : null),
    [recentMatch, isPreview, previewPre]
  );

  const { celebrating, celebrate, winning, celebrateWin } = useGoalCelebration();

  /**
   * LED 보드가 그리는 골 목록 — 서버 스냅샷(`live.scorers`)을 그대로 옮긴다.
   *
   * **쌓지 않는다.** 스냅샷은 매번 전체 목록이라, VAR로 골이 취소되면 그 골이 빠진 채로
   * 오고 보드도 따라서 되돌아간다. 예전처럼 배열에 append 하면 취소된 골이 화면에 남는다.
   *
   * 미리보기는 백엔드가 없으니 가짜 골을 쓴다.
   */
  const goals = useMemo<GoalEvent[]>(() => {
    // 킥오프 전 미리보기에는 골이 없다 — 아직 시작도 안 한 경기다
    if (isPreview) return previewPre ? [] : previewGoals();
    if (!live) return [];

    const atletiIsHome = isAtleti(live.homeTeam);
    let home = 0;
    let away = 0;

    // 서버가 시간순으로 정렬해 보내므로 앞에서부터 세면 각 골 시점의 스코어가 된다
    return live.scorers.map((s) => {
      // 자책골은 넣은 선수의 **반대편** 점수가 오른다
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

  /**
   * 새로 들어온 골에만 연출을 켠다.
   *
   * 첫 스냅샷은 기준선으로만 잡는다 — 입장 시점에 이미 3-0인 경기라면 들어오자마자
   * 골 세리머니가 세 번 터진다.
   */
  const seenGoalIds = useRef<Set<string> | null>(null);
  /**
   * 지금 연출 중인 골.
   *
   * 보드에 "목록의 마지막 골"을 넘기면 안 된다. 목록은 분 순서라 같은 분에 상대 골이
   * 섞이면 맨 뒤가 상대 골이 되고, 우리 골로 연출을 켜놓고 보드는 이름을 비운다.
   * 연출을 켠 바로 그 골을 들고 있어야 한다.
   */
  const [celebratingGoal, setCelebratingGoal] = useState<GoalEvent | null>(null);

  useEffect(() => {
    if (isPreview || !live) return;

    const ids = new Set(goals.map((g) => g.id));
    const previous = seenGoalIds.current;
    seenGoalIds.current = ids;
    if (previous === null) return;

    // 실점에는 연출을 켜지 않는다 — 골이 짜릿하려면 실점은 조용해야 한다
    const fresh = goals.filter((g) => g.isAtleti && !previous.has(g.id));
    if (fresh.length === 0) return;

    // 한 턴에 여러 골이 잡혔으면 가장 늦은 골을 보드에 올린다
    setCelebratingGoal(fresh[fresh.length - 1]);
    celebrate();
  }, [goals, live, isPreview, celebrate]);

  /** 경기가 끝나고 아틀레티가 이겼으면 한 번만 축포를 띄운다 */
  const celebratedWin = useRef(false);
  useEffect(() => {
    if (isPreview || !live || celebratedWin.current) return;
    if (!live.status.includes('종료')) return;

    celebratedWin.current = true;
    const atletiIsHome = isAtleti(live.homeTeam);
    const ours = atletiIsHome ? live.homeScore : live.awayScore;
    const theirs = atletiIsHome ? live.awayScore : live.homeScore;
    if (ours > theirs) celebrateWin();
  }, [live, isPreview, celebrateWin]);

  // 미리보기에서는 닉네임 모달을 띄우지 않으므로 임시 이름으로 좌석/내 말풍선을 그린다
  const shownNickname = isPreview && !myNickname ? '나' : myNickname;

  /**
   * 채팅 피드에는 **사람이 친 말만** 올린다.
   *
   * 골은 LED 보드가 맡는다. 골 카드까지 피드에 섞으면 분당 3골이 들어오는 경기에서
   * 대화가 골 카드에 파묻힌다. 봇 메시지 자체는 useChatRoom이 이미 걸러 낸다.
   *
   * 미리보기는 골 카드 디자인을 확인하는 자리이므로 그대로 섞어 보여준다.
   */
  const feed = useMemo(() => {
    if (isPreview) return buildFeed(previewMessages(shownNickname), goals);
    return buildFeed(messages, []);
  }, [isPreview, shownNickname, messages, goals]);

  // 골이 들어오면 카드가 화면 밖에 생기지 않도록 바닥으로 따라 내려간다.
  // (훅의 자동 스크롤은 messages만 보므로 골 카드는 놓친다)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [feed.length, scrollContainerRef]);

  // 지금 스코어 — 서버 스냅샷이 있으면 그 값이 정답이다.
  // 골 목록에서 다시 세지 않는 이유: 자책골 가산을 백엔드가 이미 계산해 두었고,
  // 제공사가 스코어와 득점자 목록을 다르게 줄 때 스코어 쪽을 믿는 편이 맞다.
  const lastGoal = goals[goals.length - 1];
  const homeScore = live?.homeScore ?? lastGoal?.homeScore ?? match?.homeScore ?? 0;
  const awayScore = live?.awayScore ?? lastGoal?.awayScore ?? match?.awayScore ?? 0;

  /**
   * 보드에 올릴 팀 이름 — **라틴 표기만 넘긴다.**
   *
   * 서버가 FotMob에서 가져온 이름이 있으면 그걸 쓰고, 없으면 boardNames의 표로 떨어진다.
   * (match는 "가장 최근에 끝난 경기"라 지금 보는 경기와 다를 수 있어 맨 뒤 폴백이다)
   */
  const homeTeam = latinTeam(live?.homeTeam ?? match?.homeTeam ?? 'Atlético de Madrid', live?.homeTeamLatin);
  const awayTeam = latinTeam(live?.awayTeam ?? match?.awayTeam ?? 'Rival', live?.awayTeamLatin);

  /**
   * 보드에 흘릴 득점자. 미리보기에는 연출 추적이 없으니 마지막 골을 쓴다.
   *
   * **자책골에는 이름을 올리지 않는다.** 넣은 선수는 상대팀인데 점수는 우리 쪽에
   * 오른 것이라, 이름만 크게 흐르면 그 선수가 우리 골을 넣은 것처럼 읽힌다.
   */
  const boardGoal = celebratingGoal ?? (isPreview ? lastGoal : null);
  const boardScorer =
    boardGoal && boardGoal.isAtleti && !boardGoal.ownGoal
      ? latinPlayer(boardGoal.scorer, boardGoal.nameLatin) || undefined
      : undefined;

  // 헤더는 "누구와 붙는 경기인지 · 무슨 대회인지 · 여기가 실시간 채팅방"까지만 말한다.
  // 스코어와 경기장 이름은 바로 아래 LED 보드가 이미 크게 띄우고 있다.
  const opponent = match ? (match.isHome ? match.awayTeam : match.homeTeam) : null;
  const title = opponent ? `vs ${opponent}` : '아틀레티코 마드리드';

  // 입장 티켓에 인쇄할 줄. 보드와 같은 라틴 표기를 쓴다 (boardNames.ts)
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

  return (
    <div
      className={`stadium-room ${celebrating && !lightsOff ? 'is-celebrating' : ''}`}
      data-plain={lightsOff ? 'true' : 'false'}
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

          {/* 내 이름 — 누르면 입장 티켓이 다시 열린다.
              좁은 화면에서는 이름을 접어 아이콘만 남기지만, 이름이 아직 없을 때는
              글자를 남긴다. 그때는 정보가 아니라 눌러야 할 버튼이기 때문이다. */}
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

        {/*
          El ramo de Margarita — 1996년부터 메트로폴리타노 홈 경기마다 남측 골대 왼쪽
          코너 플래그 옆에 로히블랑코 카네이션 다발이 놓인다.
          그 자리가 여기다 — 경기장 그림의 왼쪽 아래 구석. 스크롤 컨테이너 밖에 둬서
          말풍선이 올라가도 코너에 붙어 있는다.
          left-2는 틀이 방보다 8px 넓게 깔려 있는 것을 되돌리는 값이다(.stadium-pitchview).
        */}
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

        {/* 골 순간 스탠드를 훑는 LED 조명 — 붉은빛 + 분홍빛 (WebGL).
            LedStrip보다 앞에 둬야 보드와 말풍선이 그 위에 그려진다.
            평상시에는 렌더 루프가 멈춰 있어 비용이 들지 않는다. */}
        <StadiumLights active={celebrating && !lightsOff} />

        {/* 시계는 킥오프 시각에서 세는 근사값이다(하프타임 15분만 보정).
            서버가 진짜 경기 시계를 주면 clock prop으로 덮어쓰면 된다. */}
        {/* 두 보드는 프로퍼티가 같다 — 자리만 바꿔 끼운다.
            화면을 끈 사람에게는 아예 렌더하지 않는다 — 스코어가 여기 적혀 있다 */}
        {!lightsOff && (() => {
          const boardProps = {
            mode: celebrating ? ('goal' as const) : ('idle' as const),
            homeTeam,
            awayTeam,
            homeScore,
            awayScore,
            // 지금 보는 경기의 대회명. FotMob 라틴 → 네이버 한글 → (마지막으로) 최근 경기 순.
            // 셋 다 없거나 표에 없는 한국어면 latinCompetition이 경기장 이름으로 대신한다.
            competition: live?.competitionLatin ?? live?.competition ?? match?.tournament,
            venue: match?.isHome === false ? undefined : 'Riyadh Air Metropolitano',
            // 지금 보고 있는 경기의 킥오프를 쓴다. match(=recentMatch)는 "가장 최근에 끝난
            // 경기"라 여기 쓰면 며칠 전 시각으로 세다가 90:00에 눌러앉는다.
            kickoff: live?.kickoff ?? match?.matchDate,
            // 실제 전·후반 시작 시각이 오면 예정 킥오프 대신 이걸로 센다 (boardModel 참고)
            periods: live?.periods,
            // 보드에는 라틴 표기만 올린다. 서버가 준 이름이 있으면 그걸 쓰고,
            // 없으면 boardNames의 표로, 그것도 없으면 이름 없이 함성만 흐른다.
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

        {/* 골 순간 화면을 훑고 지나가는 빛 — 흔들림과 LED만으로는 밋밋하다 */}
        {celebrating && !lightsOff && <div className="stadium-goal-flash" aria-hidden="true" />}

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

      {/* 테스트 바는 걷어냈다 — 골·실점·승리가 이제 전부 서버 스냅샷에서 온다.
          연출만 따로 켜보고 싶으면 백엔드의 scripts/fake-live-match.js로 가짜 경기를 돌린다. */}

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
          {/* 경기장 화면 끄기 — 아이콘 대신 글자다. 무엇이 꺼지는지 그림으로는 안 읽힌다 */}
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
        {/* 닉네임을 바꾸는 통로는 헤더의 이름 칩 하나로 모았다 —
            같은 동작을 한 화면에 두 번 두면 어느 쪽이 진짜인지 헷갈린다 */}
      </div>

      {/* 승리 색종이는 방 전체를 덮는다 — 골 연출과 달리 경기장 사진 안에
          가둘 이유가 없다. 입력창 위로도 떨어져야 "방이 축제"로 읽힌다. */}
      <WinConfetti active={winning && !lightsOff} />

      <TicketNicknameModal
        isOpen={previewTicket || (isNicknameModalOpen && !isPreview)}
        matchId={matchId}
        fixture={ticketFixture}
        meta={ticketMeta}
        currentNickname={myNickname}
        initialError={nicknameError}
        onSuccess={handleNicknameSuccess}
        /* 이름을 아직 안 정했어도 닫을 수 있다 — 채팅을 읽기만 하러 온 사람도 있다.
           입력창이 "닉네임을 먼저 정해주세요"로 막아주고, 아래 링크로 다시 열 수 있다. */
        onClose={closeNicknameModal}
      />
    </div>
  );
}
