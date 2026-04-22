import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, User, Calendar, Share2, MessageSquare, Newspaper, ExternalLink } from 'lucide-react';
import { Tweet } from 'react-tweet';
import { MOCK_NEWS } from '@/data/mockNews';

// 실제 환경에서는 API에서 데이터를 가져오지만, 여기서는 MOCK_NEWS에서 찾거나 기본값을 반환합니다.
const getNewsDetail = (id: string) => {
  const news = MOCK_NEWS.find(n => n.id === id);
  
  // 상세 데이터가 없는 경우를 위한 기본값 (실제로는 API 호출)
  return news ? {
    ...news,
    content: news.content || `아틀레티코 마드리드 관련 최신 소식입니다. 상세 내용은 현지 매체 보고를 바탕으로 업데이트될 예정입니다.`,
    summary: news.summary || [
      '아틀레티코 마드리드 관련 주요 소식 업데이트',
      '현지 매체 및 구단 공식 발표 기반 정보',
      '팬들을 위한 빠른 번역 및 요약 제공'
    ],
    publishedDate: '2024년 4월 22일'
  } : null;
};

export default function NewsDetailPage({ params }: { params: { id: string } }) {
  const news = getNewsDetail(params.id);

  if (!news) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">뉴스를 찾을 수 없습니다.</h1>
        <Link href="/" className="text-aleti-red font-bold underline">홈으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="sticky top-16 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 h-12 flex items-center">
          <Link href="/" className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-aleti-red transition-colors">
            <ChevronLeft size={16} />
            목록으로 돌아가기
          </Link>
        </div>
      </div>

      <article className="container mx-auto px-4 pt-12 max-w-3xl">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-aleti-red text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-tighter">
              {news.source}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-6 tracking-tight">
            {news.title}
          </h1>
          
          <div className="flex items-center justify-between border-y border-gray-50 py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                <User size={16} className="text-gray-400" />
                {news.author}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                <Calendar size={16} className="text-gray-300" />
                {news.publishedAt}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-400 hover:text-aleti-red transition-colors rounded-full hover:bg-gray-50">
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </header>

        {news.summary && (
          <div className="mb-12 bg-gray-50 rounded-3xl p-6 lg:p-8 border border-gray-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
                <Newspaper size={80} className="text-aleti-red" />
             </div>
             <h2 className="text-sm font-black text-aleti-red uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-aleti-red animate-pulse"></div>
                AI 핵심 요약
             </h2>
             <ul className="space-y-4">
               {news.summary.map((point, index) => (
                 <li key={index} className="flex items-start gap-3 text-gray-700 leading-relaxed font-medium">
                   <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-aleti-red/40"></span>
                   {point}
                 </li>
               ))}
             </ul>
          </div>
        )}

        {news.imageUrl && (
          <div className="mb-12 relative h-[300px] sm:h-[450px] w-full overflow-hidden rounded-3xl shadow-xl shadow-gray-200/50">
            <Image
              src={news.imageUrl}
              alt={news.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <div className="prose prose-lg max-w-none text-gray-700 leading-[1.8] mb-16 whitespace-pre-wrap font-medium">
          {news.content}
        </div>

        {news.tweetId && (
          <div className="mb-16 py-10 border-t border-gray-100">
             <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MessageSquare size={20} className="text-aleti-red" />
                현지 공식 반응
             </h3>
             <div className="flex justify-center">
                <div className="w-full max-w-[550px]">
                   <Tweet id={news.tweetId} />
                </div>
             </div>
          </div>
        )}

        <footer className="pt-10 border-t border-gray-100">
           <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <button className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-aleti-red transition-colors">
                <MessageSquare size={18} />
                의견 나누기 (12)
              </button>
              <div className="flex items-center gap-3">
                 <button className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all flex items-center gap-2">
                    원문 출처 보기
                    <ExternalLink size={14} />
                 </button>
              </div>
           </div>
        </footer>
      </article>
    </div>
  );
}
