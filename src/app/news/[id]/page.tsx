import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, User, Calendar, Share2, MessageSquare, Newspaper, ExternalLink } from 'lucide-react';
import { Tweet } from 'react-tweet';
import { getNewsDetail } from '@/client/sdk.gen';


export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let news;
  try {
    const response = await getNewsDetail({
      path: { id: parseInt(id) }
    });
    news = response.data;
  } catch (error) {
    console.error('Failed to fetch news detail:', error);
  }

  if (!news) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">뉴스를 찾을 수 없습니다.</h1>
        <Link href="/" className="text-aleti-red font-bold underline">홈으로 돌아가기</Link>
      </div>
    );
  }

  // AI 요약이 문자열로 들어올 경우 리스트로 변환 (API 스펙에 따라 다를 수 있음)
  const summaryPoints = news.summaryKo ? news.summaryKo.split('\n').filter(p => p.trim()) : [];

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
              {news.sourceName}
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-8 tracking-tight">
            {news.titleKo}
          </h1>

          <div className="flex items-center justify-between border-y border-gray-100 py-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-base text-gray-700 font-semibold">
                <User size={18} className="text-gray-400" />
                {news.authorName || '알레티 뉴스'}
              </div>
              <div className="flex items-center gap-2 text-base text-gray-400 font-medium">
                <Calendar size={18} className="text-gray-300" />
                {news.publishedAt ? new Date(news.publishedAt).toLocaleDateString('ko-KR') : '날짜 정보 없음'}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-400 hover:text-aleti-red transition-colors rounded-full hover:bg-gray-50">
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </header>

        {summaryPoints.length > 0 && (
          <div className="mb-12 bg-gray-50 rounded-3xl p-6 lg:p-8 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Newspaper size={80} className="text-aleti-red" />
            </div>
            <h2 className="text-sm font-black text-aleti-red uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-aleti-red animate-pulse"></div>
              AI 핵심 요약
            </h2>
            <ul className="space-y-4">
              {summaryPoints.map((point, index) => (
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
              alt={news.titleKo || '뉴스 이미지'}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <div className="prose prose-xl max-w-none text-gray-800 leading-[2] mb-20 whitespace-pre-wrap font-medium text-lg sm:text-xl">
          {news.contentKo}
        </div>

        {/* SNS 포스트인 경우 트윗 렌더링 (원문 URL에서 ID 추출하거나 별도 필드 필요) */}
        {news.articleType === 'SNS_POST' && news.originalUrl.includes('x.com') && (
          <div className="mb-16 py-10 border-t border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MessageSquare size={20} className="text-aleti-red" />
              원본
            </h3>
            <div className="flex justify-center">
              <div className="w-full max-w-[550px]">
                {/* URL에서 트윗 ID 추출 */}
                <Tweet id={news.originalUrl.split('/').pop() || ''} />
              </div>
            </div>
          </div>
        )}

        <footer className="pt-10 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <a
                href={news.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                원문 출처 보기
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}

