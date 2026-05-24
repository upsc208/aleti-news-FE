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
      className="group relative flex flex-col bg-white dark:bg-[#111318] rounded-3xl border border-gray-100 dark:border-white/[0.04] shadow-sm dark:shadow-none hover:shadow-xl dark:hover:shadow-black/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden mb-6 sm:mb-8 dark-card-pattern volt-hover-glow"
    >
      {/* 상단 액센트 라인 */}
      <div className="h-1.5 w-full bg-gradient-to-r from-aleti-red via-aleti-red/50 to-transparent dark:from-volt/60 dark:via-volt/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10 p-5 sm:p-6 lg:p-7 flex flex-col sm:flex-row gap-5 sm:gap-6">
        {/* 이미지 영역 - 웹 기사만 표시 */}
        {showImage && news.articleType === 'WEB_ARTICLE' && (
          <div className="relative h-48 w-full sm:h-40 sm:w-48 lg:h-48 lg:w-64 shrink-0 overflow-hidden rounded-xl bg-gray-50 dark:bg-[#16181f] border border-gray-100 dark:border-white/[0.04] shadow-inner group/img">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={news.titleKo || ''}
                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-[#16181f]">
                <ImageIcon size={32} className="text-gray-200" />
              </div>
            )}
          </div>
        )}

        {/* 콘텐츠 영역 */}
        <div className="flex flex-col flex-grow min-w-0 justify-center">
          <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-[12px] lg:text-[13px] font-bebas text-white dark:text-volt bg-aleti-red dark:bg-black dark:border dark:border-volt/25 px-2.5 py-1 rounded-sm uppercase tracking-wider shadow-sm">
                {news.sourceName}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] lg:text-[13px] font-extrabold text-aleti-navy dark:text-volt/60 uppercase tracking-tighter">
              <User size={14} className="text-aleti-red dark:text-volt/70" />
              <span className="truncate max-w-[80px] sm:max-w-none font-kanit">{news.authorName || '알레띠 뉴스'}</span>
            </div>

            <div className="w-1 h-1 rounded-full bg-gray-200 hidden xs:block" />

            <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] lg:text-[13px] font-bold text-gray-500 font-kanit">
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

          <h3 className="mb-4 text-xl sm:text-2xl lg:text-4xl font-bebas text-gray-950 dark:text-gray-100 group-hover:text-aleti-red dark:group-hover:text-volt transition-colors line-clamp-2 leading-[1.1] tracking-normal">
            {news.titleKo}
          </h3>

          {news.summaryKo && (
            <div className="relative p-4 sm:p-5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border-l-4 border-aleti-red/30 dark:border-volt/20 group-hover:border-aleti-red/60 dark:group-hover:border-volt/40 transition-all hidden xs:block shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-aleti-red dark:text-volt">
                <Sparkles size={14} className="fill-current" />
                <span className="text-[10px] lg:text-[11px] font-bebas tracking-widest uppercase">AI Summary</span>
              </div>
              <p className="text-sm lg:text-[1.05rem] text-gray-700 dark:text-gray-300 line-clamp-2 font-semibold leading-relaxed font-kanit">
                {news.summaryKo}
              </p>
            </div>
          )}

          <div className="mt-5 lg:mt-7 flex items-center gap-2 text-[11px] lg:text-[12px] font-bebas text-aleti-red dark:text-volt/70 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all sm:translate-y-2 group-hover:translate-y-0 uppercase tracking-widest">
            <span>Read Full Story</span>
            <ExternalLink size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
}
