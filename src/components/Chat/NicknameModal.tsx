'use client';

import React, { useState, useEffect } from 'react';
import { User, AlertCircle, CheckCircle2, Shield, Loader2 } from 'lucide-react';
import { reserveNickname } from '@/client/sdk.gen';

interface NicknameModalProps {
  isOpen: boolean;
  matchId: string;
  currentNickname?: string;
  onSuccess: (nickname: string) => void;
  onClose?: () => void;
}

export default function NicknameModal({
  isOpen,
  matchId,
  currentNickname = '',
  onSuccess,
  onClose,
}: NicknameModalProps) {
  const [nickname, setNickname] = useState(currentNickname);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setNickname(currentNickname);
    setErrorMsg('');
    setSuccessMsg('');
  }, [currentNickname, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();

    if (!trimmed) {
      setErrorMsg('닉네임을 입력해 주세요.');
      return;
    }

    // 서버 규칙과 동일하게 2~12자 (ChatService.validateNickname).
    // 예전에는 15자까지 통과시켜 13~15자는 서버에서 거절당했다.
    if (trimmed.length < 2 || trimmed.length > 12) {
      setErrorMsg('닉네임은 2자 이상 12자 이하로 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // hey-api 클라이언트는 기본값(throwOnError:false)에서 예외를 던지지 않고
      // { data, error, response }를 돌려준다. 예전 코드는 catch에만 의존해
      // 409(닉네임 중복)를 성공으로 처리했다.
      const res = await reserveNickname({
        path: { matchId },
        body: { nickname: trimmed },
      });

      if (res.error || !res.response?.ok) {
        const serverMsg =
          typeof res.error === 'object' && res.error !== null && 'error' in res.error
            ? String((res.error as { error?: unknown }).error ?? '')
            : '';
        setErrorMsg(
          serverMsg ||
            (res.response?.status === 409
              ? '이미 사용 중이거나 사용할 수 없는 닉네임입니다.'
              : '닉네임을 설정하지 못했어요. 잠시 후 다시 시도해주세요.')
        );
        return;
      }

      setSuccessMsg('닉네임이 성공적으로 설정되었습니다!');
      setTimeout(() => {
        onSuccess(trimmed);
      }, 400);
    } catch (err) {
      // 네트워크 장애 등 — 여기서 로컬 통과시키면 채팅이 안 되는데 된 것처럼 보인다
      console.error('Failed to reserve nickname:', err);
      setErrorMsg('서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#3d0009]/75 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-md bg-white border border-aleti-red/25 rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-aleti-red" />

        <div className="p-6">
          {/* Modal Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aleti-red to-[#8c0517] flex items-center justify-center text-white shadow-md shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-aleti-red">
                Colchoneros Live Chat
              </span>
              <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none mt-0.5">
                라이브 채팅 닉네임 설정
              </h2>
            </div>
          </div>

          <p className="text-xs text-gray-600 mb-5 leading-relaxed">
            아틀레티코 마드리드 실시간 응원방에 참여할 닉네임을 설정해 주세요. 경기 중 팬들과 함께 열정적으로 소통할 수 있습니다! 🔴⚪
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                닉네임 입력 (2~12자)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="예: 로히블랑코_77, Colchonero"
                  maxLength={12}
                  required
                  /* iOS 자동 확대(16px 미만 입력창) 방지 — 모바일에서만 16px */
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-base sm:text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-aleti-red focus:ring-1 focus:ring-aleti-red transition"
                />
              </div>
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
                <AlertCircle size={14} className="shrink-0 text-aleti-red" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-medium">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-xs font-bold hover:bg-gray-100 transition"
                >
                  취소
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !nickname.trim()}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-aleti-red to-[#8c0517] text-white font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>설정 중...</span>
                  </>
                ) : (
                  <span>채팅방 입장하기</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
