import Image from 'next/image';
import { ExternalLink, MessageSquare, Share2 } from 'lucide-react';
import { Tweet } from 'react-tweet';

interface NewsCardProps {
  news: {
    id: string;
    title: string;
    summary: string[];
    source: string;
    imageUrl: string;
    publishedAt: string;
    tweetId?: string;
  };
}

export default function NewsCard({ news }: NewsCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md">
      <div className="relative h-56 w-full">
        <Image
          src={news.imageUrl}
          alt={news.title}
          fill
          className="object-cover"
          unoptimized // To bypass potential referrer issues for external images
        />
        <div className="absolute top-4 left-4 rounded-full bg-aleti-red px-3 py-1 text-xs font-bold text-white shadow-lg">
          {news.source}
        </div>
      </div>

      <div className="p-6">
        <div className="mb-2 text-xs text-gray-500">{news.publishedAt}</div>
        <h3 className="mb-4 text-xl font-bold leading-tight text-aleti-navy hover:text-aleti-red cursor-pointer">
          {news.title}
        </h3>

        {/* AI Summary Section */}
        <div className="mb-6 rounded-xl bg-gray-50 p-4 border-l-4 border-aleti-red">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-aleti-red flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-aleti-red animate-pulse"></span>
            AI 3-Line Summary
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            {news.summary.map((point, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300"></span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Tweet Integration if available */}
        {news.tweetId && (
          <div className="mb-6 rounded-xl border border-gray-100 overflow-hidden shadow-inner bg-gray-50/30">
             <div className="p-2 pb-0 text-[10px] uppercase font-bold text-gray-400 text-center">Official Response</div>
             <div className="scale-90 origin-top -mt-4">
                <Tweet id={news.tweetId} />
             </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <div className="flex items-center gap-4 text-gray-400">
            <button className="flex items-center gap-1 hover:text-aleti-red transition-colors">
              <MessageSquare size={18} />
              <span className="text-xs">12</span>
            </button>
            <button className="flex items-center gap-1 hover:text-aleti-red transition-colors">
              <Share2 size={18} />
              <span className="text-xs">Share</span>
            </button>
          </div>
          <button className="flex items-center gap-1 text-sm font-bold text-aleti-navy hover:text-aleti-red transition-colors">
            Read More
            <ExternalLink size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
