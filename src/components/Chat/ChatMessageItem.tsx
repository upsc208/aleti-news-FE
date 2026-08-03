'use client';

import React from 'react';
import type { ChatMessage } from '@/client/types.gen';
import { Sparkles } from 'lucide-react';

interface ChatMessageItemProps {
  msg: ChatMessage;
  myNickname: string;
}

export default function ChatMessageItem({ msg, myNickname }: ChatMessageItemProps) {
  const isMine =
    msg.nickname &&
    myNickname &&
    msg.nickname.trim().toLowerCase() === myNickname.trim().toLowerCase();

  const isSystem =
    msg.nickname === 'SYSTEM' ||
    msg.nickname === '알레띠안내' ||
    msg.nickname === '공지';

  // Format timestamp safely
  const formatTime = (rawTime?: string) => {
    if (!rawTime) {
      return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }
    try {
      const d = new Date(rawTime);
      if (isNaN(d.getTime())) return rawTime;
      return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return rawTime;
    }
  };

  // System notification banner
  if (isSystem) {
    return (
      <div className="flex justify-center my-3 animate-fadeIn">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-200 text-aleti-red text-xs font-bold shadow-xs">
          <Sparkles size={13} className="text-aleti-red animate-pulse" />
          <span>{msg.content}</span>
        </div>
      </div>
    );
  }

  // Self message (Right aligned - Atletico Red bubble)
  if (isMine) {
    return (
      <div className="flex flex-col items-end my-2 pl-8 animate-fadeIn">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] text-gray-400 font-medium">{formatTime(msg.sentAt)}</span>
          <span className="text-xs font-black text-aleti-red tracking-tight">
            {msg.nickname} (나)
          </span>
        </div>
        <div className="max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl rounded-tr-xs bg-aleti-red text-white shadow-sm text-sm font-medium leading-relaxed break-words">
          {msg.content}
        </div>
      </div>
    );
  }

  // Other users' message (Left aligned - Atleti navy bubble)
  const initialChar = msg.nickname ? msg.nickname.charAt(0).toUpperCase() : '?';

  return (
    <div className="flex items-start gap-2.5 my-2 pr-8 animate-fadeIn">
      {/* Avatar Circle */}
      <div className="w-8 h-8 rounded-full bg-aleti-navy text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0 mt-0.5">
        {initialChar}
      </div>

      <div className="flex flex-col items-start max-w-[85%] sm:max-w-[75%]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
            {msg.nickname}
            {msg.ipHash && (
              <span className="text-[9px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                #{msg.ipHash.substring(0, 4)}
              </span>
            )}
          </span>
          <span className="text-[10px] text-gray-400 font-medium">{formatTime(msg.sentAt)}</span>
        </div>
        <div className="px-4 py-2.5 rounded-2xl rounded-tl-xs bg-aleti-navy text-white border border-aleti-navy shadow-xs text-sm font-medium leading-relaxed break-words">
          {msg.content}
        </div>
      </div>
    </div>
  );
}
