import { Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#0a0b10] py-24 lg:py-60 transition-colors duration-300">
      {/* Vibrant Navy and Red Aurora for a true Atlético feel */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(226,50,42,0.05)_0%,transparent_50%),radial-gradient(circle_at_100%_100%,rgba(0,69,149,0.05)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_0%_0%,rgba(204,255,0,0.03)_0%,transparent_50%),radial-gradient(circle_at_100%_100%,rgba(0,0,0,0.2)_0%,transparent_50%)] pointer-events-none"></div>

      {/* Smooth transition to blend with white background above and below */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white dark:from-[#0a0b10] to-transparent pointer-events-none z-[1]"></div>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white dark:from-[#0a0b10] to-transparent pointer-events-none z-[1]"></div>

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          <div className="relative mb-8">
            <h2 className="text-4xl sm:text-7xl lg:text-[10rem] font-bebas text-aleti-red dark:text-volt tracking-tighter leading-[0.85] italic px-2">
              "GANAR, GANAR, GANAR <br />
              Y VOLVER A GANAR."
            </h2>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="text-2xl sm:text-4xl lg:text-6xl font-bebas text-aleti-navy dark:text-gray-200 italic drop-shadow-sm">
              Luis Aragonés
            </p>
            <div className="h-1.5 w-24 sm:h-2 sm:w-40 bg-gradient-to-r from-aleti-red via-aleti-white to-aleti-navy dark:from-volt dark:via-[#111318] dark:to-volt rounded-full"></div>
          </div>

          <p className="text-xl sm:text-3xl lg:text-4xl text-aleti-navy/80 dark:text-blue-300/80 leading-relaxed mt-10 sm:mt-20 max-w-3xl font-black tracking-tight px-4">
            이기고, 이기고, 또 이기고, <span className="text-aleti-red dark:text-volt underline decoration-4 dark:decoration-volt/50 underline-offset-8">다시 이기는 것.</span>
          </p>
        </div>
      </div>

      {/* Madrid Symbol: El Oso y el Madroño (The Bear and the Strawberry Tree) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none w-[500px] lg:w-[800px] dark:opacity-[0.03]">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-aleti-navy dark:text-volt">
          {/* Tree Canopy */}
          <circle cx="65" cy="35" r="20" fill="currentColor" fillOpacity="0.4" />
          <circle cx="50" cy="25" r="15" fill="currentColor" fillOpacity="0.6" />
          <circle cx="75" cy="25" r="12" fill="currentColor" fillOpacity="0.5" />

          {/* Trunk */}
          <path d="M60 85 V50 Q60 40 55 35" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />

          {/* The Bear (Silhouette) */}
          <path d="M25 85 
                   L30 65 
                   Q32 55 40 50 
                   L48 45 
                   L52 40 
                   Q55 35 52 30 
                   L47 28 
                   Q42 26 38 31 
                   L33 40 
                   L22 50 
                   Q18 55 20 65 
                   L22 85 Z"
            fill="currentColor" />

          {/* Base */}
          <path d="M15 85 H85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        </svg>
      </div>

      {/* Side Color Stripes */}
      <div className="absolute left-0 top-0 h-full w-2 bg-aleti-red dark:bg-volt opacity-10"></div>
      <div className="absolute right-0 top-0 h-full w-2 bg-aleti-navy dark:bg-black opacity-10"></div>
    </section>
  );
}
