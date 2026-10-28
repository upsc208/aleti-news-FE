import { MetadataRoute } from 'next';
import { getNews } from '@/client/sdk.gen';

// 요청마다 백엔드를 25번 호출해 1.7MB를 만들던 것을 한 시간 캐시
export const revalidate = 3600;

// 소개 페이지는 내용이 바뀔 때만 손으로 올린다
const ABOUT_LAST_MODIFIED = new Date('2026-09-01T00:00:00Z');

/**
 * 3,000개 이상의 데이터를 안전하게 가져오기 위해
 * 페이지네이션을 순회하며 뉴스 URL 목록을 생성합니다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://atleti.kr';

  // 기사 하나를 사이트맵 항목으로. 발행일이 없으면 lastModified를 비워 둔다
  const toEntry = (news: { id?: number; publishedAt?: string | null }): MetadataRoute.Sitemap[number] => ({
    url: `${baseUrl}/news/${news.id}`,
    ...(news.publishedAt ? { lastModified: new Date(news.publishedAt) } : {}),
    priority: 0.6,
  });

  // 2. 동적 뉴스 페이지 URL 수집
  let allNewsUrls: MetadataRoute.Sitemap = [];
  const size = 100; // 백엔드가 한 번에 주는 최대치

  try {
    // 첫 번째 페이지 호출하여 전체 페이지 수 확인
    const firstResponse = await getNews({
      query: { page: 0, size: size }
    });

    if (firstResponse.data && firstResponse.data.content) {
      const totalPages = firstResponse.data.totalPages || 1;

      // 첫 페이지 데이터 추가
      allNewsUrls = firstResponse.data.content.map(toEntry);

      // 나머지 페이지 병렬 호출 (부하 조절을 위해 Promise.all 사용)
      if (totalPages > 1) {
        const remainingPagePromises = [];
        for (let i = 1; i < totalPages; i++) {
          remainingPagePromises.push(getNews({ query: { page: i, size: size } }));
        }

        const responses = await Promise.all(remainingPagePromises);
        responses.forEach((res) => {
          if (res.data && res.data.content) {
            allNewsUrls = [...allNewsUrls, ...res.data.content.map(toEntry)];
          }
        });
      }
    }
  } catch (error) {
    console.error('사이트맵 생성 중 뉴스 데이터를 가져오지 못했습니다:', error);
  }

  // 홈은 최신 기사가 들어온 시각이 곧 마지막 변경 시각
  const newestPublishedAt = allNewsUrls[0]?.lastModified;
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      ...(newestPublishedAt ? { lastModified: newestPublishedAt } : {}),
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: ABOUT_LAST_MODIFIED,
      priority: 0.8,
    },
  ];

  return [...staticPages, ...allNewsUrls];
}
