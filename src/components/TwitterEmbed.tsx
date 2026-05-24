'use client';

import { Tweet } from 'react-tweet';
import { MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TwitterEmbedProps {
  id: string;
  originalUrl?: string;
}

export default function TwitterEmbed({ id, originalUrl }: TwitterEmbedProps) {
  const [hasError, setHasError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-[200px] flex items-center justify-center bg-gray-50 dark:bg-white/5 rounded-2xl animate-pulse">
      <p className="text-gray-400 text-sm">트윗 로딩 중...</p>
    </div>;
  }

  if (hasError) {
    return (
      <div className="p-8 text-center bg-gray-50 dark:bg-white/5 rounded-2xl">
        <p className="text-gray-500 dark:text-gray-400 text-sm">트윗을 불러올 수 없습니다.</p>
        {originalUrl && (
          <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="text-aleti-red dark:text-volt text-xs font-bold mt-2 inline-block">
            원문 직접 보기
          </a>
        )}
      </div>
    );
  }

  try {
    return (
      <div className="w-full flex justify-center twitter-embed-container">
        <Tweet id={id} onError={() => setHasError(true)} />
      </div>
    );
  } catch (e) {
    console.error('Twitter render error:', e);
    setHasError(true);
    return null;
  }
}
