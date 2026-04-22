'use client';

import { useState, useMemo } from 'react';
import NewsCard from '@/components/NewsCard';
import FilterSidebar from '@/components/Filters/FilterSidebar';
import SearchBar from '@/components/Filters/SearchBar';
import Hero from '@/components/Home/Hero';
import Slogan from '@/components/Home/Slogan';
import { Filter, Newspaper } from 'lucide-react';
import { MOCK_NEWS } from '@/data/mockNews';

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
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl text-sm font-bold text-gray-700"
          >
            <Filter size={16} />
            필터 설정
          </button>
        </div>

        {/* 중앙 검색바 컴포넌트 */}
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <div className="flex flex-col md:flex-row gap-8">
          {/* 필터 사이드바 컴포넌트 */}
          <FilterSidebar 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            allAuthors={allAuthors}
            allSources={allSources}
            selectedAuthors={selectedAuthors}
            selectedSources={selectedSources}
            onToggleAuthor={toggleAuthor}
            onToggleSource={toggleSource}
            onReset={resetFilters}
          />

          {/* 메인 뉴스 리스트 영역 */}
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

      {/* 홈 페이지 섹션 컴포넌트들 */}
      <Hero />
      <Slogan />
    </div>
  );
}
