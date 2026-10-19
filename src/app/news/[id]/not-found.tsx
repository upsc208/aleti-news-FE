import Link from 'next/link';

/* 없는 기사 안내 */
export default function NewsNotFound() {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">뉴스를 찾을 수 없습니다.</h1>
      <Link href="/" className="text-aleti-red dark:text-volt font-bold underline">홈으로 돌아가기</Link>
    </div>
  );
}
