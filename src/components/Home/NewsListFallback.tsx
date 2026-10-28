import { Newspaper, Sparkles } from 'lucide-react';
import type { NewsListResponse } from '@/client/types.gen';
import NewsCard from '@/components/NewsCard';

/* 정적 HTML에 담기는 첫 페이지. 주소를 읽는 NewsList가 하이드레이션되기 전까지 이 화면이 보인다 */
export default function NewsListFallback({ news }: { news: NewsListResponse[] }) {
  if (news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-48 bg-white dark:bg-[#111318] rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-white/[0.04] dark-card-pattern relative">
        <div className="relative mb-8 z-10">
          <Newspaper size={80} className="text-gray-100" />
          <Sparkles size={24} className="absolute -top-2 -right-2 text-gray-200 animate-pulse" />
        </div>
        <p className="text-gray-400 dark:text-gray-500 font-black tracking-tight text-center px-4 text-xl uppercase relative z-10">
          등록된 뉴스가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[600px] -mt-10">
      {news.map((item) => (
        <NewsCard key={item.id} news={item} showImage={true} fromPage={1} />
      ))}
    </div>
  );
}
