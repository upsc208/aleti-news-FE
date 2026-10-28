'use client';

/* 홈 기사 목록. 쿼리가 없으면 서버가 준 첫 페이지를 그대로 쓰고, 필터가 걸리면 브라우저가 직접 가져온다 */
import { useEffect, useState } from 'react';
import { Newspaper, Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { getNews } from '@/client/sdk.gen';
import type { NewsListResponse } from '@/client/types.gen';
import NewsCard from '@/components/NewsCard';
import Pagination from '@/components/Pagination';
import NewsListSkeleton from '@/components/Home/NewsListSkeleton';

interface Props {
  initialNews: NewsListResponse[];
  initialTotalPages: number;
}

interface Loaded {
  key: string;
  news: NewsListResponse[];
  totalPages: number;
  page: number;
}

const DEFAULT_SIZE = 10;

// 주소의 쿼리를 백엔드 파라미터로. 페이지는 화면이 1부터, API가 0부터 센다
function toQuery(searchParams: URLSearchParams) {
  const category = searchParams.get('category') ?? '';
  const sources = searchParams.get('sources') ?? '';

  return {
    page: Math.max((Number(searchParams.get('page')) || 1) - 1, 0),
    size: Number(searchParams.get('size')) || DEFAULT_SIZE,
    search: searchParams.get('query') ?? '',
    isHyped: searchParams.get('isHyped') === 'true',
    ...(category && category !== 'all' ? { category } : {}),
    ...(sources && sources !== 'none' ? { sources: sources.split(',') } : {}),
  };
}

export default function NewsList({ initialNews, initialTotalPages }: Props) {
  const searchParams = useSearchParams();
  const key = searchParams.toString();
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  // 쿼리가 없으면 서버가 준 목록이 곧 정답이라 아무것도 부르지 않는다
  const usesServerData = key.length === 0;

  useEffect(() => {
    if (usesServerData) return;

    let cancelled = false;
    const query = toQuery(new URLSearchParams(key));

    getNews({ query })
      .then(({ data }) => {
        if (cancelled) return;
        setLoaded({
          key,
          news: Array.isArray(data?.content) ? data.content : [],
          totalPages: data?.totalPages ?? 0,
          page: (data?.number ?? 0) + 1,
        });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key, news: [], totalPages: 0, page: 1 });
      });

    return () => {
      cancelled = true;
    };
  }, [key, usesServerData]);

  if (!usesServerData && loaded?.key !== key) return <NewsListSkeleton />;

  const news = usesServerData ? initialNews : loaded!.news;
  const totalPages = usesServerData ? initialTotalPages : loaded!.totalPages;
  const currentPage = usesServerData ? 1 : loaded!.page;

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
    <>
      <div className="flex flex-col min-h-[600px] -mt-10">
        {news.map((item) => (
          <NewsCard key={item.id} news={item} showImage={true} fromPage={currentPage} />
        ))}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </>
  );
}
