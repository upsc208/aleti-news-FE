import { getNews } from '@/client/sdk.gen';
import NewsCard from '@/components/NewsCard';
import SourceFilter from '@/components/Filters/SourceFilter';
import SearchBar from '@/components/Filters/SearchBar';
import Hero from '@/components/Home/Hero';
import Pagination from '@/components/Pagination';
import { Filter, Newspaper, Sparkles } from 'lucide-react';

export default async function Home({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ page?: string; size?: string; query?: string; sources?: string }>;
}) {
  const searchParams = await searchParamsPromise;
  const page = searchParams.page ? parseInt(searchParams.page) - 1 : 0;
  const size = searchParams.size ? parseInt(searchParams.size) : 10;
  const query = searchParams.query || '';
  const sources = searchParams.sources || '';
  
  let newsData;
  try {
    const response = await getNews({
      query: { 
        page, 
        size, 
        ...(query && { query }),
        ...(sources && { sources }) // 백엔드에서 sources 파라미터를 지원한다고 가정
      }
    } as any); // SDK 타입에 query/sources가 없을 경우를 대비해 as any 처리
    newsData = response.data;
  } catch (error) {
    console.error('Failed to fetch news:', error);
  }

  const newsList = newsData?.content || [];
  const totalPages = newsData?.totalPages || 0;
  const currentPage = (newsData?.number || 0) + 1;

  // 전체 소스 목록 (백엔드에서 전체 소스 목록을 따로 주지 않으므로 현재 리스트에서 추출하거나 별도 API 필요)
  // 여기서는 현재 페이지의 데이터에서 추출하지만, 실제로는 전체 소스 목록 API가 있는 것이 좋습니다.
  const allSources = Array.from(new Set(newsList.map(n => n.sourceName)));

  return (
    <div className="flex flex-col gap-0 pb-32">
      <section className="container mx-auto px-6 lg:px-12 pt-20">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-gray-100 pb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aleti-red/5 text-aleti-red text-[10px] font-black uppercase tracking-widest mb-4">
              Live Feed
            </div>
            <h2 className="text-4xl lg:text-6xl font-black text-gray-900 tracking-tighter uppercase leading-none">
              최신 <span className="text-aleti-red italic">ROJIBLANCO</span> 소식
            </h2>
            <p className="text-lg lg:text-xl text-gray-400 mt-4 tracking-tight font-medium">아틀레티코 마드리드의 실시간 업데이트</p>
          </div>
          <button 
            className="md:hidden flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl"
          >
            <Filter size={18} />
            Filter
          </button>
        </div>

        <SearchBar />

        <div className="flex flex-col md:flex-row gap-16 mt-12">
          <div className="hidden md:block w-80 shrink-0">
             <SourceFilter allSources={allSources} />
          </div>

          <div className="flex flex-col flex-grow min-w-0">
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
          </div>
        </div>
      </section>

      <Hero />
    </div>
  );
}
