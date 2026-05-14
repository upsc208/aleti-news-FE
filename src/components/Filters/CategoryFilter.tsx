'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { 
  LayoutGrid, 
  ArrowLeftRight, 
  Trophy, 
  Megaphone, 
  Stethoscope, 
  Mic2, 
  ClipboardList, 
  MoreHorizontal 
} from 'lucide-react';

const categories = [
  { id: 'all', label: '전체', icon: LayoutGrid },
  { id: '이적시장', label: '이적시장', icon: ArrowLeftRight },
  { id: '경기리뷰', label: '경기리뷰', icon: Trophy },
  { id: '오피셜', label: '오피셜', icon: Megaphone },
  { id: '부상/명단', label: '부상/명단', icon: Stethoscope },
  { id: '인터뷰', label: '인터뷰', icon: Mic2 },
  { id: '예상라인업', label: '예상라인업', icon: ClipboardList },
  { id: '기타', label: '기타', icon: MoreHorizontal },
];

export default function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category') || 'all';

  const handleCategoryChange = (categoryId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId === 'all') {
      params.delete('category');
    } else {
      params.set('category', categoryId);
    }
    params.set('page', '1'); // 카테고리 변경 시 1페이지로 이동
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="w-full mb-8 overflow-x-auto pb-2 scrollbar-hide">
      <div className="flex items-center justify-start md:justify-center gap-2 min-w-max px-1">
        {categories.map((category) => {
          const isActive = currentCategory === category.id;
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`
                flex items-center gap-3 px-7 py-3.5 rounded-full text-base font-black transition-all whitespace-nowrap
                ${isActive
                  ? 'bg-aleti-red text-white shadow-xl shadow-aleti-red/20 scale-105'
                  : 'bg-white border border-gray-100 text-gray-500 hover:border-aleti-red/30 hover:text-aleti-red hover:bg-aleti-red/5'}
              `}
            >
              <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-aleti-red'} />
              {category.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
