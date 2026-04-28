import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const getVisiblePages = () => {
    if (totalPages <= 7) return pages;
    
    if (currentPage <= 4) return [...pages.slice(0, 5), '...', totalPages];
    if (currentPage >= totalPages - 3) return [1, '...', ...pages.slice(totalPages - 5)];
    
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const createPageUrl = (page: number) => {
    return `?page=${page}`;
  };

  return (
    <nav className="flex items-center justify-center gap-2 mt-16">
      {currentPage === 1 ? (
        <div className="p-2 rounded-xl border border-gray-200 text-gray-400 opacity-30 bg-white">
          <ChevronLeft size={20} />
        </div>
      ) : (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:border-aleti-red hover:text-aleti-red transition-all bg-white soft-shadow"
        >
          <ChevronLeft size={20} />
        </Link>
      )}

      <div className="flex items-center gap-1">
        {getVisiblePages().map((page, index) => (
          page === '...' ? (
            <span key={index} className="min-w-[40px] h-10 flex items-center justify-center text-gray-300 font-bold">
              ...
            </span>
          ) : (
            <Link
              key={index}
              href={createPageUrl(page as number)}
              className={`
                flex items-center justify-center min-w-[40px] h-10 rounded-xl font-bold text-sm transition-all
                ${currentPage === page 
                  ? 'bg-aleti-red text-white shadow-lg shadow-aleti-red/20' 
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-aleti-red hover:text-aleti-red'
                }
              `}
            >
              {page}
            </Link>
          )
        ))}
      </div>

      {currentPage === totalPages ? (
        <div className="p-2 rounded-xl border border-gray-200 text-gray-400 opacity-30 bg-white">
          <ChevronRight size={20} />
        </div>
      ) : (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:border-aleti-red hover:text-aleti-red transition-all bg-white soft-shadow"
        >
          <ChevronRight size={20} />
        </Link>
      )}
    </nav>
  );
}
