import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getNews, getSources, getRecentMatch, getUpcomingMatches, getHeadlines } from '@/client/sdk.gen';
import type { HeadlineResponse, NewsListResponse, NewsSource, RecentMatch, UpcomingMatch } from '@/client/types.gen';
import MobileFilterDrawer from '@/components/Filters/MobileFilterDrawer';
import NewsFeedContainer from '@/components/Home/NewsFeedContainer';
import NewsList from '@/components/Home/NewsList';
import NewsListFallback from '@/components/Home/NewsListFallback';
import SearchBar from '@/components/Filters/SearchBar';
import CategoryFilter from '@/components/Filters/CategoryFilter';
import MatchResultCard from '@/components/Home/MatchResultCard';

// 수집이 15분 주기라 그보다 자주 다시 만들 이유가 없다
export const revalidate = 900;

// 필터·페이지가 붙은 주소가 전부 홈의 중복으로 잡히지 않게 한 곳을 가리킨다
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const DEFAULT_SIZE = 10;

export default async function Home() {
  let newsList: NewsListResponse[] = [];
  let totalPages = 0;
  let sourcesData: NewsSource[] = [];
  let recentMatchData: RecentMatch | null = null;
  let upcomingMatchesData: UpcomingMatch[] = [];
  let headlinesData: HeadlineResponse[] = [];

  try {
    const [news, sources, recentMatch, upcomingMatches, headlines] = await Promise.all([
      getNews({ query: { page: 0, size: DEFAULT_SIZE } }),
      getSources(),
      getRecentMatch(),
      getUpcomingMatches(),
      getHeadlines(),
    ]);

    newsList = Array.isArray(news.data?.content) ? news.data.content : [];
    totalPages = news.data?.totalPages ?? 0;
    sourcesData = Array.isArray(sources.data) ? sources.data : [];
    recentMatchData = recentMatch.data ?? null;
    upcomingMatchesData = Array.isArray(upcomingMatches.data) ? upcomingMatches.data : [];
    headlinesData = Array.isArray(headlines.data) ? headlines.data : [];
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }

  return (
    <div className="flex flex-col gap-0">
      <section className="container mx-auto px-6 lg:px-12 pt-20 pb-24">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-gray-100 dark:border-volt/5 pb-10">
          <div className="w-full">
            <MatchResultCard
              recentMatch={recentMatchData}
              upcomingMatches={upcomingMatchesData}
              headlines={headlinesData}
            />
          </div>
          <MobileFilterDrawer allSources={sourcesData} />
        </div>

        {/* 주소의 쿼리를 읽는 컴포넌트는 Suspense 안에 둬야 페이지가 정적으로 남는다 */}
        <div id="news-section" className="scroll-mt-36 md:scroll-mt-24">
          <Suspense fallback={null}>
            <SearchBar />
          </Suspense>
          <Suspense fallback={null}>
            <CategoryFilter />
          </Suspense>
        </div>

        <NewsFeedContainer sourcesData={sourcesData}>
          <Suspense fallback={<NewsListFallback news={newsList} />}>
            <NewsList initialNews={newsList} initialTotalPages={totalPages} />
          </Suspense>
        </NewsFeedContainer>
      </section>
    </div>
  );
}
