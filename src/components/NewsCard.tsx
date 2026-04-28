import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, User, ImageIcon } from 'lucide-react';
import { NewsListResponse } from '@/client/types.gen';

interface NewsCardProps {
  news: NewsListResponse;
  showImage?: boolean;
}

export default function NewsCard({ news, showImage = false }: NewsCardProps) {
  return (
    <Link href={`/news/${news.id}`} className="group flex items-center gap-3 sm:gap-8 py-5 sm:py-6 border-b border-gray-100 hover:bg-gray-50/50 transition-colors px-2 sm:px-6 -mx-2 sm:-mx-6 rounded-2xl block">
      {/* 이미지 영역 - showImage가 true일 때만 표시 */}
      {showImage && (
        <div className="relative h-20 w-24 sm:h-32 sm:w-52 shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-100 shadow-sm">
          {/* List Response에는 이미지가 없으므로 fallback 표시 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
            <ImageIcon size={20} className="text-gray-200" />
          </div>
        </div>
      )}

      {/* 콘텐츠 영역 */}
      <div className="flex flex-col flex-grow min-w-0">
        <div className="mb-1.5 sm:mb-2 flex items-center gap-2 sm:gap-3">
          <span className="text-[9px] sm:text-[10px] font-bold text-aleti-red bg-aleti-red/5 px-1.5 sm:px-2 py-0.5 rounded uppercase tracking-tighter">
            {news.sourceName}
          </span>
          <div className="h-0.5 w-0.5 sm:h-1 sm:w-1 rounded-full bg-gray-300"></div>
          <span className="text-[10px] sm:text-[11px] font-medium text-gray-400">
            {news.publishedAt ? new Date(news.publishedAt).toLocaleDateString('ko-KR') : '날짜 없음'}
          </span>
        </div>
        
        <h3 className="mb-2 sm:mb-3 text-sm sm:text-xl font-bold text-gray-900 group-hover:text-aleti-red transition-colors line-clamp-2 leading-tight tracking-tight">
          {news.titleKo}
        </h3>

        {news.summaryKo && (
          <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mb-3 font-medium">
            {news.summaryKo}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[12px] font-semibold text-gray-500">
            <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
              <User size={10} className="text-gray-400 sm:size-[12px]" />
            </div>
            <span className="font-medium">알레티 뉴스</span>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold text-gray-400 group-hover:text-aleti-red transition-colors uppercase tracking-widest">
            <span className="hidden sm:inline">상세보기</span>
            <ExternalLink size={12} className="sm:size-[14px]" />
          </div>
        </div>
      </div>
    </Link>
  );
}
