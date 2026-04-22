export interface News {
  id: string;
  title: string;
  author: string;
  source: string;
  imageUrl?: string;
  publishedAt: string;
  content?: string;
  summary?: string[];
  tweetId?: string;
}

export const MOCK_NEWS: News[] = [
  {
    id: '1',
    title: '아틀레티코 마드리드, 여름 이적시장 미드필더 보강 노린다',
    author: '김알레',
    source: 'MARCA',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop',
    publishedAt: '2시간 전'
  },
  {
    id: '2',
    title: '부상 업데이트: 앙투안 그리즈만, 챔피언스리그 경기 전 복귀 예상',
    author: '이마드리드',
    source: 'AS',
    imageUrl: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=1000&auto=format&fit=crop',
    publishedAt: '5시간 전'
  },
  {
    id: '3',
    title: '사울과 코레아: 시메오네 전술 유연성의 핵심 요인 분석',
    author: '박시메오네',
    source: '알레띠 KR',
    imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1000&auto=format&fit=crop',
    publishedAt: '어제'
  },
  {
    id: '4',
    title: '메트로폴리타노 스타디움, 다음 홈 경기 매진 임박',
    author: '최팬심',
    source: '알레띠 KR',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1000&auto=format&fit=crop',
    publishedAt: '2일 전'
  },
  {
    id: '5',
    title: '유스 아카데미의 신성, 1군 훈련 합류로 기대감 고조',
    author: '정스카우트',
    source: 'Mundo Deportivo',
    imageUrl: 'https://images.unsplash.com/photo-1518091043644-c1d445eb9519?q=80&w=1000&auto=format&fit=crop',
    publishedAt: '3일 전'
  },
  {
    id: '6',
    title: '시메오네 감독 "우리의 철학은 변하지 않는다, 경기마다 결승처럼"',
    author: '김알레',
    source: '알레띠 KR',
    imageUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1000&auto=format&fit=crop',
    publishedAt: '4일 전'
  },
  {
    id: '7',
    title: '[단독] 알레띠 KR, 한국 팬들을 위한 커뮤니티 기능 강화 예고',
    author: '운영진',
    source: '공지사항',
    publishedAt: '방금 전'
  }
];
