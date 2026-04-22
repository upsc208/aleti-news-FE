import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, User, Calendar, Share2, MessageSquare, Newspaper, ExternalLink } from 'lucide-react';
import { Tweet } from 'react-tweet';

// 실제 환경에서는 API에서 데이터를 가져옵니다.
const getNewsDetail = (id: string) => {
  return {
    id,
    title: '아틀레티코 마드리드, 여름 이적시장 미드필더 보강 노린다',
    content: `아틀레티코 마드리드가 다가오는 여름 이적시장에서 중원 강화를 위한 본격적인 움직임에 나섰습니다. 디에고 시메오네 감독은 이번 시즌 팀의 경기력을 분석한 결과, 중원에서의 기동력과 창의성 보강이 필수적이라고 판단했습니다. 

현재 구단 스카우트 팀은 유럽 주요 리그를 돌며 잠재적인 영입 대상들을 면밀히 관찰하고 있습니다. 특히 라리가 내의 젊은 재능뿐만 아니라 프리미어리그와 세리에 A에서 활약 중인 베테랑 미드필더들까지 후보군에 포함된 것으로 알려졌습니다.

구단 관계자에 따르면 "우리는 팀의 철학에 부합하면서도 즉시 전력감이 될 수 있는 선수를 찾고 있다"며, "재정적인 상황을 고려하여 일부 선수의 방출을 통한 자금 확보 가능성도 열어두고 있다"고 전했습니다. 팬들은 이번 이적시장을 통해 아틀레티코가 다시 한번 우승 경쟁에 박차를 가할 수 있는 전력을 구축하기를 기대하고 있습니다.`,
    author: '김알레 기자',
    source: 'MARCA / 알레띠 KR 번역',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop',
    publishedAt: '2024년 4월 22일',
    summary: [
      '시메오네 감독, 중원의 기동력과 창의성 보강을 최우선 과제로 선정',
      '유럽 전역 스카우트 파견 및 다양한 후보군(신예+베테랑) 검토 중',
      '자금 확보를 위한 기존 자원 방출 가능성 포함, 본격적인 전력 재편 예고'
    ],
    tweetId: '1782354789563215872'
  };
};

export default function NewsDetailPage({ params }: { params: { id: string } }) {
  const news = getNewsDetail(params.id);

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* 상단 네비게이션 바 (상세페이지 전용) */}
      <div className="sticky top-16 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 h-12 flex items-center">
          <Link href="/" className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-aleti-red transition-colors">
            <ChevronLeft size={16} />
            목록으로 돌아가기
          </Link>
        </div>
      </div>

      <article className="container mx-auto px-4 pt-12 max-w-3xl">
        {/* 헤더 영역 */}
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

        {/* AI 요약 박스 */}
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

        {/* 본문 이미지 */}
        <div className="mb-12 relative h-[300px] sm:h-[450px] w-full overflow-hidden rounded-3xl shadow-xl shadow-gray-200/50">
          <Image
            src={news.imageUrl}
            alt={news.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        {/* 기사 본문 */}
        <div className="prose prose-lg max-w-none text-gray-700 leading-[1.8] mb-16 whitespace-pre-wrap font-medium">
          {news.content}
        </div>

        {/* 관련 트윗 (있는 경우) */}
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

        {/* 하단 네비게이션 및 푸터 */}
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
