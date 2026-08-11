'use client';

import React from 'react';
import type { ChatMessage } from '@/client/types.gen';
import { Megaphone } from 'lucide-react';
import { initialsOf, seatFor } from './seat';
import { isChant } from './feed';

interface StadiumMessageItemProps {
  msg: ChatMessage;
  myNickname: string;
  matchId: string;
}

const formatTime = (rawTime?: string) => {
  if (!rawTime) return '';
  const d = new Date(rawTime);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
};

const SYSTEM_NICKNAMES = new Set(['SYSTEM', '알레띠안내', '공지']);

export default function StadiumMessageItem({
  msg,
  myNickname,
  matchId,
}: StadiumMessageItemProps) {
  const isMine =
    !!msg.nickname &&
    !!myNickname &&
    msg.nickname.trim().toLowerCase() === myNickname.trim().toLowerCase();

  if (SYSTEM_NICKNAMES.has(msg.nickname)) {
    return (
      <div className="my-3 flex justify-center animate-fadeIn">
        <div className="flex items-center gap-1.5 rounded-full border border-slate-900/10 bg-white/85 px-3.5 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm backdrop-blur-md">
          <Megaphone size={12} className="shrink-0 text-slate-400" />
          <span>{msg.content}</span>
        </div>
      </div>
    );
  }

  const seat = seatFor(msg.nickname, matchId);
  const chant = isChant(msg.content);
  const time = formatTime(msg.sentAt);

  // 내 메시지 — 오른쪽, 붉은 말풍선
  if (isMine) {
    return (
      <div className="my-2 flex flex-col items-end pl-10 animate-fadeIn">
        <div className="mb-1 flex items-center gap-1.5 pr-11">
          <span className="stadium-meta text-[11px] font-black text-slate-900">나</span>
          <span className="stadium-meta text-[10px] font-semibold text-slate-600">
            {seat.label}
          </span>
        </div>
        {/* 말풍선의 max-w는 부모 폭을 기준으로 계산된다. 이 줄에 w-full이 없으면
            부모가 내용만큼만 넓어져서 퍼센트가 제 폭을 못 잡고 글이 잘게 접힌다 */}
        <div className="flex w-full items-end justify-end gap-2">
          <div
            className={`stadium-bubble stadium-bubble--mine max-w-[78%] sm:max-w-[70%] ${
              chant ? 'stadium-bubble--chant-mine' : ''
            }`}
          >
            {msg.content}
          </div>
          <div className="stadium-avatar stadium-avatar--mine shrink-0">나</div>
        </div>
        {time && (
          <span className="stadium-meta mt-1 pr-11 text-[10px] font-medium text-slate-500">
            {time}
          </span>
        )}
      </div>
    );
  }

  // 남의 메시지 — 왼쪽, 아바타 + 좌석 뱃지 + 반투명 말풍선
  return (
    <div className="my-2 flex items-start gap-2.5 pr-10 animate-fadeIn">
      <div
        className="stadium-avatar shrink-0"
        style={{
          // 좌석에서 뽑은 고유색 — 같은 사람은 늘 같은 색으로 앉아 있다
          background: `linear-gradient(160deg, hsl(${seat.hue} 55% 42%), hsl(${seat.hue} 60% 26%))`,
        }}
      >
        {initialsOf(msg.nickname)}
      </div>

      {/* flex-1이 있어야 말풍선의 max-w 퍼센트가 남은 폭 기준으로 계산된다.
          없으면 열이 내용만큼만 넓어져 글이 두세 글자씩 접힌다 */}
      <div className="flex min-w-0 flex-1 flex-col items-start">
        <div className="mb-1 flex items-baseline gap-2">
          <span className="stadium-meta truncate text-[11px] font-black text-slate-900">
            {msg.nickname}
          </span>
          <span className="stadium-meta shrink-0 text-[10px] font-semibold text-slate-600">
            {seat.label}
          </span>
          {time && (
            <span className="stadium-meta shrink-0 text-[10px] font-medium text-slate-500">
              {time}
            </span>
          )}
        </div>
        <div
          className={`stadium-bubble max-w-[85%] sm:max-w-[75%] ${
            chant ? 'stadium-bubble--chant' : ''
          }`}
        >
          {msg.content}
        </div>
      </div>
    </div>
  );
}
