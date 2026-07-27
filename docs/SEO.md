# SEO 구조 문서

> 2026-07 SEO 업그레이드 작업의 배경과 구조 설명.
> 관련 파일: `src/app/layout.tsx`, `src/app/news/[id]/page.tsx`, `src/app/opengraph-image.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`

## 기본 원칙

이 사이트의 SEO는 세 가지 축으로 구성된다.

1. **일관된 신호** — canonical, OG url, 사이트 이름이 서로 모순되지 않아야 한다. 검색엔진은 여러 신호를 교차 검증해서 "이 페이지의 공식 주소·이름"을 판단하므로, 신호가 어긋나면 신뢰도가 깎인다.
2. **구조화 데이터(JSON-LD)** — 뉴스 사이트는 일반 HTML만으로는 부족하다. "이건 뉴스 기사, 발행일은 언제, 작성자는 누구"를 기계가 읽을 수 있는 형식으로 선언해야 Google 뉴스 탭·리치 결과 노출 자격이 생긴다.
3. **공유 최적화(OG)** — 팬 커뮤니티 사이트는 검색보다 SNS·커뮤니티 공유 유입 비중이 크다. 링크가 예쁘게 펼쳐지는 것 자체가 클릭률에 직접 영향을 준다.

참고: `<meta name="keywords">`는 Google이 2009년부터 랭킹에서 완전히 무시하며 네이버도 사실상 반영하지 않는다. keywords 필드는 유지하고 있지만 여기에 기대지 말 것. SEO 개선은 위 세 축에서 이루어진다.

## 1. 도메인·브랜드 신호 통일

**무엇을:** 뉴스 상세 페이지의 OG url이 오타 도메인(`alleti.kr`)을 가리키던 것을 `atleti.kr`로 수정. 페이지 제목의 "알레띠 KR" 하드코딩을 제거하고 루트 레이아웃의 title 템플릿(`%s | 아틀레티 KR`)을 따르도록 통일.

**왜:** 수정 전에는 canonical은 `atleti.kr`, OG url은 존재하지 않는 `alleti.kr`을 가리켜 신호가 모순이었다. SNS 공유 시스템이 OG url 기준으로 링크를 처리하면 잘못된 주소가 퍼질 수도 있었다. 사이트 이름이 페이지마다 다르면("알레띠 KR" vs "아틀레티 KR") 검색 결과 노출 시 브랜드 인지도가 분산된다.

**규칙:**
- 공식 도메인은 `https://atleti.kr` 하나뿐이다. 새 페이지의 절대 URL은 반드시 이 도메인을 쓴다. (`metadataBase`가 `layout.tsx`에 선언되어 있으므로 canonical 등은 상대 경로로 쓰면 자동 해석된다.)
- 노출용 사이트 이름은 **"아틀레티 KR"** 로 통일한다. 페이지 title에 사이트 이름을 직접 붙이지 말고 루트 템플릿에 맡긴다.

## 2. JSON-LD 구조화 데이터

**무엇을:**
- `layout.tsx` — 사이트 전체 `WebSite` + `NewsMediaOrganization` 스키마 (`@id: https://atleti.kr/#organization`)
- `news/[id]/page.tsx` — 기사별 `NewsArticle` 스키마 (headline, datePublished, image, author, publisher)

**왜:**
- Google 검색의 뉴스 탭·"주요 뉴스" 캐러셀 노출 자격은 구조화 데이터가 사실상 전제조건이다.
- 일반 검색 결과에서도 썸네일·발행일이 붙은 리치 결과로 표시될 수 있어 같은 순위에서도 클릭률이 올라간다.
- 뉴스는 최신성이 랭킹에 크게 작용하므로 `datePublished` 명시가 중요하다.

**구현 노트:**
- Next.js 공식 권장대로 native `<script type="application/ld+json">` 태그로 렌더링한다 (`next/script` 아님).
- XSS 방지를 위해 `JSON.stringify(...).replace(/</g, '\\u003c')` 이스케이프를 반드시 유지할 것. 기사 제목 등 외부 데이터가 페이로드에 들어가기 때문이다.
- 기사의 `publisher`는 `{ "@id": "https://atleti.kr/#organization" }` 참조로 연결한다. 조직 정보를 중복 선언하지 말 것.
- 검증: [Rich Results Test](https://search.google.com/test/rich-results)에 뉴스 상세 URL 입력.

### 브랜드 별칭 전략 (알레띠 / 아틀레티 / 아틀레띠)

두 표기 모두 검색에 걸리게 하는 요청의 구현 방식:

| 위치 | 내용 |
|---|---|
| JSON-LD `alternateName` | `["알레띠 KR", "아틀레띠 KR", "알레티 KR", "Atleti KR"]` — Google이 사이트 이름의 변형 표기를 인식하는 공식 채널 |
| `description` | "아틀레티코 마드리드(알레띠) 팬들을 위한..." — 실제 노출 텍스트에 별칭 포함 |
| `keywords` | 별칭 표기 나열 (효과는 미미하지만 유지) |

핵심은 **노출 이름은 "아틀레티 KR" 하나로 통일하고, 별칭은 alternateName과 본문 텍스트로 커버**하는 것. 별칭을 title에 섞으면 1번 원칙(일관된 신호)이 다시 깨진다.

## 3. OG 이미지

**무엇을:** `src/app/opengraph-image.tsx` — `ImageResponse`로 빌드 시 생성되는 1200×630 브랜드 이미지. 기존에 `layout.tsx`의 `openGraph.images` / `twitter.images`에 있던 512×512 로고(`/icon.png`) 참조는 제거.

**왜:** `twitter:card`를 `summary_large_image`(큰 가로형 카드)로 선언해놓고 실제 이미지는 정사각형 로고여서, 공유 시 이미지가 잘리거나 흐릿하게 확대됐다. 1200×630은 트위터·페이스북·카카오톡 공통 권장 규격이다.

**동작 방식 (우선순위):**
- 파일 컨벤션(`opengraph-image.tsx`)은 같은 세그먼트의 config 메타데이터보다 우선한다. 그래서 `layout.tsx`에서 이미지 항목을 제거했다.
- 더 깊은 세그먼트의 `generateMetadata`가 최종적으로 이긴다. 즉 **홈/어바웃은 브랜드 OG 이미지, 뉴스 상세는 기사 이미지**가 나간다. 뉴스 상세의 `openGraph.images`를 지우면 기사 이미지 대신 브랜드 이미지가 나가버리니 주의.

**한글 폰트 주의:** `ImageResponse`(satori)의 기본 폰트는 라틴 글리프만 지원한다. 한글을 넣으면 깨진다(tofu). 그래서 이미지 내 텍스트는 "ATLETI KR" 등 라틴 문자만 사용하고, 한글 브랜드명은 `alt` export에 넣었다. 이미지에 한글을 넣어야 한다면 Noto Sans KR 등의 폰트 파일을 fetch해서 `fonts` 옵션으로 전달해야 한다.

## 트러블슈팅 사례 (2026-07)

실제로 발견하고 고친 문제들. 같은 증상이 재발하면 여기부터 확인할 것.

### 사례 1: OG url이 존재하지 않는 도메인을 가리킴

- **증상:** 뉴스 상세 페이지의 canonical은 `atleti.kr`인데 `og:url`은 `alleti.kr`(오타, 미보유 도메인)로 렌더링됨. 검색엔진 입장에서 공식 주소 신호가 서로 모순.
- **원인:** `news/[id]/page.tsx`의 `generateMetadata`에 URL이 문자열로 하드코딩되어 있었고, 오타(`alleti`)가 그대로 들어감. 같은 파일에서 사이트 이름도 "알레띠 KR"로 하드코딩되어 루트 레이아웃의 "아틀레티 KR"과 어긋나 있었음.
- **해결:** 도메인을 `atleti.kr`로 수정하고, title은 사이트 이름을 직접 붙이는 대신 루트 템플릿(`%s | 아틀레티 KR`)에 맡기도록 변경.
- **재발 방지:** 절대 URL 하드코딩을 피하고 `metadataBase` 기준 상대 경로를 쓸 것. 페이지 title에 사이트 이름을 직접 붙이지 말 것.

### 사례 2: 뉴스 사이트인데 구조화 데이터가 전혀 없음

- **증상:** 기사 페이지가 Google에 일반 웹문서로만 인식됨. 뉴스 탭·"주요 뉴스" 캐러셀 노출 자격이 없고, 검색 결과에 썸네일·발행일이 붙지 않음.
- **원인:** JSON-LD를 처음부터 넣지 않았음. meta 태그(title/description/OG)만으로 충분하다고 생각하기 쉽지만, 뉴스 리치 결과는 `NewsArticle` 스키마가 사실상 전제조건.
- **해결:** `layout.tsx`에 `WebSite` + `NewsMediaOrganization`, `news/[id]/page.tsx`에 기사별 `NewsArticle` JSON-LD 추가. 기사 제목 등 외부 데이터가 들어가므로 `.replace(/</g, '\\u003c')` XSS 이스케이프 적용.
- **검증:** [Rich Results Test](https://search.google.com/test/rich-results)에 뉴스 상세 URL을 넣어 NewsArticle이 인식되는지 확인.

### 사례 3: 공유 카드 이미지가 잘리거나 흐리게 나옴

- **증상:** 트위터/카카오톡에 홈 링크를 공유하면 큰 이미지 카드 자리에 512×512 로고가 잘리거나 흐릿하게 확대되어 표시됨.
- **원인:** `twitter:card`는 `summary_large_image`(1200×630 가로형 카드)로 선언해놓고 실제 이미지는 정사각형 아이콘(`/icon.png`)을 지정 — 선언과 실물의 규격 불일치.
- **해결:** `src/app/opengraph-image.tsx` 파일 컨벤션으로 1200×630 브랜드 이미지를 빌드 시 생성하고, `layout.tsx`의 `openGraph.images`/`twitter.images`에서 아이콘 참조를 제거(파일 컨벤션이 같은 세그먼트의 config보다 우선하므로 남겨두면 혼선만 생김).
- **함정 두 가지:**
  - `ImageResponse`에 한글을 넣으면 기본 폰트에 한글 글리프가 없어 깨진다. 이미지 텍스트는 라틴 문자만 사용 중 (상세는 [3. OG 이미지](#3-og-이미지) 참고).
  - 뉴스 상세의 `openGraph.images`(기사 이미지)는 지우면 안 됨 — 지우면 루트 브랜드 이미지가 기사 이미지를 덮는다.
- **검증:** 카드 미리보기가 안 바뀌면 코드 문제가 아니라 플랫폼 캐시일 수 있음 — 아래 체크리스트의 캐시 초기화 도구 사용.

## 배포 후 체크리스트

- [ ] Google Search Console에 sitemap 재제출 (`https://atleti.kr/sitemap.xml`)
- [ ] 네이버 서치어드바이저에 사이트 등록 + sitemap 제출 — 한국 대상 트래픽에는 이게 가장 직접적이다
- [ ] Rich Results Test로 뉴스 상세 페이지 NewsArticle 스키마 검증
- [ ] 트위터/카카오톡에 홈·뉴스 상세 링크를 공유해 카드 미리보기 확인 (캐시가 남아있으면 [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/), [카카오 캐시 초기화](https://developers.kakao.com/tool/debugger/sharing)로 갱신)
