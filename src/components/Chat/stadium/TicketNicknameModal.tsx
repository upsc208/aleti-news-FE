'use client';

import React, { useEffect, useMemo } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';

import { useNicknameForm } from '../useNicknameForm';
import { hash32, seatFor } from './seat';

interface TicketNicknameModalProps {
  isOpen: boolean;
  matchId: string;
  currentNickname?: string;
  /** 저장해둔 닉네임이 서버에서 거절돼 모달이 열린 경우 그 사유 */
  initialError?: string;
  /** 티켓에 인쇄할 경기 — "vs Manchester City" */
  fixture: string;
  /** 경기 부가 정보 — "CLUB FRIENDLY · 8월 9일 오후 08:00" */
  meta: string;
  onSuccess: (nickname: string) => void;
  onClose?: () => void;
}

/** 바코드 — 해시에서 뽑는다. 난수를 쓰면 서버·클라이언트 렌더가 어긋난다 */
function barsFrom(seed: number): number[] {
  const out: number[] = [];
  let h = seed;
  for (let i = 0; i < 34; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    out.push(1 + ((h >>> 8) % 3)); // 1~3px
  }
  return out;
}

/**
 * 경기 채팅방 입장 티켓.
 *
 * 실물 직관 티켓의 구조를 따른다 — 유니폼 줄무늬, 경기 정보, 이름 기입란,
 * 미싱선으로 잘리는 스텁(구역·좌석·바코드), 개찰 밴드.
 *
 * 핵심은 스텁이 실시간으로 인쇄된다는 것이다. 좌석은 seat.ts가 닉네임에서
 * 결정론적으로 뽑는 값이라, 티켓에 찍힌 자리가 곧 채팅에서 내 말풍선 옆에
 * 뜨는 자리다. 장식이 아니라 실제 데이터다.
 *
 * 자유 채팅방은 이 화면을 쓰지 않는다 — 거기엔 경기도 좌석도 없다.
 * 그쪽은 Chat/NicknameModal이 맡는다. 검증·발급 로직만 useNicknameForm으로 공유한다.
 */
export default function TicketNicknameModal({
  isOpen,
  matchId,
  currentNickname = '',
  initialError = '',
  fixture,
  meta,
  onSuccess,
  onClose,
}: TicketNicknameModalProps) {
  const { nickname, trimmed, setNickname, isSubmitting, errorMsg, done, submit } =
    useNicknameForm({ isOpen, matchId, currentNickname, initialError, onSuccess });

  // 이름을 적는 대로 자리가 찍힌다
  const seat = useMemo(
    () => (trimmed.length >= 2 ? seatFor(trimmed, matchId) : null),
    [trimmed, matchId]
  );

  const serial = useMemo(() => {
    const h = hash32(matchId);
    return `ATM-${String(h % 100000).padStart(5, '0')}-${(h >>> 20)
      .toString(16)
      .toUpperCase()
      .padStart(3, '0')}`;
  }, [matchId]);

  const bars = useMemo(() => barsFrom(hash32(`${matchId}#bar`)), [matchId]);

  // Esc로 닫는다 — aria-modal 대화상자에서 기대되는 동작이다.
  // 발권 중에는 막는다. 요청이 날아간 뒤 닫히면 결과를 못 보여준다.
  useEffect(() => {
    if (!isOpen || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-title"
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 bg-[#2a0006]/80 backdrop-blur-md animate-fadeIn"
      // 바깥을 눌러도 닫힌다. 발권 중에는 막는다
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && onClose && !isSubmitting) onClose();
      }}
    >
      {/* 닫기 버튼이 티켓 위쪽 바깥에 붙으므로 기준 상자가 하나 필요하다.
          짧은 화면에서 잘리지 않도록 위아래 여백을 준다. */}
      <div className="relative my-12 w-full max-w-[23.5rem] shrink-0">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="ticket__close"
            aria-label="닫기"
          >
            <X size={17} />
          </button>
        )}

        <div className="ticket ticket--enter">
          {/* ── 상단: 유니폼 줄무늬 + 구단 ───────────────── */}
          <div className="ticket__stripes" aria-hidden="true" />
          <div className="ticket__crest">
            <span className="ticket__print text-[0.9375rem] tracking-[0.1em]">
              Atlético de Madrid
            </span>
            <span className="ticket__print text-[0.625rem] tracking-[0.22em] opacity-80">
              Pase de hincha
            </span>
          </div>

          {/* ── 본문: 경기 + 이름 기입란 ─────────────────── */}
          <div className="ticket__body">
            <p className="ticket__label">Partido</p>
            <h2 id="ticket-title" className="ticket__print ticket__fixture">
              {fixture}
            </h2>
            <p className="ticket__mono mt-1.5">{meta}</p>

            <div className="mt-5">
              <label htmlFor="ticket-name" className="ticket__label">
                Nombre · 응원할 이름
              </label>
              <div className="ticket__write">
                <input
                  id="ticket-name"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="로히블랑코_77"
                  maxLength={12}
                  autoComplete="off"
                  required
                  className="ticket__input"
                />
                <span className="ticket__mono ticket__count">{trimmed.length}/12</span>
              </div>
              <p className="ticket__mono mt-2">2–12자 · 이름을 적으면 좌석이 배정돼요</p>
            </div>

            {errorMsg && (
              <p className="ticket__reject" role="alert">
                <AlertCircle size={14} className="mt-px shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}
          </div>

          {/* ── 미싱선 ──────────────────────────────────── */}
          <div className="ticket__perf" aria-hidden="true" />

          {/* ── 스텁: 이름에서 뽑은 좌석 + 바코드 ─────────── */}
          <div className="ticket__stub">
            <div className="min-w-0">
              <p className="ticket__label">Sector</p>
              {/* 좌석이 바뀔 때마다 한 번 찍히도록 key로 애니메이션을 다시 태운다 */}
              <p
                key={seat?.label ?? 'none'}
                className="ticket__print ticket__sector ticket__seat--stamp truncate"
              >
                {/* 아직 안 적었으면 인쇄 전 칸처럼 비워둔다 — 안내는 기입란 아래에 있다 */}
                {seat?.section ?? '———'}
              </p>
              <p className="ticket__mono mt-2">{serial}</p>
            </div>

            <div className="shrink-0 text-right">
              <p className="ticket__label">Asiento</p>
              <p
                key={seat?.number ?? 0}
                className="ticket__print ticket__seat ticket__seat--stamp"
              >
                {seat?.number ?? '—'}
              </p>
              <div className="ticket__barcode mt-2" aria-hidden="true">
                {bars.map((w, i) => (
                  <span key={i} className="ticket__bar" style={{ width: `${w}px` }} />
                ))}
              </div>
            </div>
          </div>

          {/* ── 개찰 ────────────────────────────────────── */}
          <form onSubmit={submit}>
            <button
              type="submit"
              disabled={isSubmitting || !trimmed}
              className="ticket__gate"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 size={15} className="animate-spin" />
                  발권 중
                </span>
              ) : (
                '입장하기'
              )}
            </button>
          </form>

          {/* ── 입장 도장 ───────────────────────────────── */}
          {done && (
            <div className="ticket__admitted" role="status">
              <span className="ticket__stamp">Admitido</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
