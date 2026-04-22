import Link from 'next/link';
import { Newspaper, Info } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 border-b border-gray-100 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-aleti-red">
               <span className="text-xs font-bold text-white">KR</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              알레띠 <span className="text-aleti-red">KR</span>
            </span>
          </Link>
        </div>
        
        <nav className="flex items-center space-x-6 text-sm font-semibold">
          <Link href="/" className="flex items-center gap-1.5 text-gray-600 transition-colors hover:text-aleti-red">
            <Newspaper size={18} />
            <span>뉴스</span>
          </Link>
          <Link href="/about" className="flex items-center gap-1.5 text-gray-600 transition-colors hover:text-aleti-red">
            <Info size={18} />
            <span>소개</span>
          </Link>
        </nav>

        <div className="hidden sm:block">
           <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
             Uno di Noi
           </span>
        </div>
      </div>
    </header>
  );
}
