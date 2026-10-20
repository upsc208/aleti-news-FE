'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

/* 기사 페이지의 목록 복귀 링크, 캐시된 페이지에서도 보던 목록 페이지로 돌아감 */
function BackLink({ id, fromPage }: { id: number; fromPage: string | null }) {
  return (
    <Link
      href={fromPage ? `/?page=${fromPage}#news-${id}` : `/#news-${id}`}
      className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-aleti-red dark:hover:text-volt transition-colors"
    >
      <ChevronLeft size={16} />
      목록으로 돌아가기
    </Link>
  );
}

function BackLinkFromQuery({ id }: { id: number }) {
  const fromPage = useSearchParams().get('fromPage');
  return <BackLink id={id} fromPage={fromPage} />;
}

export default function BackToListLink({ id }: { id: number }) {
  return (
    <Suspense fallback={<BackLink id={id} fromPage={null} />}>
      <BackLinkFromQuery id={id} />
    </Suspense>
  );
}
