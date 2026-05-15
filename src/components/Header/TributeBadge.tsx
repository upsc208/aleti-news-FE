'use client';

import { useState } from 'react';
import Image, { StaticImageData } from 'next/image';

interface TributeBadgeProps {
  image: StaticImageData | string;
  name: string;
  subText: string;
  number?: string;
  stats: {
    label: string;
    value: string | number;
  }[];
}

export default function TributeBadge({ image, name, subText, number, stats }: TributeBadgeProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="relative group cursor-pointer w-48 h-14 [perspective:1000px] shrink-0"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''} md:group-hover:[transform:rotateY(180deg)]`}>
        {/* Front: Image + Text */}
        <div className="absolute inset-0 [backface-visibility:hidden] flex items-center gap-3 bg-white px-3 rounded-2xl border border-gray-100 shadow-sm transition-all md:group-hover:border-aleti-red/20">
          <div className="relative h-11 w-11 grayscale md:group-hover:grayscale-0 transition-all duration-500 shrink-0">
            <Image
              src={image}
              alt={name}
              fill
              className="object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none md:group-hover:text-aleti-red transition-colors">
              {subText}
            </span>
            <span className="text-base font-black text-gray-900 uppercase tracking-tighter leading-none mt-1 whitespace-nowrap">
              {name} {number && <span className="text-blue-700 italic">#{number}</span>}
            </span>
          </div>
        </div>

        {/* Back: Stats */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-aleti-red rounded-2xl flex items-center justify-around px-2 text-white shadow-lg">
          {stats.map((stat, idx) => (
            <div key={stat.label} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-black opacity-80 uppercase tracking-widest">{stat.label}</span>
                <span className="text-base font-black tracking-tighter">{stat.value}</span>
              </div>
              {idx < stats.length - 1 && <div className="w-px h-6 bg-white/20 ml-2"></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
