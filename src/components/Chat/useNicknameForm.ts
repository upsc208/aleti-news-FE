'use client';

import { useCallback, useEffect, useState } from 'react';
import { reserveNickname } from '@/client/sdk.gen';
import { chatClientHeaders } from './chatIdentity';

/** 성공 표시를 보여주고 방으로 넘어가기까지의 여유 */
const HANDOFF_MS = 450;

interface UseNicknameFormOptions {
  isOpen: boolean;
  matchId: string;
  currentNickname: string;
  initialError: string;
  onSuccess: (nickname: string) => void;
}

/**
 * 닉네임 발급 폼의 동작.
 *
 * 화면이 둘이라 훅으로 뺐다 — 자유 채팅방은 평범한 모달(NicknameModal),
 * 경기 채팅방은 직관 티켓(stadium/TicketNicknameModal)을 쓰는데,
 * 검증 규칙과 서버 응답 해석은 두 곳이 절대 달라지면 안 된다.
 */
export function useNicknameForm({
  isOpen,
  matchId,
  currentNickname,
  initialError,
  onSuccess,
}: UseNicknameFormOptions) {
  const [nickname, setNicknameState] = useState(currentNickname);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  /** 발급 성공 — 평범한 모달은 문구를, 티켓은 도장을 띄운다 */
  const [done, setDone] = useState(false);

  // 모달이 다시 열리거나 바깥에서 사유가 내려오면 폼을 처음 상태로 되돌린다.
  // (열려 있는 동안 서버가 닉네임을 거절하는 경로가 있어서, 마운트 시점 값만
  //  쓰는 방식으로는 그 사유를 못 받는다)
  useEffect(() => {
    setNicknameState(currentNickname);
    setErrorMsg(initialError);
    setDone(false);
  }, [currentNickname, initialError, isOpen]);

  const setNickname = useCallback((value: string) => {
    setNicknameState(value);
    setErrorMsg('');
  }, []);

  const trimmed = nickname.trim();

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!trimmed) {
        setErrorMsg('이름을 입력해 주세요.');
        return;
      }

      // 서버 규칙과 동일하게 2~12자 (ChatService.validateNickname)
      if (trimmed.length < 2 || trimmed.length > 12) {
        setErrorMsg('이름은 2자 이상 12자 이하로 입력해 주세요.');
        return;
      }

      setIsSubmitting(true);
      setErrorMsg('');

      try {
        // hey-api 클라이언트는 기본값(throwOnError:false)에서 예외를 던지지 않고
        // { data, error, response }를 돌려준다. 예전 코드는 catch에만 의존해
        // 409(닉네임 중복)를 성공으로 처리했다.
        const res = await reserveNickname({
          path: { matchId },
          body: { nickname: trimmed },
          // 닉네임 주인 판정은 IP가 아니라 이 값으로 한다 (chatIdentity.ts)
          headers: chatClientHeaders(),
        });

        if (res.error || !res.response?.ok) {
          const serverMsg =
            typeof res.error === 'object' && res.error !== null && 'error' in res.error
              ? String((res.error as { error?: unknown }).error ?? '')
              : '';
          setErrorMsg(
            serverMsg ||
              (res.response?.status === 409
                ? '이미 다른 사람이 쓰고 있는 이름이에요. 다른 이름으로 정해주세요.'
                : '이름을 설정하지 못했어요. 잠시 후 다시 시도해주세요.')
          );
          return;
        }

        setDone(true);
        setTimeout(() => onSuccess(trimmed), HANDOFF_MS);
      } catch (err) {
        // 네트워크 장애 등 — 여기서 로컬 통과시키면 채팅이 안 되는데 된 것처럼 보인다
        console.error('Failed to reserve nickname:', err);
        setErrorMsg('서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [matchId, onSuccess, trimmed]
  );

  return { nickname, trimmed, setNickname, isSubmitting, errorMsg, done, submit };
}
