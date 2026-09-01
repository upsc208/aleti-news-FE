'use client';

/**
 * 채팅방의 동작 전부 — 접속, 닉네임, 메시지 수신/전송, 응원가 재생.
 *
 * 자유 채팅방(ChatContainer)과 경기 채팅방(StadiumChatContainer)은
 * 화면이 완전히 다르지만 동작은 같다. 화면을 두 벌로 나누면서 이 로직까지
 * 복사하면 한쪽만 고쳐지는 버그가 반드시 생기므로 여기 한 곳에 모아둔다.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client as StompClient } from '@stomp/stompjs';
import { roomInfo, getRecentMatch, reserveNickname } from '@/client/sdk.gen';
import type { ChatMessage, LiveMatchState, RecentMatch } from '@/client/types.gen';
import { useRouter } from 'next/navigation';
import {
  CLIENT_ID_STOMP_HEADER,
  NICKNAME_FALLBACK_KEY,
  NICKNAME_TAKEN,
  chatClientHeaders,
  getChatClientId,
  nicknameKeyFor,
} from './chatIdentity';

// 서버가 방마다 최근 100건을 24시간 보관한다(redis-design 6.2). 화면도 같은 상한을 쓴다.
const MAX_HISTORY = 100;

// 접속자 수는 /topic/presence/{matchId}로 즉시 밀려온다.
// 이 폴링은 어긋난 값을 되맞추는 안전망일 뿐이라 느려도 된다
// (비정상 종료 시 카운트가 드리프트할 수 있음 — redis-design 6.7).
const ONLINE_POLL_MS = 30_000;

/**
 * 연결이 끊긴 것을 알리기 전에 참는 시간.
 *
 * 이 방들은 다른 앱(중계)과 번갈아 보는 화면이다. 앱을 오가면 소켓이 끊겼다 붙는 일이
 * 잦은데 대부분 이 안에 다시 붙으므로, 끊기자마자 띄우면 정상적인 왕복이 사고로 보인다.
 */
const DISCONNECT_GRACE_MS = 1500;

// 라우트 파라미터가 없을 때 쓰는 placeholder. 실제 방 키가 아니므로
// getRecentMatch()로 진짜 matchId를 받기 전까지는 접속하지 않는다.
const PENDING_MATCH_ID = 'recent';

// 상시 개방 자유 채팅방의 방 키 — 백엔드 ChatService.FREE_ROOM_ID와 같은 값.
// 경기 방 키는 FotMob 숫자 ID라 충돌하지 않는다.
export const FREE_ROOM_ID = 'free';

const messageKey = (m: ChatMessage) =>
  `${m.sentAt ?? ''}|${m.ipHash ?? ''}|${m.nickname}|${m.content}`;

/**
 * 사람이 친 말만 채팅 목록에 남긴다.
 *
 * 서버는 골 알림('매치봇')도 같은 채널·같은 목록에 실어 보낸다. 그것까지 말풍선으로
 * 그리면 골이 몰아칠 때 채팅창이 봇 메시지로 덮인다. 골은 LED 보드가 맡으므로
 * 여기서 걸러낸다 — 필요한 정보는 이미 [live] 스냅샷으로 따로 받는다.
 *
 * `type`이 없는 메시지는 이 필드가 생기기 전에 저장된 옛 기록이라 사람 것으로 본다.
 */
const isHumanMessage = (m: ChatMessage) => !m.type || m.type === 'USER';

/** 서버가 거절 사유와 함께 내려주는 {error, code}를 꺼낸다 (ChatController.kt) */
const readRejection = (body: unknown): { message: string; code: string } => {
  const obj = (body ?? {}) as { error?: unknown; code?: unknown };
  return {
    message: typeof obj.error === 'string' ? obj.error : '',
    code: typeof obj.code === 'string' ? obj.code : '',
  };
};

// Trailing slashes are stripped so the paths appended below never produce '//'.
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.atleti.kr').replace(
  /\/+$/,
  ''
);

export function useChatRoom(initialMatchId: string) {
  const router = useRouter();
  const [matchId, setMatchId] = useState<string>(initialMatchId);
  const [recentMatch, setRecentMatch] = useState<RecentMatch | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  /**
   * 라이브 스코어 스냅샷 — LED 보드가 그리는 값 (백엔드 live-match-feed-design 6장).
   * 골이 들어올 때마다, 그리고 입장·재접속 때마다 **통째로 교체**된다.
   * 누적하지 않으므로 VAR 취소로 골이 사라져도 그대로 따라간다.
   */
  const [live, setLive] = useState<LiveMatchState | null>(null);
  /**
   * [live]를 **한 번이라도 받아봤는가.**
   *
   * live가 null인 데는 두 가지 뜻이 섞여 있다 — "아직 안 왔다"와 "이 방엔 라이브가 없다"
   * (자유 채팅방이거나 경기 매핑 전). 둘을 구분 못 하면 보드가 아직 안 온 것을 없는 것으로
   * 보고 지난 경기 정보로 채워, 입장할 때마다 엉뚱한 상대가 잠깐 떴다 바뀐다.
   */
  const [liveLoaded, setLiveLoaded] = useState<boolean>(false);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Nickname State
  const [myNickname, setMyNickname] = useState<string>('');
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState<boolean>(false);
  // 저장된 닉네임이 거절돼 모달이 열린 경우 그 사유를 모달 안에 그대로 보여준다
  const [nicknameError, setNicknameError] = useState<string>('');

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

  /**
   * 사용자가 직접 끈 적이 있는지.
   *
   * 승리 자동 재생이 이걸 본다 — 조용히 보겠다고 스피커를 끈 사람에게
   * 경기가 끝나는 순간 응원가를 다시 트는 건 켜주는 게 아니라 들이미는 것이다.
   */
  const chantMutedByUser = useRef(false);

  const toggleChant = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlayingChant) {
      chantMutedByUser.current = true;
      audioRef.current.pause();
    } else {
      chantMutedByUser.current = false;
      audioRef.current.play().catch((err) => {
        console.error('Failed to play chant:', err);
      });
    }
  }, [isPlayingChant]);

  /**
   * 응원가를 켠다 — 끄기는 없다. 승리처럼 방이 알아서 트는 자리에서 쓴다.
   *
   * 두 가지를 존중한다. 직접 끈 사람에게는 다시 틀지 않고(chantMutedByUser),
   * 이미 흐르고 있으면 건드리지 않는다.
   *
   * 브라우저가 막을 수 있다. 자동 재생은 문서를 한 번이라도 클릭한 뒤에만 허용되는데,
   * 방에 들어와 아무것도 누르지 않고 보고만 있던 사람이 여기 걸린다. 그때는 조용히
   * 실패하고 헤더의 스피커 버튼이 꺼진 채로 남는다 — 눌러서 켜면 된다.
   */
  const playChant = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || chantMutedByUser.current || !audio.paused) return;

    audio.play().catch((err) => {
      console.warn('Chant autoplay blocked:', err);
    });
  }, []);

  // 메시지는 서버(Redis)가 보관한다. 브라우저에 따로 저장하지 않는다 —
  // 저장해두면 서버에 도달하지 못한 내 메시지가 보내진 것처럼 남아,
  // "각자 자기 메시지만 보이는" 상태를 정상처럼 보이게 만든다.
  const appendMessages = useCallback((incoming: ChatMessage[]) => {
    const human = incoming.filter(isHumanMessage);
    if (human.length === 0) return;
    setMessages((prev) => {
      const seen = new Set(prev.map(messageKey));
      const fresh = human.filter((m) => !seen.has(messageKey(m)));
      if (fresh.length === 0) return prev;
      return [...prev, ...fresh].slice(-MAX_HISTORY);
    });
  }, []);

  // Initialize nickname.
  // 방 키가 정해지기 전(placeholder)에 모달을 열면 존재하지 않는 방에 닉네임을 선점하게 되므로 기다린다.
  //
  // 저장해둔 닉네임을 그대로 믿지 않고 서버에 한 번 물어본다(선점 API는 주인이 다시 불러도 통과).
  // 예전에는 저장된 이름이 있으면 모달을 건너뛰고 바로 채팅을 허용했는데,
  // 그 이름이 이미 남에게 넘어갔거나 잠긴 경우 전송할 때마다 거절만 당하고
  // 이름을 바꿀 방법이 없어 채팅이 영영 막혔다.
  useEffect(() => {
    if (typeof window === 'undefined' || !roomReady) return;

    const savedNick =
      localStorage.getItem(nicknameKeyFor(matchId)) || localStorage.getItem(NICKNAME_FALLBACK_KEY);
    if (!savedNick) {
      setIsNicknameModalOpen(true);
      return;
    }

    let cancelled = false;
    // 확인이 끝나기 전까지도 이름은 보여준다 — 서버 응답을 기다리는 동안
    // 입력창이 "닉네임을 먼저 설정해 주세요"로 깜빡이지 않도록.
    setMyNickname(savedNick);
    setIsNicknameModalOpen(false);

    (async () => {
      const res = await reserveNickname({
        path: { matchId },
        body: { nickname: savedNick },
        headers: chatClientHeaders(),
      }).catch(() => null);
      if (cancelled || !res) return;              // 네트워크 장애면 그냥 두고 전송 시점에 판단
      if (res.response?.ok) return;

      const { message, code } = readRejection(res.error);
      // 닉네임이 막힌 경우에만 다시 물어본다. 방이 아직 안 열린 것 같은 다른 사유로
      // 모달을 띄우면 이름을 바꿔도 소용이 없어 더 헷갈린다.
      if (code !== NICKNAME_TAKEN) return;
      setMyNickname('');
      setNicknameError(message || '저장된 닉네임을 쓸 수 없어요. 새로 정해주세요.');
      setIsNicknameModalOpen(true);
    })();

    return () => {
      cancelled = true;
    };
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

      // 스코어보드 복구 경로 — 재연결로 골 알림을 놓쳤어도 이 한 번이면 현재 상태가 맞춰진다.
      // 자유 채팅방이거나 경기 매핑 전이면 null이 오고, 그때는 보드가 경기 정보만 띄운다.
      setLive(res.data.live ?? null);
    } catch (err) {
      console.error('Failed to fetch room info:', err);
    } finally {
      setIsLoading(false);
      // 실패해도 올린다 — 그 시점에 우리가 아는 건 이게 전부다.
      // 안 올리면 서버가 죽었을 때 보드가 영영 기다린다.
      setLiveLoaded(true);
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

    // SockJS 핸드셰이크에는 커스텀 헤더를 실을 수 없어서 CONNECT 프레임으로 보낸다.
    // 서버는 이 값으로 닉네임 주인을 판정한다 (WebSocketConfig.configureClientInboundChannel).
    const clientId = getChatClientId();

    const client = new StompClient({
      // 백엔드가 .withSockJS()로 등록했으므로 raw WebSocket이 아니라 SockJS로 붙어야 한다
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
      connectHeaders: clientId ? { [CLIENT_ID_STOMP_HEADER]: clientId } : {},
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
            const msg = JSON.parse(frame.body) as ChatMessage;

            // 골·VAR 취소 메시지에는 스코어 스냅샷이 실려 온다. 메시지 하나가
            // 「채팅 라인」과 「스코어보드 갱신」을 동시에 처리하는 구조라,
            // 보드를 위해 따로 요청할 필요가 없다 (백엔드 설계 6장).
            if (msg.live) setLive(msg.live);

            // 봇 메시지는 여기서 걸러진다 (appendMessages 안의 isHumanMessage)
            appendMessages([msg]);
          } catch {
            // 파싱 불가 프레임은 무시
          }
        });

        // 정책 위반(닫힌 방·도배·금칙어·닉네임 중복)은 방 전체가 아니라 나에게만 온다.
        // 예전에는 이 채널을 구독하지 않아 거절 사유가 전혀 보이지 않았다.
        client.subscribe('/user/queue/errors', (frame) => {
          let rejection = { message: '', code: '' };
          try {
            rejection = readRejection(JSON.parse(frame.body));
          } catch {
            // 파싱 불가 프레임은 아래 기본 문구로
          }
          setErrorNotice(rejection.message || '메시지를 보낼 수 없습니다.');

          // 닉네임이 막힌 거라면 안내만 하고 끝내면 안 된다 — 이름을 바꿀 길을 열어준다.
          if (rejection.code === NICKNAME_TAKEN) {
            setMyNickname('');
            setNicknameError(rejection.message);
            setIsNicknameModalOpen(true);
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

    /*
      **앱을 오갈 때의 재연결.**

      쿠팡플레이로 경기를 보다가 돌아오는 식으로 쓰는 방이다. 폰에서 브라우저를 뒤로
      보내면 소켓이 끊기는데, 돌아왔을 때 라이브러리가 예약해 둔 재연결 차례(3초)를
      그대로 기다리면 그동안 "끊겼어요"가 떠 있다. 게다가 그 타이머는 백그라운드에서
      멈춰 있다가 돌아와서야 남은 시간을 마저 세므로 체감은 더 길다.

      그래서 돌아온 즉시 예약을 걷어내고 새로 붙는다. deactivate()가 예약된 재연결
      타이머를 지우므로(@stomp/stompjs Client#deactivate), 그냥 activate()를 다시
      부르는 것으로는 안 된다 — 이미 ACTIVE라 무시된다.
    */
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;

      // 붙어 있으면 끊긴 적이 없다는 뜻이다. 자리를 비운 사이 올라온 메시지만 채운다
      if (client.connected) {
        fetchRoomData();
        return;
      }

      client.deactivate().then(() => {
        // 그 사이 방을 떠났으면 되살리지 않는다
        if (stompRef.current === client) client.activate();
      });
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
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
  const handleNicknameSuccess = useCallback(
    (newNickname: string) => {
      setMyNickname(newNickname);
      if (typeof window !== 'undefined') {
        localStorage.setItem(nicknameKeyFor(matchId), newNickname);
        localStorage.setItem(NICKNAME_FALLBACK_KEY, newNickname);
      }
      setNicknameError('');
      setErrorNotice('');
      setIsNicknameModalOpen(false);
    },
    [matchId]
  );

  const openNicknameModal = useCallback(() => {
    setNicknameError('');
    setIsNicknameModalOpen(true);
  }, []);

  const closeNicknameModal = useCallback(() => setIsNicknameModalOpen(false), []);

  /**
   * 전송은 STOMP 한 경로뿐이다 (ChatController.kt: @MessageMapping("/chat/{matchId}")).
   * 서버가 검증·저장한 뒤 브로드캐스트한 것을 구독으로 되받아 화면에 그린다.
   * 낙관적 업데이트를 하지 않는 이유: 서버가 거절해도(도배·금칙어·닫힌 방)
   * 화면에는 보내진 것처럼 남아 예전처럼 "나만 보이는 메시지"가 생긴다.
   */
  const handleSendMessage = useCallback(
    (contentToSend?: string) => {
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
    },
    [inputContent, matchId, myNickname]
  );

  /**
   * 헤더 뒤로가기 — 기기 뒤로가기와 같은 동작(히스토리 되감기).
   * 예전에는 홈('/')으로 가는 링크였다. 방 선택 화면으로 돌아가지 않는 데다,
   * 홈은 뉴스 목록을 불러오는 무거운 페이지라 서버 응답을 기다리는 동안
   * 눌러도 반응이 없는 것처럼 보였다.
   */
  const handleBack = useCallback(() => {
    // 링크로 바로 들어와 되돌아갈 기록이 없으면 방 선택 화면으로 보낸다.
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/chat');
    }
  }, [router]);

  /*
    끊김 안내를 [DISCONNECT_GRACE_MS]만큼 늦춘다.

    **유예는 화면으로 돌아온 시점부터 다시 센다.** 앱을 오가는 동안 소켓은 진작 끊겨
    있는데 그때부터 재면 타이머가 백그라운드에서 만료돼, 돌아오는 순간 배너가 그대로
    떠 있다 — 유예를 둔 뜻이 사라진다. 사용자가 보고 있는 시간만 센다.

    effect 본문에서 표시를 끄지 않는 이유 — 렌더 직후 setState를 부르면 렌더가 한 번 더
    돈다. 다시 붙으면 deps가 바뀌어 cleanup이 도니 거기서 걷으면 된다.
  */
  const [disconnectShown, setDisconnectShown] = useState(false);
  useEffect(() => {
    if (isConnected) return;

    let timer: ReturnType<typeof setTimeout>;
    const arm = (reset: boolean) => {
      clearTimeout(timer);
      if (reset) setDisconnectShown(false);
      timer = setTimeout(() => setDisconnectShown(true), DISCONNECT_GRACE_MS);
    };

    arm(false);

    const onVisible = () => {
      if (document.visibilityState === 'visible') arm(true);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      setDisconnectShown(false);
    };
  }, [isConnected]);

  /** 끊김 배너를 지금 띄워야 하는가 — 붙는 순간 곧바로 내려간다 */
  const showDisconnected = !isConnected && disconnectShown;

  return {
    matchId,
    recentMatch,
    messages,
    live,
    liveLoaded,
    onlineCount,
    isLoading,
    roomOpen,
    isConnected,
    showDisconnected,
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
    playChant,
    handleBack,
  };
}
