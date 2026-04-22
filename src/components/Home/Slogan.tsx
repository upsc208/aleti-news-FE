export default function Slogan() {
  return (
    <section className="container mx-auto px-4 mt-24">
      <div className="bg-gray-50 rounded-[2.5rem] p-12 lg:p-20 text-center relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-2xl lg:text-4xl font-black text-aleti-navy mb-4 italic uppercase tracking-tighter">"Nunca Dejes de Creer"</h3>
          <p className="text-gray-400 text-lg font-medium">우리는 결코 믿음을 멈추지 않습니다.</p>
        </div>
        {/* Subtle decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15rem] font-black text-gray-100/50 -z-0 pointer-events-none italic select-none">
          ATLETI
        </div>
      </div>
    </section>
  );
}
