'use client';

import React from 'react';
import { User, AlertCircle, CheckCircle2, Shield, Loader2 } from 'lucide-react';

import { useNicknameForm } from './useNicknameForm';

interface NicknameModalProps {
  isOpen: boolean;
  matchId: string;
  currentNickname?: string;
  /** 저장해둔 닉네임이 서버에서 거절돼 모달이 열린 경우 그 사유 */
  initialError?: string;
  onSuccess: (nickname: string) => void;
  onClose?: () => void;
}

/**
 * 자유 채팅방의 닉네임 설정 모달.
 *
 * 경기 채팅방은 이걸 쓰지 않는다 — 거기는 직관 티켓(stadium/TicketNicknameModal)이다.
 * 자유방에는 경기도 좌석도 없어서 티켓이라는 은유가 성립하지 않는다.
 * 검증·발급 로직만 useNicknameForm으로 공유한다.
 */
export default function NicknameModal({
  isOpen,
  matchId,
  currentNickname = '',
  initialError = '',
  onSuccess,
  onClose,
}: NicknameModalProps) {
  const { nickname, trimmed, setNickname, isSubmitting, errorMsg, done, submit } =
    useNicknameForm({ isOpen, matchId, currentNickname, initialError, onSuccess });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#3d0009]/75 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-md bg-white border border-aleti-red/25 rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-aleti-red" />

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aleti-red to-[#8c0517] flex items-center justify-center text-white shadow-md shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-aleti-red">
                Colchoneros Live Chat
              </span>
              <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none mt-0.5">
                자유 채팅방 닉네임 설정
              </h2>
            </div>
          </div>

          <p className="text-xs text-gray-600 mb-5 leading-relaxed">
            아틀레티코 마드리드 팬들이 상시로 모이는 자유 채팅방이에요. 사용할 닉네임을
            정해주세요. 🔴⚪
          </p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label
                htmlFor="nickname-input"
                className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5"
              >
                닉네임 입력 (2~12자)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User size={16} />
                </div>
                <input
                  id="nickname-input"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="예: 로히블랑코_77, Colchonero"
                  maxLength={12}
                  required
                  /* iOS 자동 확대(16px 미만 입력창) 방지 — 모바일에서만 16px */
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-base sm:text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-aleti-red focus:ring-1 focus:ring-aleti-red transition"
                />
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium"
              >
                <AlertCircle size={14} className="shrink-0 text-aleti-red" />
                <span>{errorMsg}</span>
              </div>
            )}

            {done && (
              <div
                role="status"
                className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-medium"
              >
                <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                <span>닉네임이 설정됐어요. 채팅방으로 들어갑니다.</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-xs font-bold hover:bg-gray-100 transition disabled:opacity-50"
                >
                  닫기
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !trimmed}
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
