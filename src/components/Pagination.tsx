import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // 현재 페이지 주변의 페이지만 보여주는 로직 (선택적)
  const getVisiblePages = () => {
    if (totalPages <= 7) return pages;
    
    if (currentPage <= 4) return [...pages.slice(0, 5), '...', totalPages];
    if (currentPage >= totalPages - 3) return [1, '...', ...pages.slice(totalPages - 5)];
    
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <nav className="flex items-center justify-center gap-2 mt-16">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:border-aleti-red hover:text-aleti-red disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-400 transition-all bg-white soft-shadow"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="flex items-center gap-1">
        {getVisiblePages().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`
              min-w-[40px] h-10 rounded-xl font-bold text-sm transition-all
              ${currentPage === page 
                ? 'bg-aleti-red text-white shadow-lg shadow-aleti-red/20' 
                : page === '...' 
                  ? 'cursor-default text-gray-300' 
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-aleti-red hover:text-aleti-red'
              }
            `}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:border-aleti-red hover:text-aleti-red disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-400 transition-all bg-white soft-shadow"
      >
        <ChevronRight size={20} />
      </button>
    </nav>
  );
}
