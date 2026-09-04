'use client';

import { useState } from 'react';
import Image from 'next/image';
import mrCry from '../../../public/Mr.cry.png';

export default function TributeBadge() {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="relative group cursor-pointer w-[84px] md:w-[98px] h-12 md:h-14 [perspective:1000px] shrink-0 select-none"
      // 데스크톱은 hover로 뒤집히므로, 모바일에서만 탭으로 뒤집는다
      onClick={() => {
        if (window.innerWidth < 768) setIsFlipped((prev) => !prev);
      }}
    >
      <div
        className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        } md:group-hover:[transform:rotateY(180deg)] md:group-hover:!rotate-y-180`}
      >
        {/* Front: split tribute */}
        <div className="absolute inset-0 [backface-visibility:hidden] bg-white dark:bg-[#0a0b10] rounded-2xl border border-gray-200 dark:border-volt/10 shadow-sm transition-all md:group-hover:border-aleti-red/20 dark:md:group-hover:border-volt/15 overflow-hidden z-10 flex">
          <div className="relative w-[52%] h-full overflow-hidden bg-white dark:bg-[#10151d] -translate-x-[2px]">
            <Image
              src={mrCry}
              alt="Mr. cry tribute"
              fill
              className="object-cover object-center"
              placeholder="blur"
              priority
            />
          </div>

          <div className="flex w-[48%] h-full flex-col justify-center bg-white dark:bg-[#121821] pl-0.5 pr-1 text-left -translate-x-[7px]">
            <span className="text-[8px] md:text-[10px] font-black leading-none tracking-[-0.08em] text-[#0b4dff] dark:text-[#5d8eff]">
              #No.2
            </span>
            <span className="mt-0.5 text-[11px] md:text-[13px] font-black leading-[1.1] tracking-tight text-[#b10d1d] dark:text-[#ff6b75]">
              Gracias
            </span>
            <span className="text-[10px] md:text-[12px] font-bold leading-[1.1] tracking-tight text-gray-900 dark:text-volt">
              Jiménez
            </span>
          </div>
        </div>

        {/* Back: Stats table */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[#b10d1d] dark:bg-[#0a0b10] dark:border dark:border-volt/20 rounded-2xl flex items-center justify-center px-1.5 text-white dark:text-volt shadow-lg z-10">
          <div className="w-full grid grid-cols-3 gap-1 text-center">
            <div className="flex flex-col items-center justify-center leading-none">
              <span className="text-[8px] md:text-[9px] font-bold tracking-tight uppercase text-white/80 dark:text-volt/80">
                경기
              </span>
              <span className="mt-1 text-[12px] md:text-[13px] font-black tracking-tight">
                384
              </span>
            </div>
            <div className="flex flex-col items-center justify-center leading-none">
              <span className="text-[8px] md:text-[9px] font-bold tracking-tight uppercase text-white/80 dark:text-volt/80">
                골
              </span>
              <span className="mt-1 text-[12px] md:text-[13px] font-black tracking-tight">
                14
              </span>
            </div>
            <div className="flex flex-col items-center justify-center leading-none">
              <span className="text-[8px] md:text-[9px] font-bold tracking-tight uppercase text-white/80 dark:text-volt/80">
                도움
              </span>
              <span className="mt-1 text-[12px] md:text-[13px] font-black tracking-tight">
                13
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
