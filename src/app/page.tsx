'use client';

import { useState, useMemo } from 'react';
import NewsCard from '@/components/NewsCard';
import { ChevronRight, Newspaper, Filter, X, Search } from 'lucide-react';

const MOCK_NEWS = [
  {
    id: '1',
    title: '아틀레티코 마드리드, 여름 이적시장 미드필더 보강 노린다',
    author: '김알레',
    source: 'MARCA',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop',
    publishedAt: '2시간 전'
  },
  {
    id: '2',
    title: '부상 업데이트: 앙투안 그리즈만, 챔피언스리그 경기 전 복귀 예상',
    author: '이마드리드',
    source: 'AS',
    imageUrl: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=1000&auto=format&fit=crop',
    publishedAt: '5시간 전'
  },
  {
    id: '3',
    title: '사울과 코레아: 시메오네 전술 유연성의 핵심 요인 분석',
    author: '박시메오네',
    source: '알레띠 KR',
    imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1000&auto=format&fit=crop',
    publishedAt: '어제'
  },
  {
    id: '4',
    title: '메트로폴리타노 스타디움, 다음 홈 경기 매진 임박',
    author: '최팬심',
    source: '알레띠 KR',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1000&auto=format&fit=crop',
    publishedAt: '2일 전'
  },
  {
    id: '5',
    title: '유스 아카데미의 신성, 1군 훈련 합류로 기대감 고조',
    author: '정스카우트',
    source: 'Mundo Deportivo',
    imageUrl: 'https://images.unsplash.com/photo-1518091043644-c1d445eb9519?q=80&w=1000&auto=format&fit=crop',
    publishedAt: '3일 전'
  },
  {
    id: '6',
    title: '시메오네 감독 "우리의 철학은 변하지 않는다, 경기마다 결승처럼"',
    author: '김알레',
    source: '알레띠 KR',
    imageUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1000&auto=format&fit=crop',
    publishedAt: '4일 전'
  },
  {
    id: '7',
    title: '[단독] 알레띠 KR, 한국 팬들을 위한 커뮤니티 기능 강화 예고',
    author: '운영진',
    source: '공지사항',
    publishedAt: '방금 전'
  }
];

export default function Home() {
  const allAuthors = useMemo(() => Array.from(new Set(MOCK_NEWS.map(n => n.author))), []);
  const allSources = useMemo(() => Array.from(new Set(MOCK_NEWS.map(n => n.source))), []);

  const [selectedAuthors, setSelectedAuthors] = useState<string[]>(allAuthors);
  const [selectedSources, setSelectedSources] = useState<string[]>(allSources);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const filteredNews = MOCK_NEWS.filter(news => 
    selectedAuthors.includes(news.author) && 
    selectedSources.includes(news.source) &&
    (news.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     news.author.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleAuthor = (author: string) => {
    setSelectedAuthors(prev => 
      prev.includes(author) ? prev.filter(a => a !== author) : [...prev, author]
    );
  };

  const toggleSource = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };

  const resetFilters = () => {
    setSelectedAuthors(allAuthors);
    setSelectedSources(allSources);
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col gap-0 pb-20">
      <section className="container mx-auto px-4 pt-12">
        {/* 상단 타이틀 영역 */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
               <div className="h-8 w-2 bg-aleti-red rounded-full"></div>
               최신 로히블랑코 소식
            </h2>
            <p className="text-sm text-gray-400 mt-2 ml-5 tracking-tight font-medium">아틀레티코 마드리드의 실시간 업데이트</p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl text-sm font-bold text-gray-700"
          >
            <Filter size={16} />
            필터 설정
          </button>
        </div>

        {/* 중앙 검색바 */}
        <div className="max-w-2xl mx-auto mb-12 w-full relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={20} className="text-gray-400" />
          </div>
          <input 
            type="text"
            placeholder="찾으시는 소식의 제목이나 기자 이름을 검색해보세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 soft-shadow focus:outline-none focus:ring-2 focus:ring-aleti-red/20 focus:border-aleti-red transition-all font-medium placeholder:text-gray-400"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* 좌측 필터 사이드바 */}
          <aside className={`
            fixed inset-0 z-50 bg-white p-6 md:relative md:inset-auto md:z-0 md:p-0 md:bg-transparent md:block md:w-64 shrink-0
            transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}>
            <div className="flex items-center justify-between mb-8 md:hidden">
              <h3 className="text-xl font-bold text-gray-900">필터 설정</h3>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8 sticky top-24">
              {/* 기자 필터 */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 soft-shadow">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2 flex justify-between items-center">
                  기자별 필터
                  <span className="text-[10px] text-aleti-red">{selectedAuthors.length} 선택됨</span>
                </h4>
                <div className="space-y-3">
                  {allAuthors.map(author => (
                    <label key={author} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          className="peer appearance-none h-5 w-5 border-2 border-gray-200 rounded-md checked:bg-aleti-red checked:border-aleti-red transition-all"
                          checked={selectedAuthors.includes(author)}
                          onChange={() => toggleAuthor(author)}
                        />
                        <div className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none text-[10px] font-bold">✓</div>
                      </div>
                      <span className="text-sm font-semibold text-gray-600 group-hover:text-aleti-red transition-colors">
                        {author}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 언론사 필터 */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 soft-shadow">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2 flex justify-between items-center">
                  언론사별 필터
                  <span className="text-[10px] text-aleti-red">{selectedSources.length} 선택됨</span>
                </h4>
                <div className="space-y-3">
                  {allSources.map(source => (
                    <label key={source} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          className="peer appearance-none h-5 w-5 border-2 border-gray-200 rounded-md checked:bg-aleti-navy checked:border-aleti-navy transition-all"
                          checked={selectedSources.includes(source)}
                          onChange={() => toggleSource(source)}
                        />
                        <div className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none text-[10px] font-bold">✓</div>
                      </div>
                      <span className="text-sm font-semibold text-gray-600 group-hover:text-aleti-navy transition-colors">
                        {source}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button 
                onClick={resetFilters}
                className="w-full py-3 rounded-xl bg-gray-50 text-gray-400 text-xs font-bold hover:bg-gray-100 hover:text-gray-600 transition-all border border-gray-100"
              >
                필터 및 검색 초기화
              </button>
            </div>
          </aside>

          {/* 메인 뉴스 리스트 */}
          <div className="flex flex-col flex-grow min-w-0">
            {filteredNews.length > 0 ? (
              <div className="flex flex-col">
                {filteredNews.map((news) => (
                  <NewsCard key={news.id} news={news} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-gray-200">
                <Newspaper size={48} className="text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold tracking-tight text-center px-4">
                  {searchQuery ? `'${searchQuery}'에 대한 검색 결과가 없습니다.` : '선택한 필터에 해당하는 뉴스가 없습니다.'}
                </p>
                <button onClick={resetFilters} className="mt-4 text-aleti-red font-bold text-sm underline">전체 뉴스 보기</button>
              </div>
            )}
            
            {filteredNews.length > 0 && (
              <div className="mt-16 flex justify-center">
                <button className="bg-white text-gray-900 px-10 py-4 rounded-xl font-bold border border-gray-200 hover:border-aleti-red hover:text-aleti-red transition-all soft-shadow group">
                  뉴스 더 읽어보기
                  <span className="inline-block transition-transform group-hover:translate-x-1 ml-2">→</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. 웹 소개 섹션 */}
      <section className="bg-white border-y border-gray-100 py-20 mt-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 max-w-6xl mx-auto">
            <div className="max-w-xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aleti-red/5 border border-aleti-red/10 text-aleti-red text-[10px] font-bold mb-6 tracking-widest uppercase">
                About Alleti KR
              </div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
                마드리드의 뜨거운 소식을 <br />
                한국 팬들에게 <span className="text-aleti-red">가장 먼저.</span>
              </h2>
              <p className="text-base text-gray-500 leading-relaxed mb-8">
                알레띠 KR은 정보의 불균형을 해소하기 위해 시작된 비영리 뉴스 포털입니다. 
                현지 매체의 생생한 소식을 선별하여 가장 신속하게 전달합니다.
              </p>
              <div className="flex items-center justify-center lg:justify-start gap-4">
                 <button className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-aleti-navy transition-all flex items-center gap-2 text-sm">
                   서비스 소개 자세히 보기
                   <ChevronRight size={16} />
                 </button>
              </div>
            </div>
            <div className="flex gap-4 opacity-20 hidden sm:flex">
               <Newspaper size={120} className="text-aleti-red" />
               <div className="h-32 w-1.5 bg-aleti-red rounded-full"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
