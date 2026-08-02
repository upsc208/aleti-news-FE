'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const GLOBAL_STORAGE_KEY = 'atleti_chat_global_messages_v2';
const MAX_HISTORY = 99;

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
  const socketRef = useRef<WebSocket | null>(null);

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

  // Helper to load all stored messages (unified global key + match key)
  const loadLocalHistory = useCallback((mId: string): ChatMessage[] => {
    if (typeof window === 'undefined') return [];
    try {
      const globalRaw = localStorage.getItem(GLOBAL_STORAGE_KEY);
      const matchRaw = localStorage.getItem(`atleti_chat_history_${mId}`);
      
      let list: ChatMessage[] = [];
      if (globalRaw) {
        const parsed = JSON.parse(globalRaw);
        if (Array.isArray(parsed)) list = [...list, ...parsed];
      }
      if (matchRaw) {
        const parsed = JSON.parse(matchRaw);
        if (Array.isArray(parsed)) list = [...list, ...parsed];
      }

      // Deduplicate
      const unique: ChatMessage[] = [];
      list.forEach((item) => {
        const isDup = unique.some(
          (u) => u.nickname === item.nickname && u.content === item.content && u.sentAt === item.sentAt
        );
        if (!isDup) unique.push(item);
      });

      return unique.slice(-MAX_HISTORY);
    } catch (e) {
      console.error('Failed to load local chat history:', e);
    }
    return [];
  }, []);

  // Helper to save chat history globally & per-match
  const saveLocalHistory = useCallback((mId: string, newMsgs: ChatMessage[]) => {
    if (typeof window === 'undefined') return;
    try {
      const trimmed = newMsgs.slice(-MAX_HISTORY);
      localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(trimmed));
      localStorage.setItem(`atleti_chat_history_${mId}`, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to save local chat history:', e);
    }
  }, []);

  // Initialize nickname and local message history
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNick =
        localStorage.getItem(`atleti_chat_nickname_${matchId}`) ||
        localStorage.getItem('atleti_chat_nickname');
      if (savedNick) {
        setMyNickname(savedNick);
        setIsNicknameModalOpen(false);
      } else {
        setIsNicknameModalOpen(true);
      }

      // Load local history immediately so messages persist on re-entry!
      const initialMsgs = loadLocalHistory(matchId);
      if (initialMsgs.length > 0) {
        setMessages(initialMsgs);
        setIsLoading(false);
      }
    }
  }, [matchId, loadLocalHistory]);

  // Fetch recent match details for banner
  useEffect(() => {
    async function fetchMatch() {
      try {
        const res = await getRecentMatch();
        if (res.data) {
          setRecentMatch(res.data);
          if (initialMatchId === 'recent' && res.data.matchId) {
            setMatchId(res.data.matchId);
          }
        }
      } catch (err) {
        console.error('Failed to fetch recent match info:', err);
      }
    }
    fetchMatch();
  }, [initialMatchId]);

  // Helper to merge server messages with local state smoothly.
  // Server history is authoritative; local messages the server has not echoed back
  // yet are kept at the tail as still-pending.
  const mergeServerMessages = useCallback((currentMsgs: ChatMessage[], serverMsgs: ChatMessage[]) => {
    if (!serverMsgs || serverMsgs.length === 0) {
      return currentMsgs;
    }

    // Count the copies the server already holds: each server copy accounts for exactly
    // one local message. A plain "does the server have this text?" check would collapse
    // repeats — sending 👍 twice would make the second one vanish. sentAt can't be used
    // as the key because the server may stamp its own value.
    const messageKey = (msg: ChatMessage) => JSON.stringify([msg.nickname, msg.content]);
    const unmatchedOnServer = new Map<string, number>();
    serverMsgs.forEach((srv) => {
      const key = messageKey(srv);
      unmatchedOnServer.set(key, (unmatchedOnServer.get(key) || 0) + 1);
    });

    const merged = [...serverMsgs];
    currentMsgs.forEach((local) => {
      const key = messageKey(local);
      const remaining = unmatchedOnServer.get(key) || 0;
      if (remaining > 0) {
        unmatchedOnServer.set(key, remaining - 1);
      } else {
        merged.push(local);
      }
    });

    return merged.slice(-MAX_HISTORY);
  }, []);

  // Fetch room info from backend (queries both current matchId and 'recent' fallback)
  const fetchRoomData = useCallback(
    async (showLoader = false) => {
      if (showLoader && messages.length === 0) setIsLoading(true);
      try {
        // Try current matchId
        let res = await roomInfo({
          path: {
            matchId: matchId || 'recent',
          },
        }).catch(() => null);

        // Fallback to 'recent' if specific ID returns no messages
        if ((!res || !res.data || !res.data.messages || res.data.messages.length === 0) && matchId !== 'recent') {
          const fallbackRes = await roomInfo({
            path: {
              matchId: 'recent',
            },
          }).catch(() => null);
          if (fallbackRes && fallbackRes.data && fallbackRes.data.messages && fallbackRes.data.messages.length > 0) {
            res = fallbackRes;
          }
        }

        if (res && res.data) {
          setOnlineCount(res.data.onlineCount || 1);
          if (res.data.messages && Array.isArray(res.data.messages)) {
            const serverMsgs = res.data.messages;
            setMessages((prev) => {
              const updated = mergeServerMessages(prev, serverMsgs);
              saveLocalHistory(matchId, updated);
              return updated;
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch room info:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [matchId, messages.length, mergeServerMessages, saveLocalHistory]
  );

  // Polling every 2.5 seconds
  useEffect(() => {
    fetchRoomData(messages.length === 0);

    const interval = setInterval(() => {
      fetchRoomData(false);
    }, 2500);

    return () => clearInterval(interval);
  }, [fetchRoomData, messages.length]);

  // Connect STOMP WebSocket for real-time messaging with Spring Boot backend
  useEffect(() => {
    let ws: WebSocket | null = null;

    const connectWebSocket = () => {
      try {
        // Derived from the API URL, not the page URL: in local dev the page is http
        // while the API is https, and ws:// against a TLS endpoint fails to connect.
        const protocol = API_BASE_URL.startsWith('https:') ? 'wss:' : 'ws:';
        const host = API_BASE_URL.replace(/^https?:\/\//, '');

        const wsUrl = `${protocol}//${host}/ws-chat`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          ws?.send('CONNECT\naccept-version:1.2,1.1,1.0\nheart-beat:10000,10000\n\n\0');
        };

        ws.onmessage = (event) => {
          const data = event.data;
          if (typeof data === 'string') {
            if (data.includes('CONNECTED')) {
              ws?.send(`SUBSCRIBE\nid:sub-0\ndestination:/sub/chat/room/${matchId}\n\n\0`);
              ws?.send(`SUBSCRIBE\nid:sub-1\ndestination:/topic/chat/room/${matchId}\n\n\0`);
              ws?.send(`SUBSCRIBE\nid:sub-2\ndestination:/sub/chat/room/recent\n\n\0`);
              ws?.send(`SUBSCRIBE\nid:sub-3\ndestination:/topic/chat/room/recent\n\n\0`);
            } else if (data.includes('MESSAGE')) {
              const bodyIdx = data.indexOf('\n\n');
              if (bodyIdx !== -1) {
                const jsonStr = data.substring(bodyIdx + 2, data.length - 1).trim();
                try {
                  const parsedMsg: ChatMessage = JSON.parse(jsonStr);
                  setMessages((prev) => {
                    const updated = mergeServerMessages(prev, [parsedMsg]);
                    saveLocalHistory(matchId, updated);
                    return updated;
                  });
                } catch (e) {
                  // Ignore JSON parse errors
                }
              }
            }
          }
        };

        socketRef.current = ws;
      } catch (e) {
        // Fail quietly to polling if WebSocket fails
      }
    };

    if (typeof window !== 'undefined') {
      connectWebSocket();
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [matchId, mergeServerMessages, saveLocalHistory]);

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

    // Append welcome system message
    const systemNotice: ChatMessage = {
      matchId,
      nickname: 'SYSTEM',
      content: `🔴⚪ ${newNickname} 님이 라이브 응원방에 입장하셨습니다!`,
      sentAt: new Date().toISOString(),
    };
    setMessages((prev) => {
      const updated = [...prev, systemNotice];
      saveLocalHistory(matchId, updated);
      return updated;
    });
  };

  // Send Message logic: Transmit to Backend STOMP & Backend HTTP Endpoints
  const handleSendMessage = async (contentToSend?: string) => {
    const text = (contentToSend || inputContent).trim();
    if (!text) return;

    if (!myNickname) {
      setIsNicknameModalOpen(true);
      return;
    }

    setIsSending(true);

    const messagePayload: ChatMessage = {
      matchId,
      nickname: myNickname,
      content: text,
      sentAt: new Date().toISOString(),
    };

    // 1. Optimistic Local Update & Instant Persistence to localStorage!
    setMessages((prev) => {
      const updated = [...prev, messagePayload];
      saveLocalHistory(matchId, updated);
      return updated;
    });

    if (!contentToSend) setInputContent('');

    // 2. Publish over WebSocket STOMP
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        const frame1 = `SEND\ndestination:/pub/chat/message\ncontent-type:application/json\n\n${JSON.stringify(
          messagePayload
        )}\0`;
        const frame2 = `SEND\ndestination:/app/chat/message\ncontent-type:application/json\n\n${JSON.stringify(
          messagePayload
        )}\0`;
        socketRef.current.send(frame1);
        socketRef.current.send(frame2);
      } catch (e) {
        console.error('Failed to send WebSocket message:', e);
      }
    }

    // 3. Send HTTP POST to backend endpoints so backend stores it in room history
    try {
      const apiHost = API_BASE_URL;
      const body = JSON.stringify({
        matchId,
        nickname: myNickname,
        content: text,
      });

      await Promise.allSettled([
        fetch(`${apiHost}/api/chat/${matchId}/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        }),
        fetch(`${apiHost}/api/chat/recent/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        }),
        fetch(`${apiHost}/api/chat/${matchId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        }),
        fetch(`${apiHost}/api/chat/recent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        }),
        fetch(`${apiHost}/api/chat/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        }),
      ]);

      // Refetch backend's recent messages
      setTimeout(() => {
        fetchRoomData(false);
      }, 500);
    } catch (err) {
      console.error('HTTP send message error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickChant = (chant: string) => {
    handleSendMessage(chant);
  };

  return (
    <div className="flex flex-col h-dvh w-full max-w-4xl mx-auto bg-white text-gray-900 overflow-hidden shadow-none sm:shadow-lg border-0 sm:border-x border-gray-200 animate-fadeIn">
      {/* 1. Header Banner (Vibrant Atletico Red 360-degree LED board Style) */}
      <div className="bg-gradient-to-r from-aleti-red to-[#a6081c] text-white px-3 py-2.5 sm:px-4 sm:py-3.5 shrink-0 shadow-sm border-b-2 border-red-800 relative overflow-hidden">
        {/* Metropolitano LED Top Neon line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-white via-red-200 to-white opacity-40" />
        
        {/* Faint LED stadium grid overlay for 360-degree board feel */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

        <div className="flex items-center justify-between gap-2 sm:gap-3 relative z-10">
          {/* Back & Match Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/"
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/25 transition shrink-0"
              title="홈으로 돌아가기"
            >
              <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
            </Link>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white text-aleti-red text-[9px] sm:text-[10px] font-black shrink-0">
                  <Radio size={8} className="animate-pulse sm:w-2.5 sm:h-2.5 text-aleti-red" />
                  라이브 채팅
                </span>
              </div>
              <h1 className="text-xs sm:text-base md:text-lg font-black text-white truncate leading-tight font-sans tracking-tight mt-0.5 sm:mt-1">
                {recentMatch
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
              className={`p-1.5 sm:p-2 rounded-xl border transition flex items-center justify-center ${
                isPlayingChant
                  ? 'bg-[#ccff00] text-black border-[#ccff00] font-black shadow-[0_0_8px_rgba(204,255,0,0.5)] animate-pulse'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/25'
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
            <div className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-black/25 text-white text-[10px] sm:text-xs font-bold border border-white/20 shadow-inner">
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
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 overflow-x-auto whitespace-nowrap shrink-0 flex items-center gap-1.5 no-scrollbar">
        <span className="text-[10px] font-black uppercase text-gray-500 flex items-center gap-1 mr-1 shrink-0">
          <Flame size={12} className="text-aleti-red" />
          빠른 응원:
        </span>
        {QUICK_CHANTS.map((chant) => (
          <button
            key={chant}
            type="button"
            onClick={() => handleQuickChant(chant)}
            className={`rounded-lg bg-white hover:bg-aleti-red hover:text-white font-bold text-gray-700 border border-gray-300 shadow-2xs transition active:scale-95 shrink-0 ${
              isEmojiOnly(chant) ? 'px-2 py-0.5 text-base leading-6' : 'px-2.5 py-1 text-xs'
            }`}
          >
            {chant}
          </button>
        ))}
      </div>

      {/* 4. Bottom Input Bar */}
      <div className="p-3 sm:p-4 bg-white border-t border-gray-200 shrink-0">
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
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-aleti-red focus:ring-1 focus:ring-aleti-red transition"
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
