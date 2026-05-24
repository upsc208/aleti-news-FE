'use client';

import React, { Component, ErrorInfo, ReactNode, useEffect, useState } from 'react';
import { Tweet } from 'react-tweet';

// React 렌더링 에러를 잡기 위한 클래스형 에러 바운더리
class TweetErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Tweet rendering failed gracefully:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface TwitterEmbedProps {
  id: string;
  originalUrl?: string;
}

export default function TwitterEmbed({ id, originalUrl }: TwitterEmbedProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const FallbackUI = (
    <div className="p-8 text-center bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
      <p className="text-gray-500 dark:text-gray-400 text-sm">트윗 내용을 직접 불러올 수 없습니다.</p>
      {originalUrl && (
        <a 
          href={originalUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-aleti-red dark:text-volt text-xs font-bold mt-2 inline-block hover:underline"
        >
          트위터에서 직접 보기
        </a>
      )}
    </div>
  );

  if (!mounted) {
    return <div className="min-h-[200px] flex items-center justify-center bg-gray-50 dark:bg-white/5 rounded-2xl animate-pulse">
      <p className="text-gray-400 text-sm">트윗 로딩 중...</p>
    </div>;
  }

  return (
    <div className="w-full flex justify-center twitter-embed-container">
      <TweetErrorBoundary fallback={FallbackUI}>
        <Tweet id={id} />
      </TweetErrorBoundary>
    </div>
  );
}
