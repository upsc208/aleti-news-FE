import { getNews, getSources, getRecentMatch, getUpcomingMatches } from '@/client/sdk.gen';
import NewsCard from '@/components/NewsCard';
import SourceFilter from '@/components/Filters/SourceFilter';
import MobileFilterDrawer from '@/components/Filters/MobileFilterDrawer';
import NewsFeedContainer from '@/components/Home/NewsFeedContainer';
import SearchBar from '@/components/Filters/SearchBar';
import Hero from '@/components/Home/Hero';
import Pagination from '@/components/Pagination';
import { Filter, Newspaper, Sparkles } from 'lucide-react';
import MatchResultCard from '@/components/Home/MatchResultCard';

export default async function Home({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ page?: string; size?: string; query?: string; sources?: string }>;
}) {
  const searchParams = await searchParamsPromise;
  const page = searchParams.page ? parseInt(searchParams.page) - 1 : 0;
  const size = searchParams.size ? parseInt(searchParams.size) : 10;
  const query = searchParams.query || '';
  const sourcesParam = searchParams.sources || '';
  const sources = sourcesParam ? sourcesParam.split(',') : [];

  let newsData;
  let sourcesData: any[] = [];
  let recentMatchData = null;
  let upcomingMatchesData: any[] = [];

  try {
    // Fetch news and sources in parallel
    const [newsResponse, sourcesResponse, recentMatchResponse, upcomingMatchesResponse] = await Promise.all([
      getNews({
        query: {
          page: query ? 0 : page,
          size: query ? 100 : size, // 임시로 클라이언트 측 검색을 위해 크게 잡음
          ...(sourcesParam && sourcesParam !== 'none' && { sources })
        }
      } as any),
      getSources(),
      getRecentMatch(),
      getUpcomingMatches()
    ]);

    newsData = newsResponse.data;
    sourcesData = sourcesResponse.data || [];
    recentMatchData = recentMatchResponse.data || null;
    upcomingMatchesData = upcomingMatchesResponse.data || [];
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }

  let newsList = newsData?.content || [];
  let totalPages = newsData?.totalPages || 0;
  const currentPage = (newsData?.number || 0) + 1;

  // 임시 클라이언트 사이드 검색 필터링 로직 (백엔드 지원 전까지)
  if (query) {
    const q = query.toLowerCase();
    newsList = newsList.filter((news: any) => 
      news.titleKo?.toLowerCase().includes(q) || 
      news.summaryKo?.toLowerCase().includes(q) ||
      news.authorName?.toLowerCase().includes(q)
    );
    totalPages = 1;
  }

  return (
    <div className="flex flex-col gap-0">
      <section className="container mx-auto px-6 lg:px-12 pt-20">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-gray-100 pb-10">
          <div className="w-full">
            <MatchResultCard recentMatch={recentMatchData} upcomingMatches={upcomingMatchesData} />
          </div>
          <MobileFilterDrawer allSources={sourcesData} />
        </div>

        <SearchBar />

        <NewsFeedContainer sourcesData={sourcesData}>
          {newsList.length > 0 ? (
            <>
              <div className="flex flex-col min-h-[600px] -mt-10">
                {newsList.map((news) => (
                  <NewsCard key={news.id} news={news} showImage={false} />
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-48 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
              <div className="relative mb-8">
                <Newspaper size={80} className="text-gray-100" />
                <Sparkles size={24} className="absolute -top-2 -right-2 text-gray-200 animate-pulse" />
              </div>
              <p className="text-gray-400 font-black tracking-tight text-center px-4 text-xl uppercase">
                등록된 뉴스가 없습니다.
              </p>
            </div>
          )}
        </NewsFeedContainer>
      </section>

      <Hero />
    </div>
  );
}
