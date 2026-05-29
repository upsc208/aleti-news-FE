export default function Slogan() {
  return (
    <section className="container mx-auto px-6 lg:px-12 mt-32 mb-32">
      <div className="bg-gradient-to-br from-gray-900 via-[#000510] to-aleti-navy rounded-[3.5rem] p-16 lg:p-32 text-center relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-white/5">
        <div className="relative z-10">
          <div className="inline-block px-5 py-1.5 rounded-full bg-aleti-red text-white text-[10px] font-black uppercase tracking-[0.3em] mb-12 shadow-lg shadow-aleti-red/20">
            Legendary Quote
          </div>
          
          <div className="mb-12">
            <h3 className="text-4xl lg:text-7xl font-bebas font-black text-white leading-[0.9] tracking-tighter uppercase italic">
              "GANAR, GANAR, GANAR <br />
              Y <span className="text-aleti-red relative">
                VOLVER A GANAR.
                <span className="absolute -inset-1 bg-aleti-red/20 blur-xl rounded-full -z-10"></span>
              </span>"
            </h3>
            <p className="mt-8 text-xl lg:text-2xl font-bold text-white/40 tracking-tight">
              이기고, 이기고, 또 이기고, <span className="text-white/60">다시 이기는 것.</span>
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <p className="text-white font-black text-sm lg:text-lg tracking-widest uppercase">
              Luis Aragonés
            </p>
            <p className="text-white/20 text-[10px] lg:text-xs font-bold uppercase tracking-[0.4em]">
              Sabio de Hortaleza
            </p>
          </div>
        </div>

        {/* Gemini Aurora glow for dark mode */}
        <div className="absolute -top-24 -left-24 h-96 w-96 bg-gemini-indigo/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 h-96 w-96 bg-aleti-red/5 rounded-full blur-[120px] pointer-events-none"></div>

        {/* 배경 장식: 주제가 구절 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full opacity-[0.02] pointer-events-none select-none">
          <p className="text-[10rem] lg:text-[18rem] font-black leading-none text-white whitespace-nowrap italic">
            ATLETI ATLETI ATLÉTICO DE MADRID
          </p>
        </div>
      </div>
    </section>
  );
}
