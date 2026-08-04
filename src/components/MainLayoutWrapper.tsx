'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import DarkModeToggle from '@/components/DarkModeToggle';

export default function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // 실제 채팅방(/chat/free, /chat/{matchId})만 전체화면 몰입형으로 띄운다.
  // 방 선택 화면(/chat)은 일반 페이지라 사이트 헤더·푸터를 그대로 쓴다
  // — 여기에 overflow-hidden + h-dvh를 걸면 선택 카드가 잘린다.
  const isChatRoom = pathname?.startsWith('/chat/');

  // 채팅방은 뷰포트에 정확히 맞는 몰입 화면이다.
  // body는 100dvh를 "최소" 높이로만 잡으므로 앞 페이지에서 넘어온 스크롤 위치나
  // 모바일 주소창 높이 변화가 남으면 화면이 살짝 밀린 채로 열린다.
  // 이 화면에서만 문서 스크롤 자체를 잠그고 맨 위로 되돌린다.
  useEffect(() => {
    if (!isChatRoom) return;
    document.documentElement.classList.add('chat-immersive');
    window.scrollTo(0, 0);
    return () => {
      document.documentElement.classList.remove('chat-immersive');
    };
  }, [isChatRoom]);

  if (isChatRoom) {
    return (
      <main className="h-dvh w-full bg-white text-gray-900 flex flex-col overflow-hidden">
        {children}
      </main>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <footer className="bg-aleti-navy dark:bg-[#0d0e14] text-white py-12 dark:border-t dark:border-volt/10 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="text-center">
              <p className="text-sm font-bold text-white mb-1">아틀레티 KR</p>
              <p className="text-xs text-blue-100 dark:text-gray-500">&copy; {new Date().getFullYear()} Atleti KR. All rights reserved.</p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <p className="text-[11px] font-bold text-blue-200 dark:text-volt/30 uppercase tracking-widest">Contact & Feedback</p>
              <a
                href="mailto:upscman@gmail.com"
                className="text-sm font-medium text-white hover:text-blue-200 transition-colors border-b border-blue-300 hover:border-blue-100 pb-0.5"
              >
                upscman@gmail.com
              </a>
            </div>

            <p className="text-[11px] italic text-blue-200 dark:text-gray-600">
              &quot;위 메일로 연락주시길 바랍니다.&quot;
            </p>
          </div>
        </div>
      </footer>
      <DarkModeToggle />
    </>
  );
}
