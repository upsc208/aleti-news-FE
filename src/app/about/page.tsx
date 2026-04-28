import Link from 'next/link';
import { ChevronLeft, ShieldAlert } from 'lucide-react';

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

      <main className="container mx-auto px-4 pt-16 max-w-2xl">
        <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">
          알레띠 KR에 대해서
        </h1>

        <div className="prose prose-lg text-gray-600 leading-relaxed space-y-6 font-medium">
          <p>
            <strong>알레띠 KR</strong>은 아틀레티코 마드리드(Atlético de Madrid)를 응원하는 한국 팬들을 위한 비영리 뉴스 포털 프로젝트입니다.
          </p>

          <p>
            우리는 언어의 장벽으로 인해 현지의 생생한 소식을 접하기 어려운 팬들을 위해, AI 기술을 활용하여 스페인 현지 매체의 보도를 빠르게 번역하고 요약하여 제공합니다.
          </p>

          <h2 className="text-xl font-bold text-gray-900 pt-4">서비스의 목적</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>한국 내 아틀레티코 마드리드 팬덤의 정보 접근성 향상</li>
            <li>파편화된 현지 소식의 중앙화 및 빠른 요약 제공</li>
            <li>팬들 간의 건전한 정보 공유 환경 조성</li>
          </ul>

          <div className="mt-12 p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="flex items-center gap-2 text-aleti-red font-bold mb-3">
              <ShieldAlert size={20} />
              법적 고지 (Disclaimer)
            </h3>
            <div className="text-sm text-gray-500 space-y-3 leading-relaxed">
              <p>
                1. 본 사이트는 아틀레티코 마드리드 구단 또는 특정 언론사와 공식적인 관계가 없는 <strong>개인 팬 프로젝트</strong>입니다.
              </p>
              <p>
                2. 제공되는 모든 뉴스는 AI에 의해 자동 요약된 내용으로, 원문의 의도와 다를 수 있습니다. 정확한 내용은 반드시 제공된 <strong>원문 출처</strong>를 통해 확인하시기 바랍니다.
              </p>
              <p>
                3. 본 프로젝트는 어떠한 상업적 수익도 추구하지 않으며, 저작권자의 요청이 있을 경우 관련 콘텐츠는 즉시 삭제될 수 있습니다.
              </p>
            </div>
          </div>

          <div className="pt-10 border-t border-gray-100 text-sm text-gray-400">
            <p>© 2024 Saúl-Correa Bridge. Dedicated to Los Colchoneros in Korea.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
