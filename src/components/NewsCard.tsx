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
    switch (type) {
      case 'WEB_ARTICLE': return '웹 기사';
      case 'SNS_POST': return 'X 기사';
      default: return '기타';
    }
  };

  // Type assertion for imageUrl since it's missing in NewsListResponse type but expected in data
  const imageUrl = (news as any).imageUrl;

  return (
    <Link
      href={`/news/${news.id}`}
      className="group relative flex flex-col bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden mb-6 sm:mb-8"
    >
      {/* 상단 액센트 라인 */}
      <div className="h-1.5 w-full bg-gradient-to-r from-aleti-red via-aleti-red/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-5 sm:p-6 lg:p-7 flex flex-col sm:flex-row gap-5 sm:gap-6">
        {/* 이미지 영역 - 웹 기사만 표시 */}
        {showImage && news.articleType === 'WEB_ARTICLE' && (
          <div className="relative h-48 w-full sm:h-40 sm:w-48 lg:h-48 lg:w-64 shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-100 shadow-inner group/img">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={news.titleKo || ''}
                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
                <ImageIcon size={32} className="text-gray-200" />
              </div>
            )}
          </div>
        )}

        {/* 콘텐츠 영역 */}
        <div className="flex flex-col flex-grow min-w-0 justify-center">
          <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] lg:text-[12px] font-black text-white bg-aleti-red px-2 py-1 rounded-md uppercase tracking-[0.1em] shadow-md border border-aleti-red/20">
                {news.sourceName}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] lg:text-[12px] font-black text-aleti-navy uppercase tracking-tight">
              <User size={14} className="text-aleti-red" />
              <span className="truncate max-w-[80px] sm:max-w-none">{news.authorName || '알레띠 뉴스'}</span>
            </div>

            <div className="w-1 h-1 rounded-full bg-gray-200 hidden xs:block" />

            <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] lg:text-[12px] font-bold text-gray-600">
              <Clock size={14} className="text-gray-400" />
              <span className="whitespace-nowrap">
                {news.publishedAt
                  ? new Date(news.publishedAt).toLocaleString('ko-KR', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  }) + ' KST'
                  : '날짜 없음'}
              </span>
            </div>
          </div>

          <h3 className="mb-3 text-lg sm:text-xl lg:text-3xl font-black text-gray-900 group-hover:text-aleti-red transition-colors line-clamp-2 leading-tight tracking-tight">
            {news.titleKo}
          </h3>

          {news.summaryKo && (
            <div className="relative p-4 sm:p-5 rounded-2xl bg-gray-50/50 border border-gray-100/50 group-hover:border-aleti-red/10 transition-all hidden xs:block">
              <div className="flex items-center gap-2 mb-2 text-aleti-red/60">
                <Sparkles size={14} className="fill-current" />
                <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest">AI Summary</span>
              </div>
              <p className="text-sm lg:text-base text-gray-600 line-clamp-2 font-medium leading-relaxed">
                {news.summaryKo}
              </p>
            </div>
          )}

          <div className="mt-4 lg:mt-6 flex items-center gap-2 text-[10px] lg:text-[11px] font-black text-aleti-red opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all sm:translate-y-2 group-hover:translate-y-0 uppercase tracking-[0.2em]">
            <span>Read Full Story</span>
            <ExternalLink size={12} />
          </div>
        </div>
      </div>
    </Link>
  );
}
