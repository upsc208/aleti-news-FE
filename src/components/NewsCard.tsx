import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, User, ImageIcon } from 'lucide-react';

interface NewsCardProps {
  news: {
    id: string;
    title: string;
    author: string;
    source: string;
    imageUrl?: string;
    publishedAt: string;
  };
}

export default function NewsCard({ news }: NewsCardProps) {
  return (
    <Link href={`/news/${news.id}`} className="group flex items-center gap-4 sm:gap-8 py-6 border-b border-gray-100 hover:bg-gray-50/50 transition-colors px-2 sm:px-6 -mx-2 sm:-mx-6 rounded-2xl block">
      {/* 이미지 영역 */}
      <div className="relative h-20 w-28 sm:h-32 sm:w-52 shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-100 shadow-sm">
        {news.imageUrl ? (
          <Image
            src={news.imageUrl}
            alt={news.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized 
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
            <ImageIcon size={20} className="text-gray-200" />
          </div>
        )}
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex flex-col flex-grow min-w-0">
        <div className="mb-2 flex items-center gap-3">
          <span className="text-[10px] font-bold text-aleti-red bg-aleti-red/5 px-2 py-0.5 rounded uppercase tracking-tighter">
            {news.source}
          </span>
          <div className="h-1 w-1 rounded-full bg-gray-300"></div>
          <span className="text-[11px] font-medium text-gray-400">{news.publishedAt}</span>
        </div>
        
        <h3 className="mb-3 text-base sm:text-xl font-bold text-gray-900 group-hover:text-aleti-red transition-colors line-clamp-2 leading-tight tracking-tight">
          {news.title}
        </h3>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-500">
            <div className="h-6 w-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
              <User size={12} className="text-gray-400" />
            </div>
            <span className="hidden sm:inline font-medium">기자</span> {news.author}
          </div>
          
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 group-hover:text-aleti-red transition-colors uppercase tracking-widest">
            <span className="hidden sm:inline">상세보기</span>
            <ExternalLink size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
}
