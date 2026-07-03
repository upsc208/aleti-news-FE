import Link from 'next/link';
import { ArrowUpRight, ImageIcon, Sparkles } from 'lucide-react';
import { NewsListResponse } from '@/client/types.gen';

interface NewsCardProps {
  news: NewsListResponse;
  showImage?: boolean;
  fromPage?: number;
}

export default function NewsCard({ news, showImage = false, fromPage }: NewsCardProps) {
  // Type assertion for imageUrl since it's missing in NewsListResponse type but expected in data
  const imageUrl = (news as any).imageUrl;

  const publishedAt = news.publishedAt
    ? new Date(news.publishedAt).toLocaleString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' KST'
    : null;

  return (
    <Link
      href={`/news/${news.id}${fromPage ? `?fromPage=${fromPage}` : ''}`}
      id={`news-${news.id}`}
      className="group relative flex flex-col bg-white dark:bg-[#111318] rounded-2xl border border-gray-200/80 dark:border-white/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none hover:border-gray-300 dark:hover:border-volt/20 hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.14)] dark:hover:shadow-black/40 transition-all duration-200 overflow-hidden mb-4 sm:mb-5"
    >
      <div className="p-5 sm:p-6 lg:p-7 flex flex-col sm:flex-row gap-5 sm:gap-7">
        {/* 이미지 영역 - 웹 기사만 표시 */}
        {showImage && news.articleType === 'WEB_ARTICLE' && (
          <div className="relative h-48 w-full sm:h-36 sm:w-52 lg:h-40 lg:w-60 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-[#16181f]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={news.titleKo || ''}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon size={28} className="text-gray-300 dark:text-gray-600" />
              </div>
            )}
          </div>
        )}

        {/* 콘텐츠 영역 */}
        <div className="flex min-w-0 flex-grow flex-col justify-center">
          {/* 메타 정보: 출처 뱃지 · 작성자 · 시간 */}
          <div className="flex min-w-0 items-center gap-2 text-[13px] leading-none">
            <span className="shrink-0 rounded-md bg-aleti-red px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm dark:bg-volt/10 dark:text-volt dark:shadow-none">
              {news.sourceName}
            </span>
            <span className="truncate font-semibold text-aleti-navy dark:text-gray-300">
              {news.authorName || '알레띠 뉴스'}
            </span>
            {publishedAt && (
              <>
                <span className="text-gray-300 dark:text-gray-600" aria-hidden>
                  ·
                </span>
                <time className="shrink-0 whitespace-nowrap text-gray-400 dark:text-gray-500">
                  {publishedAt}
                </time>
              </>
            )}
          </div>

          <h3 className="mt-2.5 text-lg sm:text-xl lg:text-[1.375rem] font-bold leading-[1.45] tracking-[-0.01em] text-gray-900 dark:text-gray-100 line-clamp-2 transition-colors group-hover:text-aleti-red dark:group-hover:text-volt">
            {news.titleKo}
          </h3>

          {news.summaryKo && (
            <p className="mt-2.5 hidden xs:block text-[15px] leading-[1.7] text-gray-600 dark:text-gray-400 line-clamp-2">
              <span className="mr-2 inline-flex translate-y-[1px] items-center gap-1 rounded-md bg-aleti-red/[0.06] dark:bg-volt/[0.08] px-1.5 py-0.5 text-[11px] font-semibold leading-none text-aleti-red dark:text-volt">
                <Sparkles size={11} className="fill-current" />
                AI 요약
              </span>
              {news.summaryKo}
            </p>
          )}

          <div className="mt-4 flex items-center gap-1 text-[13px] font-semibold text-gray-400 dark:text-gray-500 transition-colors group-hover:text-aleti-red dark:group-hover:text-volt">
            자세히 보기
            <ArrowUpRight
              size={14}
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
