import Link from 'next/link';
import { ChevronLeft, ShieldAlert } from 'lucide-react';
import Hero from '@/components/Home/Hero';

export default function AboutPage() {
  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="sticky top-16 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 h-12 flex items-center">
          <Link href="/" className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-aleti-red transition-colors">
            <ChevronLeft size={16} />
            홈으로 돌아가기
          </Link>
        </div>
      </div>

      <Hero />

      <main className="container mx-auto px-4 pt-16 max-w-4xl">
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-12 tracking-tight">
          <span className="text-aleti-red">알레띠 KR</span>에 대해서
        </h1>

        <div className="prose prose-xl text-gray-600 leading-relaxed space-y-8 font-medium max-w-none">
          <p className="text-lg sm:text-2xl leading-relaxed">
            <strong>알레띠 KR</strong>은 아틀레티코 마드리드(Atlético de Madrid)를 사랑하는 한국 팬들이 언어의 장벽 없이 현지의 생생한 소식을 접할 수 있도록 돕기 위해 시작된 <strong>개인 팬 프로젝트</strong>입니다.
          </p>

          <p className="text-lg sm:text-xl">
            스페인 현지 매체의 보도를 일일이 찾아보기 어려운 한국 팬들을 위해, AI 기술을 활용하여 핵심 내용을 빠르게 번역하고 요약하여 전달합니다. 우리는 단순히 뉴스를 전달하는 것을 넘어, 한국 내 알레띠 팬덤이 더 깊게 팀과 연결되기를 바랍니다.
          </p>

          <div className="bg-aleti-navy/5 p-8 sm:p-12 rounded-[3rem] border border-aleti-navy/10 my-16">
            <h2 className="text-2xl sm:text-3xl font-black text-aleti-navy mb-8 flex items-center gap-3">
              <div className="h-3 w-3 bg-aleti-navy rounded-full"></div>
              운영 원칙
            </h2>
            <ul className="space-y-6">
              <li className="flex items-start gap-4 text-base sm:text-lg">
                <span className="font-bold text-aleti-navy shrink-0 mt-1">01.</span>
                <span><strong>원작자 존중:</strong> 모든 소식은 반드시 원문 출처와 기자명을 명시하며, 최종적인 뉴스 소비는 원문 사이트에서 이루어질 수 있도록 유도합니다.</span>
              </li>
              <li className="flex items-start gap-4 text-base sm:text-lg">
                <span className="font-bold text-aleti-navy shrink-0 mt-1">02.</span>
                <span><strong>비영리 운영:</strong> 현재 본 서비스는 어떠한 상업적 수익도 창출하지 않으며, 개발자의 사비로 운영되는 순수 팬 프로젝트입니다.</span>
              </li>
              <li className="flex items-start gap-4 text-base sm:text-lg">
                <span className="font-bold text-aleti-navy shrink-0 mt-1">03.</span>
                <span><strong>정보의 정확성:</strong> AI 요약과 번역은 편의를 위한 것이며, 번역 과정에서 오류가 발생할 수도 있습니다. 정확한 정보 확인이 필요한 경우 반드시 첨부된 원문 링크를 확인하시기 바랍니다.</span>
              </li>
            </ul>
          </div>

          <div className="mt-16 p-8 sm:p-12 bg-gray-50 rounded-[3rem] border border-gray-100">
            <h3 className="flex items-center gap-2 text-aleti-red font-black mb-6 uppercase tracking-tighter text-xl sm:text-2xl">
              <ShieldAlert size={28} />
              Legal Disclaimer
            </h3>
            <div className="text-sm sm:text-base text-gray-500 space-y-4 leading-relaxed font-normal">
              <p>
                • 본 사이트는 아틀레티코 마드리드 구단 또는 특정 언론사와 공식적인 관계가 없는 <strong>비공식 팬 페이지</strong>입니다.
              </p>
              <p>
                • 제공되는 AI 요약 정보는 원문의 내용과 다를 수 있으므로, 정확한 정보 확인이 필요한 경우 반드시 첨부된 원문 링크를 확인하시기 바랍니다.
              </p>
              <p>
                • 모든 콘텐츠의 저작권은 각 언론사와 기자에게 있으며, 저작권자의 삭제 요청이 있을 경우 <strong>upscman@gmail.com</strong>으로 연락 주시면 검토 후 조치하겠습니다.
              </p>
            </div>
          </div>

          <div className="pt-10 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em]">
              Dedicated to Los Colchoneros in Korea. <br/>
              Made with passion by Saúl-Correa Bridge.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
