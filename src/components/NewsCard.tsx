import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, User, ImageIcon, Sparkles, Clock } from 'lucide-react';
import { NewsListResponse } from '@/client/types.gen';

interface NewsCardProps {
  news: NewsListResponse;
  showImage?: boolean;
}

export default function NewsCard({ news, showImage = false }: NewsCardProps) {
  const getArticleTypeText = (type: string) => {
    switch(type) {
      case 'WEB_ARTICLE': return '웹 기사';
      case 'SNS_POST': return 'X 기사';
      default: return '기타';
    }
  };

  return (
    <Link 
      href={`/news/${news.id}`} 
      className="group relative flex flex-col sm:flex-row items-start gap-6 sm:gap-10 py-10 sm:py-12 border-b border-gray-100 hover:bg-gray-50/30 transition-all px-4 sm:px-8 rounded-3xl block"
    >
      {/* 이미지 영역 */}
      {showImage && (
        <div className="relative h-48 w-full sm:h-56 sm:w-80 shrink-0 overflow-hidden rounded-2xl bg-gray-100 border border-gray-100 shadow-md group-hover:shadow-xl transition-shadow">
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
            <ImageIcon size={32} className="text-gray-200" />
          </div>
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-black text-aleti-red shadow-sm uppercase tracking-widest border border-white">
              {news.sourceName}
            </span>
          </div>
        </div>
      )}

      {/* 콘텐츠 영역 */}
      <div className="flex flex-col flex-grow min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {/* Article Type Badge (Red) */}
          <span className="text-[10px] font-black text-white bg-aleti-red px-2.5 py-1 rounded-md uppercase tracking-[0.15em] shadow-sm">
            {getArticleTypeText(news.articleType)}
          </span>

          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
            <Clock size={14} />
            <span>{news.publishedAt ? new Date(news.publishedAt).toLocaleDateString('ko-KR') : '날짜 없음'}</span>
          </div>
        </div>
        
        <h3 className="mb-5 text-2xl sm:text-4xl font-black text-gray-900 group-hover:text-aleti-red transition-colors line-clamp-2 leading-[1.15] tracking-tight">
          {news.titleKo}
        </h3>

        {news.summaryKo && (
          <div className="relative mb-6 p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 ai-summary-glow">
            <div className="flex items-center gap-2 mb-2 text-gemini-purple">
              <Sparkles size={14} className="fill-current" />
              <span className="text-[10px] font-black uppercase tracking-widest">Gemini AI Summary</span>
            </div>
            <p className="text-sm sm:text-base text-gray-600 line-clamp-3 font-medium leading-relaxed">
              {news.summaryKo}
            </p>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-gray-100 to-gray-50 border border-gray-200 flex items-center justify-center shadow-sm">
              <User size={14} className="text-gray-400" />
            </div>
            <span className="text-gray-900">{news.sourceName} <span className="text-gray-300 mx-1 font-light">|</span> <span className="text-gray-400 font-medium">에디터</span></span>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-black text-gray-300 group-hover:text-aleti-red transition-all uppercase tracking-[0.2em]">
            <span className="hidden sm:inline">READ STORY</span>
            <div className="p-2 rounded-full border border-gray-100 group-hover:border-aleti-red/20 group-hover:bg-aleti-red/5 transition-colors">
              <ExternalLink size={16} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
