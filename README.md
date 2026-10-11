# ATLETI NEWS Frontend

아틀레티코 마드리드 뉴스·커뮤니티 플랫폼 ([atleti.kr](https://atleti.kr))의 프론트엔드입니다.

## 🛠 Tech Stack
- **Next.js 16 · React 19 · TypeScript 5**
- **Tailwind CSS 4**
- **WebSocket** (매치 채팅 실시간 통신)

## ✨ Key Features
- **SSR 뉴스 페이지**: 기사마다 고유 주소를 부여하고 서버에서 HTML을 완성해 검색엔진이 페이지 단위로 수집하도록 구현
- **실시간 매치 채팅방**: 메시지와 라이브 스코어를 WebSocket으로 받아 표시
- **테마 디자인**: 아틀레티코 마드리드 홈·어웨이 유니폼 컬러를 활용한 라이트·다크 모드

## 🎨 Design Decisions
- 뉴스는 검색 노출이 목적이라 **SSR**, 채팅은 1초 단위로 바뀌는 데이터라 **CSR**로 화면별로 렌더링 방식을 나눴습니다.
