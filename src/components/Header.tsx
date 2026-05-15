import Link from 'next/link';
import { Newspaper, Info, Sparkles, Ticket, ShoppingBag } from 'lucide-react';
import TributeBadge from './Header/TributeBadge';
import GriziImg from '@/app/AG.png';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      {/* Red & White Stripe Decoration at the top */}
      <div className="absolute top-0 left-0 w-full h-3 bg-[repeating-linear-gradient(to_right,#b92629,#b92629_75px,#ffffff_75px,#ffffff_150px)]"></div>
      <div className="container mx-auto flex flex-col md:flex-row md:h-20 items-center justify-between px-4 sm:px-6 lg:px-6 py-4 md:py-0 mt-1.5 gap-y-4 md:gap-y-0">
        {/* Top Section: Logo & Tribute (Mobile) / Logo only (Desktop) */}
        <div className="flex w-full items-center justify-between md:justify-start md:flex-1 gap-4">
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

          {/* TributeBadge for Mobile only */}
          <div className="md:hidden scale-90 origin-right">
            <TributeBadge 
              image={GriziImg}
              name="Grizi"
              subText="Gracias"
              number="7"
              stats={[
                { label: '출전', value: '499' },
                { label: '골', value: '212' },
                { label: '어시스트', value: '99' }
              ]}
            />
          </div>
        </div>

        <nav className="flex flex-wrap justify-center items-center gap-x-2 sm:gap-x-4 md:gap-x-6 gap-y-2 text-sm md:text-base font-bold w-full md:w-auto">
          <Link href="/" className="group flex items-center gap-1 sm:gap-2 text-gray-600 transition-all hover:text-aleti-red">
            <div className="p-2 rounded-lg group-hover:bg-aleti-red/5 transition-colors">
              <Newspaper size={20} />
            </div>
            <span className="tracking-tight underline-offset-8 decoration-2 hover:underline">뉴스</span>
          </Link>
          <Link href="/about" className="group flex items-center gap-1 sm:gap-2 text-gray-600 transition-all hover:text-aleti-red">
            <div className="p-2 rounded-lg group-hover:bg-aleti-red/5 transition-colors">
              <Info size={20} />
            </div>
            <span className="tracking-tight underline-offset-8 decoration-2 hover:underline">소개</span>
          </Link>
          <div className="hidden sm:block h-6 w-[1px] bg-gray-200 mx-2"></div>
          <a
            href="https://en.atleticodemadrid.com/listado-de-entradas"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-aleti-red hover:bg-aleti-red hover:text-white p-2.5 sm:px-4 sm:py-2 rounded-xl transition-all border border-aleti-red/20 shadow-sm shadow-aleti-red/5"
            title="공식 티켓 예매"
          >
            <Ticket size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline tracking-tight">공식 티켓 예매</span>
          </a>
          <a
            href="https://shop.atleticodemadrid.com/en/home"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-gray-700 hover:bg-gray-900 hover:text-white p-2.5 sm:px-4 sm:py-2 rounded-xl transition-all border border-gray-200 shadow-sm"
            title="공식 스토어"
          >
            <ShoppingBag size={18} className="group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline tracking-tight font-bold">공식 스토어</span>
          </a>
        </nav>

        {/* TributeBadge for Desktop only */}
        <div className="hidden md:flex md:flex-1 justify-end">
          <TributeBadge 
            image={GriziImg}
            name="Grizi"
            subText="Gracias"
            number="7"
            stats={[
              { label: '출전', value: '499' },
              { label: '골', value: '212' },
              { label: '어시스트', value: '99' }
            ]}
          />
        </div>
      </div>
    </header>
  );
}
