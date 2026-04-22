import { ChevronRight, Newspaper } from 'lucide-react';

export default function Hero() {
  return (
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
  );
}
