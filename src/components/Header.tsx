import Link from 'next/link';
import { Newspaper, Trophy, Users } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-aleti-white/95 backdrop-blur supports-[backdrop-filter]:bg-aleti-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-aleti-red shadow-lg transition-transform hover:scale-105">
              <span className="text-xl font-bold text-white">S-C</span>
            </div>
            <span className="hidden text-xl font-bold tracking-tight text-aleti-navy sm:inline-block">
              Saúl-Correa <span className="text-aleti-red">Bridge</span>
            </span>
          </Link>
        </div>
        
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link href="/" className="flex items-center gap-1 text-aleti-navy transition-colors hover:text-aleti-red">
            <Newspaper size={18} />
            <span>News</span>
          </Link>
          <Link href="/team" className="flex items-center gap-1 text-aleti-navy/70 transition-colors hover:text-aleti-red">
            <Users size={18} />
            <span>Squad</span>
          </Link>
          <Link href="/matches" className="flex items-center gap-1 text-aleti-navy/70 transition-colors hover:text-aleti-red">
            <Trophy size={18} />
            <span>Matches</span>
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <button className="rounded-full bg-aleti-navy px-4 py-2 text-xs font-bold text-white transition-all hover:bg-aleti-red hover:shadow-md">
            Login
          </button>
        </div>
      </div>
      {/* Red & White Stripes Decoration */}
      <div className="h-1 w-full bg-gradient-to-r from-aleti-red via-white to-aleti-red"></div>
    </header>
  );
}
