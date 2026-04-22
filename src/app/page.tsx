import NewsCard from '@/components/NewsCard';
import { Newspaper } from 'lucide-react';

// Mock data until Backend API (/api/v1/news) is ready
const MOCK_NEWS = [
  {
    id: '1',
    title: 'Atletico Madrid Eyes Summer Move for Midfield Reinforcements',
    summary: [
      'Simeone identifies midfield as the priority for the upcoming transfer window.',
      'Scouts have been spotted monitoring several young talents across Europe.',
      'Potential exits could clear up funds for a marquee signing.'
    ],
    source: 'MARCA',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop',
    publishedAt: '2 hours ago',
    tweetId: '1782354789563215872' // Example tweet ID
  },
  {
    id: '2',
    title: 'Injury Update: Antoine Griezmann Expected Back for Champions League Clash',
    summary: [
      'Griezmann has returned to partial training with the first team.',
      'Medical staff are optimistic about his recovery timeline.',
      'His presence is considered vital for the upcoming tactical setup.'
    ],
    source: 'AS',
    imageUrl: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=1000&auto=format&fit=crop',
    publishedAt: '5 hours ago'
  },
  {
    id: '3',
    title: 'Saúl and Correa: The Heart of Simeone\'s Tactical Flexibility',
    summary: [
      'Seoul-Correa Bridge analysis: How these two players bridge the gap between defense and attack.',
      'Statistical deep dive into their contributions this season.',
      'The tactical importance of their versatility in high-pressure matches.'
    ],
    source: 'Aleti News',
    imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1000&auto=format&fit=crop',
    publishedAt: '1 day ago'
  }
];

export default function Home() {
  return (
    <div className="flex flex-col gap-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-aleti-navy py-20 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')]"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-6xl">
              The <span className="text-aleti-red">Bridge</span> Between <br />
              Seoul and Madrid
            </h1>
            <p className="mb-8 text-xl text-gray-300">
              Welcome to Saúl-Correa Bridge. Your premium portal for real-time Atlético Madrid news, 
              powered by AI and delivered with passion.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="rounded-lg bg-aleti-red px-6 py-3 font-bold text-white transition-transform hover:scale-105 hover:bg-red-700">
                Latest News
              </button>
              <button className="rounded-lg border-2 border-white/20 px-6 py-3 font-bold text-white transition-all hover:bg-white/10">
                Squad Updates
              </button>
            </div>
          </div>
        </div>
        
        {/* Decorative Element */}
        <div className="absolute bottom-0 right-0 hidden lg:block translate-y-1/4 translate-x-1/4 opacity-20">
           <Newspaper size={400} />
        </div>
      </section>

      {/* News Feed Section */}
      <section className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between border-b border-gray-200 pb-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-aleti-navy italic">
            <span className="h-8 w-2 bg-aleti-red"></span>
            LATEST ROJIBLANCO NEWS
          </h2>
          <div className="flex gap-2">
             <span className="rounded-full bg-aleti-navy px-3 py-1 text-[10px] font-bold text-white uppercase tracking-widest">Live Updates</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {MOCK_NEWS.map((news) => (
            <NewsCard key={news.id} news={news} />
          ))}
        </div>
        
        <div className="mt-12 flex justify-center">
          <button className="group flex items-center gap-2 rounded-full border-2 border-aleti-navy px-8 py-3 font-bold text-aleti-navy transition-all hover:bg-aleti-navy hover:text-white">
            Load More News
            <span className="transition-transform group-hover:translate-y-1">↓</span>
          </button>
        </div>
      </section>

      {/* Seoul-Correa Theme Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <div className="rounded-3xl bg-white p-8 md:p-12 shadow-xl ring-1 ring-black/5 overflow-hidden relative">
            <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <h2 className="text-3xl font-bold text-aleti-navy mb-6">Why "Saúl-Correa Bridge"?</h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    Named after two of Atlético's most resilient warriors, this platform serves as a 
                    <strong> bridge</strong> between the global fanbase (Seoul/Korea) and the heart of Madrid.
                  </p>
                  <p>
                    Just like Saúl and Correa, we prioritize reliability, versatility, and unwavering 
                    loyalty to the red and white stripes.
                  </p>
                </div>
              </div>
              <div className="flex justify-center gap-4">
                <div className="h-48 w-32 rounded-2xl bg-aleti-red/10 border-2 border-aleti-red/20 flex flex-col items-center justify-center p-4 text-center">
                   <div className="text-4xl font-black text-aleti-red mb-2">8</div>
                   <div className="text-xs font-bold text-aleti-navy uppercase">Saúl</div>
                </div>
                <div className="h-48 w-32 rounded-2xl bg-aleti-navy/10 border-2 border-aleti-navy/20 flex flex-col items-center justify-center p-4 text-center mt-8">
                   <div className="text-4xl font-black text-aleti-navy mb-2">10</div>
                   <div className="text-xs font-bold text-aleti-navy uppercase">Correa</div>
                </div>
              </div>
            </div>
            
            {/* Background Text */}
            <div className="absolute top-0 right-0 text-9xl font-black text-gray-50 -z-10 select-none">
              ATLETI
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
