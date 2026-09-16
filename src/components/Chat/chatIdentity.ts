/**
 * 채팅에서 "나"를 가리키는 값들 — 브라우저 식별자와 저장된 닉네임.
 *
 * 백엔드는 닉네임 주인을 이 브라우저 식별자로 판정한다 (ChatClient.kt).
 * 예전에는 IP로 판정해서, 탭을 닫았다 새로 열거나 모바일에서 IP가 바뀌면
 * 자기가 쓰던 이름에 자기가 잠겼다. 게다가 저장된 닉네임이 있으면 모달을 건너뛰어
 * 이름을 바꿀 방법도 없이 채팅이 막혔다.
 */

const CLIENT_ID_KEY = 'atleti_chat_client_id';

export const CLIENT_ID_HTTP_HEADER = 'X-Chat-Client-Id';
export const CLIENT_ID_STOMP_HEADER = 'x-chat-client-id';

export const ADMIN_TOKEN_STOMP_HEADER = 'x-admin-token';

export const NICKNAME_TAKEN = 'NICKNAME_TAKEN';

export const nicknameKeyFor = (matchId: string) => `atleti_chat_nickname_${matchId}`;
export const NICKNAME_FALLBACK_KEY = 'atleti_chat_nickname';

const randomId = (): string => {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random()
          .toString(36)
          .slice(2)}`;
  return `c-${uuid}`.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
};

/**
 * 이 브라우저의 고정 식별자. 없으면 만들어 저장한다.
 * localStorage를 못 쓰는 환경(사파리 프라이빗 등)에서는 빈 문자열 —
 * 그러면 서버가 예전처럼 IP로 판정하므로 최소한 동작은 한다.
 */
export function getChatClientId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const saved = localStorage.getItem(CLIENT_ID_KEY);
    if (saved) return saved;
    const created = randomId();
    localStorage.setItem(CLIENT_ID_KEY, created);
    return created;
  } catch {
    return '';
  }
}

/** 식별자가 없을 때 헤더를 아예 빼기 위해 객체로 만들어 준다 */
export function chatClientHeaders(): Record<string, string> {
  const id = getChatClientId();
  return id ? { [CLIENT_ID_HTTP_HEADER]: id } : {};
}
