'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface ShareButtonProps {
  title: string;
}

export default function ShareButton({ title }: ShareButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: `알레띠 뉴스 | ${title}`,
      text: title,
      url: window.location.href,
    };

    // 1. Web Share API 시도 (주로 모바일)
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        } else {
            return; // 사용자가 취소한 경우
        }
      }
    }

    // 2. 클립보드 복사 폴백 (PC 또는 미지원 브라우저)
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className={`p-2 transition-all rounded-full flex items-center justify-center
          ${isCopied 
            ? 'bg-green-50 text-green-600' 
            : 'text-gray-400 hover:text-aleti-red hover:bg-gray-50'
          }`}
        title="기사 공유하기"
      >
        {isCopied ? <Check size={20} /> : <Share2 size={20} />}
      </button>

      {/* 복사 완료 안내 툴팁 */}
      {isCopied && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold rounded-lg whitespace-nowrap animate-in fade-in zoom-in duration-200">
          링크가 복사되었습니다!
        </div>
      )}
    </div>
  );
}
