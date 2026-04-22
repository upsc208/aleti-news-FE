'use client';

import { useState, useMemo, useEffect } from 'react';
import NewsCard from '@/components/NewsCard';
import FilterSidebar from '@/components/Filters/FilterSidebar';
import SearchBar from '@/components/Filters/SearchBar';
import Hero from '@/components/Home/Hero';
import Slogan from '@/components/Home/Slogan';
import Pagination from '@/components/Pagination';
import { Filter, Newspaper } from 'lucide-react';
import { MOCK_NEWS } from '@/data/mockNews';

const ITEMS_PER_PAGE = 5; // 한 페이지당 5개의 기사 (테스트를 위해 적은 숫자로 설정)

export default function Home() {
  const allAuthors = useMemo(() => Array.from(new Set(MOCK_NEWS.map(n => n.author))), []);
  const allSources = useMemo(() => Array.from(new Set(MOCK_NEWS.map(n => n.source))), []);

  const [selectedAuthors, setSelectedAuthors] = useState<string[]>(allAuthors);
  const [selectedSources, setSelectedSources] = useState<string[]>(allSources);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 필터링된 뉴스 리스트
  const filteredNews = useMemo(() => {
    return MOCK_NEWS.filter(news => 
      selectedAuthors.includes(news.author) && 
      selectedSources.includes(news.source) &&
      (news.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
       news.author.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [selectedAuthors, selectedSources, searchQuery]);

  // 현재 페이지에 보여줄 뉴스 슬라이싱
  const currentNews = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNews.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredNews, currentPage]);

  const totalPages = Math.ceil(filteredNews.length / ITEMS_PER_PAGE);

  // 필터나 검색어가 바뀔 때 1페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAuthors, selectedSources, searchQuery]);

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
    setCurrentPage(1);
  };

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
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl text-sm font-bold text-gray-700"
          >
            <Filter size={16} />
            필터 설정
          </button>
        </div>

        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <div className="flex flex-col md:flex-row gap-8">
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

          <div className="flex flex-col flex-grow min-w-0">
            {currentNews.length > 0 ? (
              <>
                <div className="flex flex-col min-h-[400px]">
                  {currentNews.map((news) => (
                    <NewsCard key={news.id} news={news} />
                  ))}
                </div>
                
                {/* 페이지네이션 컴포넌트 */}
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 400, behavior: 'smooth' }); // 페이지 이동 시 리스트 상단으로 이동
                  }}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-gray-200">
                <Newspaper size={48} className="text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold tracking-tight text-center px-4">
                  {searchQuery ? `'${searchQuery}'에 대한 검색 결과가 없습니다.` : '선택한 필터에 해당하는 뉴스가 없습니다.'}
                </p>
                <button onClick={resetFilters} className="mt-4 text-aleti-red font-bold text-sm underline">전체 뉴스 보기</button>
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
