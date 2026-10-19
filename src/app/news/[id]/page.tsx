import Image from 'next/image';
import { notFound, unstable_rethrow } from 'next/navigation';
import { User, Calendar, MessageSquare, Newspaper, ExternalLink } from 'lucide-react';
import { Suspense, cache } from 'react';
import { getTweet } from 'react-tweet/api';
import TwitterEmbed from '@/components/TwitterEmbed';
import { getNewsDetail } from '@/client/sdk.gen';
import ShareButton from '@/components/ShareButton';
import Linkify from '@/components/Linkify';
import RelatedNews from '@/components/RelatedNews';
import AdminArticleActions from '@/components/AdminArticleActions';
import BackToListLink from '@/components/BackToListLink';
import ViewCounter from '@/components/ViewCounter';
import { Metadata } from 'next';

// 기사는 올라간 뒤 거의 바뀌지 않아 하루 동안 캐시, 삭제는 revalidateNews로 바로 반영
export const revalidate = 86400;

// 빌드 때는 만들지 않고 처음 요청될 때 만든 뒤 캐시
export async function generateStaticParams() {
  return [];
}

// 없는 기사만 404로 캐시하고, 백엔드 장애는 에러로 던져 캐시에 남기지 않음
const fetchNews = cache(async (id: string) => {
  // '07', '7.0' 같은 별칭 주소가 캐시를 따로 만들지 않게 정규 형식만 허용
  if (!/^[1-9]\d{0,15}$/.test(id)) notFound();
  const newsId = Number(id);

  const { data, response } = await getNewsDetail({ path: { id: newsId } });
  if (response?.status === 404) notFound();
  if (!data) throw new Error(`Failed to fetch news detail for id ${id} (status ${response?.status})`);
  return data;
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  // 메타데이터 실패는 기본 제목으로 넘기고, 404만 그대로 던짐
  let news;
  try {
    news = await fetchNews(id);
  } catch (error) {
    unstable_rethrow(error);
    console.error(`Metadata generation failed for id ${id}:`, error);
    return { title: '뉴스 상세' };
  }

  const title = news.titleKo || '뉴스 상세';
  const contentPreview = news.contentKo ? news.contentKo.substring(0, 150) : '';
  const description = news.summaryKo || contentPreview || '아틀레티코 마드리드(알레띠) 최신 뉴스';

  return {
    title,
    description,
    alternates: {
      canonical: `/news/${id}`,
    },
    openGraph: {
      title,
      description,
      images: news.imageUrl ? [news.imageUrl] : ['/icon.png'],
      type: 'article',
      publishedTime: news.publishedAt || undefined,
      authors: news.authorName ? [news.authorName] : ['아틀레티 KR'],
      url: `https://atleti.kr/news/${id}`,
      siteName: '아틀레티 KR',
      locale: 'ko_KR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: news.imageUrl ? [news.imageUrl] : ['/icon.png'],
    },
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const news = await fetchNews(id);

  // AI 요약이 문자열로 들어올 경우 리스트로 변환
  const summaryPoints = news.summaryKo ? news.summaryKo.split('\n').filter(p => p && p.trim()) : [];
  
  // 날짜 처리 안전하게
  let formattedDate = '날짜 정보 없음';
  try {
    if (news.publishedAt) {
      formattedDate = new Date(news.publishedAt).toLocaleString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Seoul'
      }) + ' KST';
    }
  } catch (e) {
    console.error('Date formatting error:', e);
  }

  // 트윗 데이터 가져오기 (SNS_POST인 경우)
  let tweetData = null;
  const tweetMatch = news.articleType === 'SNS_POST' && news.originalUrl?.match(/\/status\/(\d+)/);
  const tweetId = tweetMatch ? tweetMatch[1] : null;

  if (tweetId) {
    try {
      const rawTweetData = await getTweet(tweetId);
      
      if (rawTweetData) {
        console.log(`[DEBUG] Fetching tweet ${tweetId} for news ${id}`);

        // react-tweet 렌더링 에러 방지 (Deep Clone 및 필수 필드 보정)
        const tweet = JSON.parse(JSON.stringify(rawTweetData));

        const sanitizeEntities = (entObj: any) => {
          if (!entObj || typeof entObj !== 'object') return {};
          const result = { ...entObj };
          
          // react-tweet에서 무조건 접근하는 키들
          const requiredKeys = ['hashtags', 'user_mentions', 'urls', 'symbols', 'media'];
          
          requiredKeys.forEach(key => {
            if (!result[key] || !Array.isArray(result[key])) {
              result[key] = [];
            } else {
              result[key] = result[key].filter((item: any) => 
                item && typeof item === 'object' && Array.isArray(item.indices)
              );
            }
          });

          if (result.media && result.media.length === 0) {
            delete result.media;
          }
          
          return result;
        };

        const sanitizeTweet = (t: any) => {
          if (!t) return;
          t.entities = sanitizeEntities(t.entities);
          if (t.extended_entities) {
            t.extended_entities = sanitizeEntities(t.extended_entities);
          }
          if (!t.display_text_range) {
            t.display_text_range = [0, (t.text || t.full_text || "").length];
          }
          if (!t.text && t.full_text) {
            t.text = t.full_text;
          }
        };

        sanitizeTweet(tweet);
        if (tweet.quoted_tweet) {
          sanitizeTweet(tweet.quoted_tweet);
        }

        tweetData = tweet;
      }
    } catch (e) {
      console.error('Failed to fetch tweet data:', e);
    }
  }

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: news.titleKo || '뉴스 상세',
    description: news.summaryKo || (news.contentKo ? news.contentKo.substring(0, 150) : ''),
    image: news.imageUrl ? [news.imageUrl] : ['https://atleti.kr/icon.png'],
    datePublished: news.publishedAt || undefined,
    dateModified: news.publishedAt || undefined,
    inLanguage: 'ko-KR',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://atleti.kr/news/${id}`,
    },
    author: {
      '@type': news.authorName ? 'Person' : 'Organization',
      name: news.authorName || news.sourceName || '아틀레티 KR',
    },
    publisher: { '@id': 'https://atleti.kr/#organization' },
  };

  return (
    <div className="bg-white dark:bg-[#0a0b10] min-h-screen pb-20 transition-colors duration-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      {/* Sticky Back Bar */}
      <div className="sticky top-16 sm:top-20 z-40 w-full bg-white/80 dark:bg-[#0d0e14]/90 backdrop-blur-md border-b border-gray-100 dark:border-volt/5">
        <div className="container mx-auto px-4 h-12 flex items-center">
          <BackToListLink id={news.id} />
        </div>
      </div>

      <article className="container mx-auto px-4 pt-8 sm:pt-12 max-w-3xl">
        <header className="mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white leading-[1.15] mb-6 sm:mb-8 tracking-tight">
            {news.titleKo || '제목 없음'}
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-y border-gray-100 dark:border-volt/5 py-4 sm:py-6 gap-6">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm font-black text-aleti-red dark:text-volt uppercase tracking-widest">
                  {news.sourceName || '알 수 없는 출처'}
                </span>
                <div className="h-4 w-px bg-gray-200" />
                <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 font-semibold">
                  <User size={18} className="text-gray-400" />
                  <span className="truncate max-w-[120px] sm:max-w-none">{news.authorName || '알레띠 뉴스'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm sm:text-base text-gray-400 font-medium">
                <Calendar size={18} className="text-gray-300" />
                <span className="whitespace-nowrap">{formattedDate}</span>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-50">
              {news.originalUrl && (
                <a
                  href={news.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-50 dark:bg-white/[0.03] text-gray-600 dark:text-gray-300 hover:text-aleti-red dark:hover:text-volt hover:bg-aleti-red/5 dark:hover:bg-volt/5 rounded-xl text-xs sm:text-sm font-bold transition-all border border-gray-100 dark:border-white/[0.04] hover:border-aleti-red/20 dark:hover:border-volt/15"
                  title="원문 출처 보기"
                >
                  <span className="whitespace-nowrap">원문 보기</span>
                  <ExternalLink size={14} />
                </a>
              )}
              <div className="flex items-center gap-2">
                <div className="h-6 w-px bg-gray-100 sm:mx-1" />
                <ShareButton title={news.titleKo || ''} />
              </div>
            </div>
          </div>
        </header>
        
        {summaryPoints.length > 0 && (
          <div className="mb-12 bg-gray-50 dark:bg-[#111318] rounded-3xl p-6 lg:p-8 border border-gray-100 dark:border-volt/15 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Newspaper size={80} className="text-aleti-red dark:text-volt/5" />
            </div>
            <h2 className="text-sm font-black text-aleti-red dark:text-volt uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-aleti-red dark:bg-volt animate-pulse"></div>
              AI 핵심 요약
            </h2>
            <ul className="space-y-4">
              {summaryPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-aleti-red/40 dark:bg-volt/60"></span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {news.imageUrl && (
          <div className="mb-12">
            <div className="relative h-[300px] sm:h-[450px] w-full overflow-hidden rounded-3xl shadow-xl shadow-gray-200/50 mb-3">
              <Image
                src={news.imageUrl}
                alt={news.titleKo || '뉴스 이미지'}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="px-2 text-center">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-tight">
                사진 출처: {news.sourceName || '알 수 없음'}{news.authorName ? `, ${news.authorName}` : ''}
              </p>
            </div>
          </div>
        )}

        <div className="prose prose-xl max-w-none text-gray-800 dark:text-gray-200 leading-[2] mb-20 whitespace-pre-wrap font-medium text-lg sm:text-xl">
          {news.contentKo ? <Linkify text={news.contentKo} /> : '내용이 없습니다.'}
        </div>

        {/* SNS 포스트인 경우 트윗 렌더링 */}
        {news.articleType === 'SNS_POST' && news.originalUrl && (news.originalUrl.includes('x.com') || news.originalUrl.includes('twitter.com')) && (
          <div className="mb-16 py-10 border-t border-gray-100 dark:border-volt/5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <MessageSquare size={20} className="text-aleti-red dark:text-volt" />
              원본 포스트
            </h3>
            <div className="flex justify-center">
              <div className="w-full max-w-[550px] min-h-[200px]">
                {tweetId ? (
                  <Suspense fallback={<div className="h-40 w-full animate-pulse bg-gray-50 dark:bg-white/5 rounded-2xl" />}>
                    <TwitterEmbed tweetData={tweetData} originalUrl={news.originalUrl} />
                  </Suspense>
                ) : (
                  <div className="p-8 text-center bg-gray-50 dark:bg-white/5 rounded-2xl">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">트윗 ID를 찾을 수 없습니다.</p>
                    <a href={news.originalUrl} target="_blank" rel="noopener noreferrer" className="text-aleti-red dark:text-volt text-xs font-bold mt-2 inline-block">
                      원문 직접 보기
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <ViewCounter id={news.id} />
        <AdminArticleActions id={news.id} title={news.titleKo || '제목 없음'} />

        <Suspense fallback={null}>
          <RelatedNews currentId={news.id} category={news.category} />
        </Suspense>

        <footer className="pt-10 border-t border-gray-100 dark:border-volt/5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <p className="text-gray-400 text-sm font-medium">© 알레띠 뉴스. All rights reserved.</p>
          </div>
        </footer>
      </article>
    </div>
  );
}
