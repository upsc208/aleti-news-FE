import { getNews } from '@/client/sdk.gen';
import NewsCard from '@/components/NewsCard';
import FilterSidebar from '@/components/Filters/FilterSidebar';
import SearchBar from '@/components/Filters/SearchBar';
import Hero from '@/components/Home/Hero';
import Slogan from '@/components/Home/Slogan';
import Pagination from '@/components/Pagination';
import { Filter, Newspaper } from 'lucide-react';
import { client } from '@/client/config';

export default async function Home({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ page?: string; size?: string; query?: string }>;
}) {
  const searchParams = await searchParamsPromise;
  const page = searchParams.page ? parseInt(searchParams.page) - 1 : 0;
  const size = searchParams.size ? parseInt(searchParams.size) : 10;
  const query = searchParams.query || '';
  
  let newsData;
  try {
    const response = await getNews({
      query: { page, size, ...(query && { query }) } // 백엔드에서 query 파라미터를 지원한다고 가정
    });
    newsData = response.data;
  } catch (error) {
    console.error('Failed to fetch news:', error);
  }

  const newsList = newsData?.content || [];
  const totalPages = newsData?.totalPages || 0;
  const currentPage = (newsData?.number || 0) + 1;

  // 필터에 필요한 고유 소스 목록 추출
  const allSources = Array.from(new Set(newsList.map(n => n.sourceName)));

  return (
    <div className="flex flex-col gap-0 pb-20">
      <section className="container mx-auto px-4 pt-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
               <div className="h-8 w-2 bg-aleti-red rounded-full"></div>
               최신 로히블랑코 소식
            </h2>
            <p className="text-sm text-gray-400 mt-2 ml-5 tracking-tight font-medium">아틀레티코 마드리드의 실시간 업데이트</p>
          </div>
          {/* 모바일 필터 버튼 (클라이언트 기능이 필요하므로 추후 클라이언트 컴포넌트로 분리 가능) */}
          <button 
            className="md:hidden flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl text-sm font-bold text-gray-700"
          >
            <Filter size={16} />
            필터 설정
          </button>
        </div>

        {/* SearchBar는 클라이언트 컴포넌트여야 함 (입력값 처리) */}
        <SearchBar />

        <div className="flex flex-col md:flex-row gap-8">
          <div className="hidden md:block w-64 shrink-0">
             {/* FilterSidebar도 클라이언트 컴포넌트. 일단 UI만 유지하거나 간단히 처리 */}
             <div className="sticky top-24 space-y-8">
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">출처별 필터</h3>
                  <div className="flex flex-wrap gap-2">
                    {allSources.map(source => (
                      <span key={source} className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-xs font-bold">
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
             </div>
          </div>

          <div className="flex flex-col flex-grow min-w-0">
            {newsList.length > 0 ? (
              <>
                <div className="flex flex-col min-h-[400px]">
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
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-gray-200">
                <Newspaper size={48} className="text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold tracking-tight text-center px-4">
                  등록된 뉴스가 없습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Hero />
      <Slogan />
    </div>
  );
}
