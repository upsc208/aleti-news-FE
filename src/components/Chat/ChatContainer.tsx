'use client';

import React from 'react';
import ChatMessageItem from './ChatMessageItem';
import NicknameModal from './NicknameModal';
import { FREE_ROOM_ID, useChatRoom } from './useChatRoom';
import {
  Users,
  Send,
  Sparkles,
  Flame,
  ArrowLeft,
  MessageSquare,
  Volume2,
  VolumeX,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ChatContainerProps {
  initialMatchId?: string;
}

const QUICK_CHANTS = [
  '👍',
  '🎉',
  '¡Aúpa Atleti! 🔴⚪',
  'GOL! ⚽',
  '🔴⚪ ROJIBLANCO!',
];

// 이모지 단독 버튼은 text-xs로 두면 너무 작아서 크게 렌더한다
const isEmojiOnly = (chant: string) => !/[a-zA-Z가-힣]/.test(chant);

export default function ChatContainer({ initialMatchId = 'recent' }: ChatContainerProps) {
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
    isFreeRoom,
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

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto bg-white text-gray-900 overflow-hidden shadow-none sm:shadow-lg border-0 sm:border-x border-gray-200 animate-fadeIn">
      {/* 1. Header Banner (Vibrant Atletico Red 360-degree LED board Style) */}
      {/*
        헤더 컨테이너 자체가 26/27 홈킷 스트라이프다.
        흰 줄 위에서는 흰 글씨가 사라지므로, 안의 요소들은 각자 남색/흰색 판을 깔고 올라간다
        (유니폼에 붙은 패치처럼). 하단 남색 라인은 셔츠 칼라.
      */}
      <div className="chat-header-kit text-white px-3 py-2.5 sm:px-4 sm:py-3.5 shrink-0 shadow-sm border-b-2 border-aleti-navy relative">

        <div className="flex items-center justify-between gap-2 sm:gap-3 relative z-10">
          {/* Back & Match Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={handleBack}
              className="kit-patch inline-flex items-center justify-center p-2.5 sm:p-3 rounded-xl transition shrink-0"
              aria-label="이전 화면으로"
              title="이전 화면으로"
            >
              <ArrowLeft size={22} className="sm:w-6 sm:h-6" />
            </button>

            <div className="flex flex-col min-w-0 items-start">
              {/* 줄무늬 위에 그냥 흰 글씨를 올리면 흰 줄 구간에서 사라진다 —
                  가슴 스폰서 블록처럼 남색 패치를 깔고 그 위에 얹는다 */}
              <h1 className="kit-patch max-w-full truncate rounded-lg px-2.5 py-1 text-xs font-black leading-tight tracking-tight sm:text-base md:text-lg">
                {isFreeRoom
                  ? '자유 채팅방'
                  : recentMatch
                    ? `${recentMatch.homeTeam} vs ${recentMatch.awayTeam}`
                    : '아틀레티코 마드리드 실시간 응원방'}
              </h1>
            </div>
          </div>

          {/* Online Counter */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Music/Chant Player Toggle */}
            <button
              type="button"
              onClick={toggleChant}
              className={`p-1.5 sm:p-2 rounded-xl transition flex items-center justify-center ${
                isPlayingChant
                  ? 'bg-[#ccff00] text-black border border-[#ccff00] font-black shadow-[0_0_8px_rgba(204,255,0,0.5)] animate-pulse'
                  : 'kit-patch'
              }`}
              title={isPlayingChant ? '응원가 끄기' : '응원가 켜기'}
            >
              {isPlayingChant ? (
                <Volume2 size={12} className="sm:w-3.5 sm:h-3.5" />
              ) : (
                <VolumeX size={12} className="sm:w-3.5 sm:h-3.5" />
              )}
            </button>

            {/* Online Badge */}
            <div className="kit-patch flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <Users size={12} className="sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="tabular-nums text-white">{onlineCount}<span className="hidden xs:inline">명</span></span>
            </div>
          </div>
        </div>
      </div>


      {/* 2. Messages List Feed (White Background with Metropolitano roof structural watermark) */}
      <div
        className="flex-1 min-h-0 relative isolate bg-white"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.96)),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none' stroke='rgba(191,9,33,0.035)' stroke-width='0.4'%3E%3Cpath d='M10,25 C30,10 70,10 90,25 C90,45 70,60 50,60 C30,60 10,45 10,25 Z'/%3E%3Cpath d='M15,28 C30,15 70,15 85,28 C85,42 70,55 50,55 C30,55 15,42 15,28 Z'/%3E%3Cpath d='M50,10 L50,60 M10,25 L50,55 M90,25 L50,55'/%3E%3Ccircle cx='50' cy='35' r='18' stroke='rgba(39,46,117,0.02)' stroke-width='0.3'/%3E%3Ctext x='50' y='80' font-family='sans-serif' font-weight='900' font-size='4' fill='rgba(39,46,117,0.04)' text-anchor='middle' letter-spacing='0.5'%3ENUNCA DEJES DE CREER%3C/text%3E%3C/svg%3E")
          `,
          backgroundSize: '320px 320px',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* House rules — ambient notice pinned behind the feed via negative z-index */}
        <div className="absolute top-0 inset-x-0 -z-10 px-4 sm:px-6 pt-3 sm:pt-4 text-center text-[11px] font-medium text-gray-300 pointer-events-none">
          혐오 표현·광고·계좌번호 등은 삼가주세요
        </div>

        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto p-4 sm:p-6 space-y-1 text-gray-900 custom-scrollbar-red relative"
        >
          {isLoading && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
              <Sparkles className="w-8 h-8 animate-spin text-aleti-red mb-2" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                채팅방에 연결 중입니다...
              </span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center text-gray-400">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-3 text-aleti-red">
                <MessageSquare size={24} />
              </div>
              <p className="text-sm font-bold text-gray-800">첫 번째 응원 메시지를 남겨보세요!</p>
              <p className="text-xs text-gray-500 mt-1">¡Aúpa Atleti! 열정적인 알레띠 팬들과 함께하세요.</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <ChatMessageItem key={index} msg={msg} myNickname={myNickname} />
            ))
          )}
        </div>

        {/* 방이 아직 안 열림 — 경기 채팅방은 킥오프 1시간 전부터 종료 3시간 후까지만 열린다 */}
        {!roomOpen && !isLoading && !errorNotice && (
          <div className="absolute bottom-2 inset-x-0 px-4 flex justify-center pointer-events-none">
            <div className="pointer-events-auto max-w-md w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold shadow-lg border bg-gray-50 border-gray-200 text-gray-700">
              <span className="shrink-0">⏳</span>
              <span className="flex-1 leading-snug">
                이 경기 채팅방은 킥오프 1시간 전에 열려요. 그동안은{' '}
                <Link href={`/chat/${FREE_ROOM_ID}`} className="underline text-aleti-red">
                  자유 채팅방
                </Link>
                에서 이야기 나눠요!
              </span>
            </div>
          </div>
        )}

        {/* 연결 끊김 / 정책 위반 안내 — 예전에는 실패가 전부 조용히 무시됐다 */}
        {(!isConnected || errorNotice) && !isLoading && (
          <div className="absolute bottom-2 inset-x-0 px-4 flex justify-center pointer-events-none">
            <div
              role="status"
              className={`pointer-events-auto max-w-md w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold shadow-lg border ${
                errorNotice
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <span className="shrink-0">{errorNotice ? '⚠️' : '🔌'}</span>
              <span className="flex-1 leading-snug">
                {errorNotice || '채팅 서버와 연결이 끊겼어요. 다시 연결하는 중...'}
              </span>
              {errorNotice && (
                <button
                  type="button"
                  onClick={() => setErrorNotice('')}
                  className="shrink-0 px-1.5 text-red-500 hover:text-red-700"
                  aria-label="알림 닫기"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/*
          El ramo de Margarita — since 1996 a bouquet of rojiblanco carnations sits by the
          corner flag left of the south goal at every Metropolitano home match.
          Ambient only: sits outside the scroll container so it stays pinned to the corner.
        */}
        <div
          className="absolute bottom-0 left-0 -z-10 pointer-events-none select-none opacity-40"
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
      </div>


      {/* 3. Quick Chant Buttons */}
      <div className="px-3 py-2 bg-aleti-navy border-t border-white/15 overflow-x-auto whitespace-nowrap shrink-0 flex items-center gap-1.5 no-scrollbar">
        <span className="text-[10px] font-black uppercase text-white/75 flex items-center gap-1 mr-1 shrink-0">
          {/* 남색 배경에서 aleti-red는 대비가 낮아 아이콘만 밝게 둔다 */}
          <Flame size={12} className="text-white/75" />
          빠른 응원:
        </span>
        {QUICK_CHANTS.map((chant) => (
          <button
            key={chant}
            type="button"
            onClick={() => handleSendMessage(chant)}
            className={`rounded-lg bg-white hover:bg-aleti-red hover:text-white font-bold text-gray-700 border border-white/25 shadow-2xs transition active:scale-95 shrink-0 ${
              isEmojiOnly(chant) ? 'px-2 py-0.5 text-base leading-6' : 'px-2.5 py-1 text-xs'
            }`}
          >
            {chant}
          </button>
        ))}
      </div>

      {/* 4. Bottom Input Bar */}
      <div className="p-3 sm:p-4 bg-aleti-navy border-t border-white/15 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder={
                myNickname
                  ? `${myNickname}님, 메시지를 입력하세요...`
                  : '닉네임을 먼저 설정해 주세요'
              }
              maxLength={200}
              /* iOS는 16px 미만 입력창에 포커스가 가면 화면을 확대한다.
                 모바일에서만 16px(text-base)로 올려 확대를 막고, 데스크톱은 기존 크기를 유지한다 */
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-xl text-base sm:text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-aleti-red focus:ring-1 focus:ring-aleti-red transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-400">
              {inputContent.length}/200
            </span>
          </div>

          <button
            type="submit"
            disabled={isSending || !inputContent.trim()}
            className="h-11 px-5 rounded-xl bg-aleti-red hover:bg-[#a0071b] text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0"
          >
            <Send size={15} />
            <span className="hidden sm:inline">전송</span>
          </button>
        </form>

        {/* 언제든 이름을 바꿀 수 있는 통로. 이게 없으면 저장된 닉네임이 막혔을 때
            사용자가 스스로 빠져나올 방법이 없다 */}
        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={openNicknameModal}
            className="text-[10px] font-bold text-white/45 underline underline-offset-2 transition hover:text-white"
          >
            닉네임 변경
          </button>
        </div>
      </div>

      {/* 5. Nickname Setup Modal */}
      <NicknameModal
        isOpen={isNicknameModalOpen}
        matchId={matchId}
        currentNickname={myNickname}
        initialError={nicknameError}
        onSuccess={handleNicknameSuccess}
        /* 이름을 아직 안 정했어도 닫을 수 있다 — 읽기만 하러 온 사람도 있다 */
        onClose={closeNicknameModal}
      />
    </div>
  );
}
