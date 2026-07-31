'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import DarkModeToggle from '@/components/DarkModeToggle';

export default function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChatPage = pathname?.startsWith('/chat');

  if (isChatPage) {
    return (
      <main className="min-h-dvh h-dvh w-full bg-white text-gray-900 flex flex-col overflow-hidden">
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
