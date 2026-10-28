import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 쿼리가 붙은 주소는 필터·페이지 조합이라 수천 개로 불어난다. 사이트맵 주소에는 쿼리가 없다
      disallow: ['/admin', '/admin/', '/*?*'],
    },
    sitemap: 'https://atleti.kr/sitemap.xml',
  };
}
