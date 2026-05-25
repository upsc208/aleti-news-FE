'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { Newspaper, Info, Sparkles, Ticket, ShoppingBag } from 'lucide-react';
import TributeBadge from './Header/TributeBadge';
import { useTheme } from './ThemeProvider';
import GriziImg from '@/app/AG.png';
import GriziImgDark from '@/app/AG2.png';

export default function Header() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeGriziImg = mounted && theme === 'dark' ? GriziImgDark : GriziImg;
  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-[#0d0e14] border-b border-gray-200 dark:border-volt/8 shadow-sm dark:shadow-none overflow-x-hidden transition-colors duration-300">
      {/* Red & White Stripe Decoration at the top */}
      <div className="absolute top-0 left-0 w-full h-3 bg-[repeating-linear-gradient(to_right,#b92629,#b92629_75px,#ffffff_75px,#ffffff_150px)] dark-header-stripe"></div>
      <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row md:h-20 items-center justify-between px-2 sm:px-6 lg:px-12 py-4 md:py-0 mt-1.5 gap-y-4 md:gap-y-0">
        {/* Top Section: Logo & Tribute (Mobile) / Logo only (Desktop) */}
        <div className="flex w-full items-center justify-between md:justify-start md:flex-1 gap-2 sm:gap-4 shrink-0">
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group shrink-0">
            <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-aleti-red to-red-600 dark:from-[#111318] dark:to-black dark:border dark:border-volt/20 shadow-lg group-hover:scale-105 transition-transform shrink-0">
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
            <TributeBadge
              key={theme}
              image={activeGriziImg}
              name="Grizi"
              subText="Gracias"
              number="7"
              stats={[
                { label: '출전', value: '501' },
                { label: '골', value: '212' },
                { label: '도움', value: '101' }
              ]}
            />
          </div>
        </div>

        {/* Center Section: Navigation */}
        <nav className="flex items-center justify-center gap-x-2 min-[350px]:gap-x-4 sm:gap-x-6 lg:gap-x-8 xl:gap-x-12 md:flex-1 md:justify-center gap-y-2 text-[11px] min-[350px]:text-[13px] sm:text-sm lg:text-base font-extrabold w-full md:w-auto mt-4 md:mt-0 whitespace-nowrap overflow-visible px-1">
          <Link href="/" className="group flex items-center gap-1 min-[350px]:gap-1.5 lg:gap-2 text-gray-800 dark:text-gray-300 transition-all hover:text-aleti-red dark:hover:text-volt shrink-0">
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
          <div className="hidden lg:block h-6 w-[1px] bg-gray-200 dark:bg-volt/10 mx-1 shrink-0"></div>
          <a
            href="https://en.atleticodemadrid.com/listado-de-entradas"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1 min-[350px]:gap-1.5 lg:gap-2 text-aleti-red dark:text-gray-300 hover:bg-aleti-red dark:hover:bg-volt/10 hover:text-white dark:hover:text-volt px-1.5 min-[350px]:px-2.5 lg:px-4 py-1.5 min-[350px]:py-2 rounded-lg sm:rounded-xl transition-all border border-aleti-red/20 dark:border-volt/10 shadow-sm shadow-aleti-red/5 dark:shadow-none shrink-0"
            title="공식 티켓 예매"
          >
            <Ticket className="w-4 h-4 min-[350px]:w-[18px] min-[350px]:h-[18px] lg:w-5 lg:h-5 group-hover:rotate-12 transition-transform" />
            <span className="tracking-tighter font-extrabold">티켓 예매</span>
          </a>
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
          <TributeBadge
            key={theme}
            image={activeGriziImg}
            name="Grizi"
            subText="Gracias"
            number="7"
            stats={[
              { label: '출전', value: '501' },
              { label: '골', value: '212' },
              { label: '도움', value: '101' }
            ]}
          />
        </div>
      </div>
    </header>
  );
}
