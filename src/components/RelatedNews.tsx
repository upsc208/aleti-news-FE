import Link from 'next/link';
import { getNews } from '@/client/sdk.gen';
import type { NewsListResponse } from '@/client/types.gen';

type RelatedPick = { label: string; news: NewsListResponse };

async function fetchList(query: { size: number; category?: string; isHyped?: boolean }) {
  try {
    const response = await getNews({ query });
    return response.data?.content ?? [];
  } catch (error) {
    console.error('Failed to fetch related news:', error);
    return [];
  }
}

/**
 * 기사 하단 추천 뉴스
 */
export default async function RelatedNews({ currentId, category }: { currentId: number; category?: string }) {
  const [sameCategory, hyped] = await Promise.all([
    category ? fetchList({ size: 3, category }) : Promise.resolve([]),
    fetchList({ size: 4, isHyped: true }),
  ]);

  const used = new Set<number>([currentId]);
  const take = (list: NewsListResponse[]) => {
    const found = list.find((n) => !used.has(n.id));
    if (found) used.add(found.id);
    return found;
  };

  const picks: RelatedPick[] = [];
  const first = take(sameCategory);
  if (first) picks.push({ label: category?.replace(/^\[|\]$/g, '') || '관련 기사', news: first });
  const second = take(hyped);
  if (second) picks.push({ label: '많이 본 기사', news: second });

  if (picks.length < 2) {
    const latest = await fetchList({ size: 4 });
    while (picks.length < 2) {
      const fill = take(latest);
      if (!fill) break;
      picks.push({ label: '최신 기사', news: fill });
    }
  }

  if (picks.length === 0) return null;

  return (
    <section
      aria-labelledby="related-news-heading"
      className="mb-16 overflow-hidden rounded-3xl bg-white dark:bg-[#111318] border border-aleti-navy/15 border-t-4 border-t-aleti-red dark:border-volt/15 dark:border-t-volt"
    >
      <div className="p-5 sm:p-6">
        <h2
          id="related-news-heading"
          className="mb-4 flex items-center gap-2 text-xl sm:text-2xl font-black tracking-tight text-aleti-navy dark:text-volt"
        >
          <span aria-hidden="true" className="h-5 w-1.5 rounded-full bg-aleti-red dark:bg-volt" />
          추천 기사
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {picks.map(({ label, news }, index) => (
            <li key={news.id}>
              <Link
                href={`/news/${news.id}`}
                className="group flex h-full flex-col rounded-2xl border border-aleti-navy/10 border-l-4 border-l-aleti-navy dark:border-white/[0.06] dark:border-l-volt bg-white dark:bg-white/[0.03] p-4 shadow-sm hover:border-l-aleti-red hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <span
                  className={`self-start rounded-full px-2.5 py-0.5 text-[11px] font-black text-white dark:bg-volt/15 dark:text-volt ${
                    index === 0 ? 'bg-aleti-red' : 'bg-aleti-navy'
                  }`}
                >
                  {label}
                </span>
                <p className="mt-2 font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-aleti-red dark:group-hover:text-volt transition-colors">
                  {news.titleKo || '제목 없음'}
                </p>
                <p className="mt-auto pt-2 text-xs text-gray-500 dark:text-gray-400">{news.sourceName}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
