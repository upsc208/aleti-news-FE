'use client';

import { useState } from 'react';
import Image from 'next/image';
import fichadoImg from '@/app/fichado.png';

interface TributeBadgeProps {
  stats?: {
    label: string;
    value: string | number;
  }[];
}

export default function TributeBadge({ stats }: TributeBadgeProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    // Only toggle flip state on mobile (touch devices)
    // Desktop will rely on CSS hover
    if (window.innerWidth < 768) {
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <div
      className="relative group cursor-pointer w-[84px] md:w-[98px] h-12 md:h-14 [perspective:1000px] shrink-0"
      onClick={handleFlip}
    >
      <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''} md:group-hover:[transform:rotateY(180deg)] md:group-hover:!rotate-y-180`}>
        {/* Front: Image only */}
        <div className="absolute inset-0 [backface-visibility:hidden] bg-white dark:bg-[#0a0b10] rounded-2xl border border-gray-100 dark:border-volt/10 shadow-sm transition-all md:group-hover:border-aleti-red/20 dark:md:group-hover:border-volt/15 overflow-hidden">
          <Image
            src={fichadoImg}
            alt="Fichado"
            fill
            className="object-cover object-center"
            placeholder="blur"
            priority
          />
        </div>

        {/* Back: Welcome Message */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-aleti-red dark:bg-[#0a0b10] dark:border dark:border-volt/20 rounded-2xl flex items-center justify-center px-1.5 text-white dark:text-volt shadow-lg">
          <span className="text-[10px] md:text-[12px] font-black tracking-normal text-center leading-none uppercase font-sans">
            ¡BIENVENIDOS!
          </span>
        </div>
      </div>
    </div>
  );
}
