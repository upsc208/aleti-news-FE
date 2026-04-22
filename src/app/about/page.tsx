import { Heart, ShieldCheck, Zap } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Hero Section */}
      <section className="bg-aleti-navy py-24 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-6 text-4xl font-black sm:text-6xl">우리가 이곳을 만든 이유</h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-300">
            "비인기 구단이라는 서러움을 넘어, 한국 알레띠 팬들을 위한 안식처를 꿈꿉니다."
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <div className="space-y-12 text-lg leading-relaxed text-gray-700">
            <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100 md:p-12">
              <h2 className="mb-8 text-3xl font-bold text-aleti-navy">오로지 팬심으로 시작된 프로젝트</h2>
              <div className="space-y-6">
                <p>
                  한국에서 해외 축구를 즐기다 보면 가끔 외로울 때가 있습니다. 
                  소위 '빅클럽'이라 불리는 구단들의 소식은 실시간으로 쏟아지지만, 
                  우리 <strong>아틀레티코 마드리드</strong>의 소식은 늘 뒷전이곤 했습니다.
                </p>
                <p>
                  현지의 생생한 인터뷰, 전술 분석, 그리고 작은 가십거리 하나조차 
                  한국어로는 찾아보기 힘든 현실. 비인기 구단 팬이라는 이유로 
                  정보의 불균형을 겪어야 했던 시간들이 있었습니다.
                </p>
                <p className="font-bold text-aleti-red italic">
                  "없으면 우리가 직접 만들자."
                </p>
                <p>
                  <strong>알레띠 KR</strong>은 그런 순수한 갈증에서 시작되었습니다. 
                  우리는 어떠한 상업적 수익도 추구하지 않습니다. 오직 아틀레티코를 
                  사랑하는 마음 하나로, 파편화된 현지 소식들을 모아 한국의 팬들에게 
                  가장 빠르고 정확하게 전달하고자 합니다.
                </p>
              </div>
            </div>

            {/* Core Values */}
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-aleti-red/10 text-aleti-red">
                  <Heart fill="currentColor" size={32} />
                </div>
                <h3 className="mb-2 text-xl font-bold text-aleti-navy">100% 팬심</h3>
                <p className="text-sm text-gray-500">수익 창출 목적이 아닌, 팬들의 소통과 정보 공유만을 위해 운영됩니다.</p>
              </div>
              
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-aleti-navy/10 text-aleti-navy">
                  <Zap size={32} />
                </div>
                <h3 className="mb-2 text-xl font-bold text-aleti-navy">압도적 속도</h3>
                <p className="text-sm text-gray-500">AI 기술을 활용하여 현지 매체의 핵심 보도를 누구보다 빠르게 요약해 전달합니다.</p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="mb-2 text-xl font-bold text-aleti-navy">정확한 정보</h3>
                <p className="text-sm text-gray-500">공식 소식과 공신력 있는 매체의 보도를 구분하여 투명하게 제공합니다.</p>
              </div>
            </div>

            <div className="rounded-3xl bg-gray-900 p-8 text-white md:p-12">
              <h2 className="mb-6 text-2xl font-bold">사울-코레아 브릿지의 의미</h2>
              <p className="mb-6 text-gray-400">
                이곳의 이름인 '사울-코레아 브릿지'는 단순한 선수의 이름 나열이 아닙니다. 
                팀이 어려울 때나 기쁠 때나 항상 그 자리를 지켜주는 사울 니게스와 앙헬 코레아처럼, 
                한국 팬들에게 변치 않는 든든한 다리가 되겠다는 약속입니다.
              </p>
              <div className="flex items-center gap-4 border-t border-white/10 pt-6 mt-8">
                 <div className="h-12 w-12 rounded-full bg-aleti-red flex items-center justify-center font-bold">KR</div>
                 <div>
                    <div className="font-bold text-lg">알레띠 KR 운영진 드림</div>
                    <div className="text-sm text-gray-500 italic">"Aupa Atleti!"</div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
