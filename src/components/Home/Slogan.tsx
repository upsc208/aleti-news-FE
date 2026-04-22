export default function Slogan() {
  return (
    <section className="container mx-auto px-4 mt-24">
      <div className="bg-gray-900 rounded-[2.5rem] p-12 lg:p-20 text-center relative overflow-hidden shadow-2xl shadow-aleti-navy/20">
        <div className="relative z-10">
          {/* 어우파 알레띠 함성 */}
          <div className="inline-block px-4 py-1 rounded-full bg-aleti-red text-white text-[10px] font-black uppercase tracking-[0.2em] mb-8">
            ¡Aupa Atleti!
          </div>
          
          {/* 루이스 아라고네스 명언 - 스페인어 메인 */}
          <div className="mb-8">
            <h3 className="text-3xl lg:text-5xl font-black text-white leading-tight tracking-tighter uppercase italic">
              "Ganar, ganar, ganar <br className="sm:hidden" />
              y <span className="text-aleti-red">volver a ganar.</span>"
            </h3>
            <p className="mt-4 text-base lg:text-lg font-medium text-white/30 tracking-tight">
              이기고, 이기고, 또 이기고, 다시 이기는 것.
            </p>
          </div>
          
          <p className="text-white/40 text-[10px] lg:text-xs font-bold uppercase tracking-[0.3em] italic">
            — Luis Aragonés, Sabio de Hortaleza
          </p>
        </div>

        {/* 배경 장식: 주제가 구절 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full opacity-[0.03] pointer-events-none select-none">
          <p className="text-[6rem] lg:text-[10rem] font-black leading-none text-white whitespace-nowrap italic">
            ATLETI ATLETI ATLÉTICO DE MADRID
          </p>
        </div>
      </div>
    </section>
  );
}
