'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client as StompClient } from '@stomp/stompjs';
import { roomInfo, getRecentMatch } from '@/client/sdk.gen';
import type { ChatMessage, RecentMatch } from '@/client/types.gen';
import ChatMessageItem from './ChatMessageItem';
import NicknameModal from './NicknameModal';
import {
  Users,
  Send,
  Sparkles,
  Flame,
  Radio,
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

// 서버가 방마다 최근 100건을 24시간 보관한다(redis-design 6.2). 화면도 같은 상한을 쓴다.
const MAX_HISTORY = 100;

// 접속자 수는 /topic/presence/{matchId}로 즉시 밀려온다.
// 이 폴링은 어긋난 값을 되맞추는 안전망일 뿐이라 느려도 된다
// (비정상 종료 시 카운트가 드리프트할 수 있음 — redis-design 6.7).
const ONLINE_POLL_MS = 30_000;

// 라우트 파라미터가 없을 때 쓰는 placeholder. 실제 방 키가 아니므로
// getRecentMatch()로 진짜 matchId를 받기 전까지는 접속하지 않는다.
const PENDING_MATCH_ID = 'recent';

// 상시 개방 자유 채팅방의 방 키 — 백엔드 ChatService.FREE_ROOM_ID와 같은 값.
// 경기 방 키는 FotMob 숫자 ID라 충돌하지 않는다.
const FREE_ROOM_ID = 'free';

const messageKey = (m: ChatMessage) => `${m.sentAt ?? ''}|${m.ipHash ?? ''}|${m.nickname}|${m.content}`;

// Trailing slashes are stripped so the paths appended below never produce '//'.
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.atleti.kr').replace(
  /\/+$/,
  ''
);

export default function ChatContainer({ initialMatchId = 'recent' }: ChatContainerProps) {
  const [matchId, setMatchId] = useState<string>(initialMatchId);
  const [recentMatch, setRecentMatch] = useState<RecentMatch | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Nickname State
  const [myNickname, setMyNickname] = useState<string>('');
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState<boolean>(false);

  // Input State
  const [inputContent, setInputContent] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stompRef = useRef<StompClient | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string>('');
  const [roomOpen, setRoomOpen] = useState<boolean>(true);

  // 실제 방 키가 정해졌는지 — placeholder 상태에서는 접속/조회하지 않는다
  const roomReady = matchId !== PENDING_MATCH_ID && matchId.length > 0;
  const isFreeRoom = matchId === FREE_ROOM_ID;

  // Audio State & Reference
  const [isPlayingChant, setIsPlayingChant] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/atletiChant.mp3');
      audio.loop = true;
      audioRef.current = audio;

      const handlePlay = () => setIsPlayingChant(true);
      const handlePause = () => setIsPlayingChant(false);

      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);

      return () => {
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.pause();
        audioRef.current = null;
      };
    }
  }, []);

  const toggleChant = () => {
    if (!audioRef.current) return;
    if (isPlayingChant) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.error('Failed to play chant:', err);
      });
    }
  };

  // 메시지는 서버(Redis)가 보관한다. 브라우저에 따로 저장하지 않는다 —
  // 저장해두면 서버에 도달하지 못한 내 메시지가 보내진 것처럼 남아,
  // "각자 자기 메시지만 보이는" 상태를 정상처럼 보이게 만든다.
  const appendMessages = useCallback((incoming: ChatMessage[]) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const seen = new Set(prev.map(messageKey));
      const fresh = incoming.filter((m) => !seen.has(messageKey(m)));
      if (fresh.length === 0) return prev;
      return [...prev, ...fresh].slice(-MAX_HISTORY);
    });
  }, []);

  // Initialize nickname.
  // 방 키가 정해지기 전(placeholder)에 모달을 열면 존재하지 않는 방에 닉네임을 선점하게 되므로 기다린다.
  useEffect(() => {
    if (typeof window === 'undefined' || !roomReady) return;
    const savedNick =
      localStorage.getItem(`atleti_chat_nickname_${matchId}`) ||
      localStorage.getItem('atleti_chat_nickname');
    if (savedNick) {
      setMyNickname(savedNick);
      setIsNicknameModalOpen(false);
    } else {
      setIsNicknameModalOpen(true);
    }
  }, [matchId, roomReady]);

  // 예전 버전이 브라우저에 쌓아둔 메시지 기록 정리.
  // 남겨두면 서버에 없는 메시지가 계속 보여 "나만 있는 방"처럼 느껴진다. (닉네임 키는 유지)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('atleti_chat_global_messages_v2');
      Object.keys(localStorage)
        .filter((k) => k.startsWith('atleti_chat_history_'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // 접근 불가 환경(사파리 프라이빗 등)에서는 무시
    }
  }, []);

  // 헤더 배너에 쓸 경기 정보. 방 키가 placeholder면 최근 경기 방으로 확정한다.
  useEffect(() => {
    async function fetchMatch() {
      try {
        const res = await getRecentMatch().catch(() => null);
        if (!res?.data) return;
        setRecentMatch(res.data);
        if (initialMatchId === PENDING_MATCH_ID && res.data.matchId) {
          setMatchId(res.data.matchId);
        }
      } catch (err) {
        console.error('Failed to fetch match info:', err);
      }
    }
    fetchMatch();
  }, [initialMatchId]);

  // 방 정보 조회 — 입장 시 최근 메시지 로딩 + 접속자 수 갱신.
  // 접속자 수는 서버에서 밀어주는 채널이 없어 이 폴링이 유일한 갱신 경로다.
  const fetchRoomData = useCallback(async () => {
    if (!roomReady) return;
    try {
      const res = await roomInfo({ path: { matchId } }).catch(() => null);
      if (!res?.data) return;

      // 0명이면 0으로 표시한다. 예전에는 `|| 1` 때문에 항상 최소 1명으로 보여서
      // 아무도 접속 못 하고 있는 상태가 "나 혼자 있는 방"처럼 보였다.
      setOnlineCount(res.data.onlineCount ?? 0);
      setRoomOpen(res.data.open ?? true);
      if (Array.isArray(res.data.messages)) appendMessages(res.data.messages);
    } catch (err) {
      console.error('Failed to fetch room info:', err);
    } finally {
      setIsLoading(false);
    }
  }, [matchId, roomReady, appendMessages]);

  useEffect(() => {
    if (!roomReady) return;
    fetchRoomData();
    const interval = setInterval(fetchRoomData, ONLINE_POLL_MS);
    return () => clearInterval(interval);
  }, [fetchRoomData, roomReady]);

  // 백엔드 STOMP 연결 (WebSocketConfig.kt: 엔드포인트 /ws, SockJS 사용).
  // 목적지 규약: 구독 /topic/chat/{matchId}, 전송 /app/chat/{matchId},
  // 개인 에러 회신 /user/queue/errors.
  useEffect(() => {
    if (typeof window === 'undefined' || !roomReady) return;

    const client = new StompClient({
      // 백엔드가 .withSockJS()로 등록했으므로 raw WebSocket이 아니라 SockJS로 붙어야 한다
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setIsConnected(true);
        setErrorNotice('');

        // 접속자 수 먼저 구독한다 — 아래 방 구독으로 발생하는 내 입장 이벤트를 놓치지 않으려고.
        // (백엔드가 /topic/chat/ 아래 구독을 전부 "입장"으로 세므로 목적지 prefix가 다르다)
        client.subscribe(`/topic/presence/${matchId}`, (frame) => {
          try {
            const { onlineCount } = JSON.parse(frame.body);
            if (typeof onlineCount === 'number') setOnlineCount(onlineCount);
          } catch {
            // 파싱 불가 프레임은 무시
          }
        });

        client.subscribe(`/topic/chat/${matchId}`, (frame) => {
          try {
            appendMessages([JSON.parse(frame.body) as ChatMessage]);
          } catch {
            // 파싱 불가 프레임은 무시
          }
        });

        // 정책 위반(닫힌 방·도배·금칙어·닉네임 중복)은 방 전체가 아니라 나에게만 온다.
        // 예전에는 이 채널을 구독하지 않아 거절 사유가 전혀 보이지 않았다.
        client.subscribe('/user/queue/errors', (frame) => {
          try {
            setErrorNotice(JSON.parse(frame.body).error ?? '메시지를 보낼 수 없습니다.');
          } catch {
            setErrorNotice('메시지를 보낼 수 없습니다.');
          }
        });

        // 구독 직후 한 번 더 맞춰준다 — 연결 전에 올라온 메시지와 접속자 수 반영
        fetchRoomData();
      },
      onDisconnect: () => setIsConnected(false),
      onWebSocketClose: () => setIsConnected(false),
      onStompError: (frame) => {
        setIsConnected(false);
        console.error('STOMP error:', frame.headers['message'], frame.body);
      },
    });

    client.activate();
    stompRef.current = client;

    return () => {
      stompRef.current = null;
      setIsConnected(false);
      client.deactivate();
    };
    // fetchRoomData는 matchId에만 의존하므로 재연결 루프를 만들지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, roomReady, appendMessages]);

  // Isolated scroll within inner message container only
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle Nickname Saved
  const handleNicknameSuccess = (newNickname: string) => {
    setMyNickname(newNickname);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`atleti_chat_nickname_${matchId}`, newNickname);
      localStorage.setItem('atleti_chat_nickname', newNickname);
    }
    setIsNicknameModalOpen(false);
  };

  /**
   * 전송은 STOMP 한 경로뿐이다 (ChatController.kt: @MessageMapping("/chat/{matchId}")).
   * 서버가 검증·저장한 뒤 브로드캐스트한 것을 구독으로 되받아 화면에 그린다.
   * 낙관적 업데이트를 하지 않는 이유: 서버가 거절해도(도배·금칙어·닫힌 방)
   * 화면에는 보내진 것처럼 남아 예전처럼 "나만 보이는 메시지"가 생긴다.
   */
  const handleSendMessage = (contentToSend?: string) => {
    const text = (contentToSend || inputContent).trim();
    if (!text) return;

    if (!myNickname) {
      setIsNicknameModalOpen(true);
      return;
    }

    const client = stompRef.current;
    if (!client?.connected) {
      setErrorNotice('채팅 서버에 연결되어 있지 않아요. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsSending(true);
    setErrorNotice('');
    try {
      // 서버는 목적지의 matchId와 본문의 nickname/content만 사용한다
      client.publish({
        destination: `/app/chat/${matchId}`,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nickname: myNickname, content: text }),
      });
      if (!contentToSend) setInputContent('');
    } catch (err) {
      console.error('Failed to publish message:', err);
      setErrorNotice('메시지 전송에 실패했어요.');
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickChant = (chant: string) => {
    handleSendMessage(chant);
  };

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
            <Link
              href="/"
              className="kit-patch p-1.5 sm:p-2 rounded-xl transition shrink-0"
              title="홈으로 돌아가기"
            >
              <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
            </Link>

            <div className="flex flex-col min-w-0 items-start">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white text-aleti-red text-[9px] sm:text-[10px] font-black shrink-0 shadow-sm">
                  <Radio size={8} className="animate-pulse sm:w-2.5 sm:h-2.5 text-aleti-red" />
                  {isFreeRoom ? '자유 채팅' : '경기 채팅'}
                </span>
              </div>
              {/* 줄무늬 위에 그냥 흰 글씨를 올리면 흰 줄 구간에서 사라진다 —
                  가슴 스폰서 블록처럼 남색 패치를 깔고 그 위에 얹는다 */}
              <h1 className="kit-patch max-w-full truncate rounded-lg px-2.5 py-1 text-xs font-black leading-tight tracking-tight sm:text-base md:text-lg mt-0.5 sm:mt-1">
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
            onClick={() => handleQuickChant(chant)}
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
      </div>

      {/* 5. Nickname Setup Modal */}
      <NicknameModal
        isOpen={isNicknameModalOpen}
        matchId={matchId}
        currentNickname={myNickname}
        onSuccess={handleNicknameSuccess}
        onClose={myNickname ? () => setIsNicknameModalOpen(false) : undefined}
      />
    </div>
  );
}
