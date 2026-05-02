import Link from 'next/link';
import { Newspaper, Info, Sparkles, Ticket, ShoppingBag } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      {/* Red & White Stripe Decoration at the top */}
      <div className="absolute top-0 left-0 w-full h-3 bg-[repeating-linear-gradient(to_right,#b92629,#b92629_75px,#ffffff_75px,#ffffff_150px)]"></div>
      <div className="container mx-auto flex h-20 items-center justify-between px-6 lg:px-12 mt-1.5">
        <div className="flex flex-1 items-center gap-4">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-aleti-red to-red-600 shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-sm font-black text-white italic">KR</span>
              <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gemini-purple text-white shadow-sm">
                <Sparkles size={8} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-gray-900 uppercase leading-none">
                ATLÉTI <span className="text-aleti-red">NEWS</span>
              </span>
              <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase leading-none mt-1">
                알레띠 최신 소식
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex justify-center items-center space-x-6 text-base font-bold">
          <Link href="/" className="group flex items-center gap-2 text-gray-600 transition-all hover:text-aleti-red">
            <div className="p-2 rounded-lg group-hover:bg-aleti-red/5 transition-colors">
              <Newspaper size={20} />
            </div>
            <span className="tracking-tight underline-offset-8 decoration-2 hover:underline">뉴스</span>
          </Link>
          <Link href="/about" className="group flex items-center gap-2 text-gray-600 transition-all hover:text-aleti-red">
            <div className="p-2 rounded-lg group-hover:bg-aleti-red/5 transition-colors">
              <Info size={20} />
            </div>
            <span className="tracking-tight underline-offset-8 decoration-2 hover:underline">소개</span>
          </Link>
          <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>
          <a
            href="https://en.atleticodemadrid.com/listado-de-entradas"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-aleti-red hover:bg-aleti-red hover:text-white px-4 py-2 rounded-xl transition-all border border-aleti-red/20 shadow-sm shadow-aleti-red/5"
          >
            <Ticket size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="tracking-tight">공식 티켓 예매</span>
          </a>
          <a
            href="https://shop.atleticodemadrid.com/en/home"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-gray-700 hover:bg-gray-900 hover:text-white px-4 py-2 rounded-xl transition-all border border-gray-200 shadow-sm"
          >
            <ShoppingBag size={18} className="group-hover:scale-110 transition-transform" />
            <span className="tracking-tight font-bold">공식 스토어</span>
          </a>
        </nav>

        {/* Right side Beta Badge */}
        <div className="hidden lg:flex flex-1 items-center justify-end">
          <div className="relative group cursor-default">
            {/* Soft background glow */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-aleti-red to-orange-400 rounded-full blur-md opacity-40 group-hover:opacity-80 transition duration-500"></div>
            {/* Badge body */}
            <div className="relative px-5 py-2.5 rounded-full bg-gradient-to-r from-aleti-red via-rose-500 to-orange-500 border border-white/20 text-white shadow-xl flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-white drop-shadow-md">
                BETA
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
