'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Newspaper, Info, Sparkles, ShoppingBag, MessageSquare } from 'lucide-react';
import TributeBadge from './Header/TributeBadge';
import TicketModal from './Header/TicketModal';
import { useTheme } from './ThemeProvider';

export default function Header() {
  const { theme } = useTheme();
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    // 이중 임계값(히스테리시스): 스트라이프가 펼쳐지며 헤더 높이가 바뀔 때
    // 스크롤 앵커링이 scrollY를 보정해도 반대 조건에 걸려 진동하지 않도록,
    // 펼침(<2px)과 접힘(>40px) 기준을 분리하고 그 사이에서는 상태를 유지한다.
    const onScroll = () => {
      const y = window.scrollY;
      setAtTop((prev) => (y < 2 ? true : y > 40 ? false : prev));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 뉴스 클릭 시 검색바(#news-section)가 sticky 헤더 바로 아래 오도록 스크롤.
  // 홈이 아닌 페이지에서는 기본 내비게이션(/#news-section)에 맡긴다.
  const scrollToNews = (e: React.MouseEvent) => {
    const target = document.getElementById('news-section');
    if (!target) return;
    e.preventDefault();
    const header = document.querySelector('header');
    // 스크롤을 내리면 상단 유니폼 스트라이프(28px)가 접히므로,
    // 현재 펼쳐져 있다면 그만큼 헤더 높이에서 빼고 계산한다.
    const stripe = header?.querySelector('.header-stripe-kit');
    const collapsedHeaderHeight =
      (header?.offsetHeight ?? 0) - ((stripe as HTMLElement | null)?.offsetHeight ?? 0);
    const top =
      target.getBoundingClientRect().top + window.scrollY - collapsedHeaderHeight - 12;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-[#0d0e14] border-b border-gray-200 dark:border-volt/8 shadow-sm dark:shadow-none overflow-x-hidden transition-colors duration-300">
      {/* 26/27 Home Kit stripe with trident pinstripes — collapses once the page is scrolled */}
      <div className={`w-full header-stripe-kit dark-header-stripe overflow-hidden transition-all duration-300 ease-out ${atTop ? 'h-7 opacity-100' : 'h-0 opacity-0'}`}></div>
      <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row md:h-20 items-center justify-between px-2 sm:px-6 lg:px-12 py-4 md:py-0 gap-y-2 md:gap-y-0">
        {/* Top Section: Logo & Tribute (Mobile) / Logo only (Desktop) */}
        <div className="flex w-full items-center justify-between md:justify-start md:flex-1 gap-2 sm:gap-4 shrink-0">
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group shrink-0">
            <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-aleti-red to-[#8c0517] dark:from-[#111318] dark:to-black dark:border dark:border-volt/20 shadow-lg group-hover:scale-105 transition-transform shrink-0">
              <span className="text-[10px] sm:text-sm font-black text-white dark:text-volt italic">KR</span>
              <div className="absolute -top-1 -right-1 flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-gemini-purple dark:bg-volt text-white dark:text-black shadow-sm">
                <Sparkles size={6} className="sm:hidden" />
                <Sparkles size={8} className="hidden sm:block" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-xl font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-none font-bebas">
                ATLÉTI <span className="text-aleti-red dark:text-volt xs:inline">NEWS</span>
              </span>
              <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase leading-none mt-1 hidden sm:block">
                알레띠 최신 소식
              </span>
            </div>
          </Link>

          {/* TributeBadge for Mobile only */}
          <div className="md:hidden scale-90 xs:scale-100 origin-right transition-transform">
            <TributeBadge key={theme} />
          </div>
        </div>

        {/* Center Section: Navigation */}
        <nav className="flex items-center justify-center gap-x-2 min-[350px]:gap-x-4 sm:gap-x-6 lg:gap-x-8 xl:gap-x-12 md:flex-1 md:justify-center gap-y-2 text-[11px] min-[350px]:text-[13px] sm:text-sm lg:text-base font-extrabold w-full md:w-auto mt-2 md:mt-0 whitespace-nowrap overflow-visible px-1">
          <Link href="/#news-section" onClick={scrollToNews} className="group flex items-center gap-1 min-[350px]:gap-1.5 lg:gap-2 text-gray-800 dark:text-gray-300 transition-all hover:text-aleti-red dark:hover:text-volt shrink-0">
            <div className="p-1 min-[350px]:p-1.5 lg:p-2 rounded-lg group-hover:bg-aleti-red/5 dark:group-hover:bg-volt/5 transition-colors">
              <Newspaper className="w-4 h-4 min-[350px]:w-[18px] min-[350px]:h-[18px] lg:w-5 lg:h-5" />
            </div>
            <span className="tracking-tight underline-offset-4 decoration-2 hover:underline">뉴스</span>
          </Link>
          <Link href="/about" className="group flex items-center gap-1 min-[350px]:gap-1.5 lg:gap-2 text-gray-800 dark:text-gray-300 transition-all hover:text-aleti-red dark:hover:text-volt shrink-0">
            <div className="p-1 min-[350px]:p-1.5 lg:p-2 rounded-lg group-hover:bg-aleti-red/5 dark:group-hover:bg-volt/5 transition-colors">
              <Info className="w-4 h-4 min-[350px]:w-[18px] min-[350px]:h-[18px] lg:w-5 lg:h-5" />
            </div>
            <span className="tracking-tight underline-offset-4 decoration-2 hover:underline">소개</span>
          </Link>
          {/* 채팅방 선택 화면 — 자유 채팅방 / 경기 채팅방 중 고른다 */}
          <Link href="/chat" className="group flex items-center gap-1 min-[350px]:gap-1.5 lg:gap-2 text-gray-800 dark:text-gray-300 transition-all hover:text-aleti-red dark:hover:text-volt shrink-0">
            <div className="p-1 min-[350px]:p-1.5 lg:p-2 rounded-lg group-hover:bg-aleti-red/5 dark:group-hover:bg-volt/5 transition-colors">
              <MessageSquare className="w-4 h-4 min-[350px]:w-[18px] min-[350px]:h-[18px] lg:w-5 lg:h-5" />
            </div>
            <span className="tracking-tight underline-offset-4 decoration-2 hover:underline">채팅</span>
          </Link>
          <div className="hidden lg:block h-6 w-[1px] bg-gray-200 dark:bg-volt/10 mx-1 shrink-0"></div>
          <TicketModal />
          <a
            href="https://shop.atleticodemadrid.com/en/home"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1 min-[350px]:gap-1.5 lg:gap-2 text-gray-900 dark:text-gray-300 hover:bg-gray-900 dark:hover:bg-volt/10 hover:text-white dark:hover:text-volt px-1.5 min-[350px]:px-2.5 lg:px-4 py-1.5 min-[350px]:py-2 rounded-lg sm:rounded-xl transition-all border border-gray-200 dark:border-volt/10 shadow-sm shrink-0"
            title="공식 스토어"
          >
            <ShoppingBag className="w-4 h-4 min-[350px]:w-[18px] min-[350px]:h-[18px] lg:w-5 lg:h-5 group-hover:scale-110 transition-transform" />
            <span className="tracking-tighter font-extrabold">스토어</span>
          </a>
        </nav>

        {/* Right Section: Tribute (Desktop) */}
        <div className="hidden md:flex md:flex-1 justify-end shrink-0 ml-4">
          <TributeBadge key={theme} />
        </div>
      </div>
    </header>
  );
}
