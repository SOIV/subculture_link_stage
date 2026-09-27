# Subculture Onstage

SCLS(Subculture Link Stage)의 사용자 공개 웹. [SCLS 공개 API](../../docs/plan/08-api-and-ics.md)만 소비하며, 내부 DB나 Private `scls-platform`에는 직접 접근하지 않는다(전체 아키텍처는 [docs/plan/03-architecture-and-domain.md §3.2.1](../../docs/plan/03-architecture-and-domain.md#321-repository-구조-확정) 참고). Phase 1 범위는 행사 목록·필터·검색·상세와 ICS 구독 링크이며, 사용자 제보/수정 요청 같은 이후 기능은 아직 없다([docs/plan/02-users-and-scope.md §2.2.1](../../docs/plan/02-users-and-scope.md#221-core-mvp-기능-phase-1)).

## 개발 서버 실행

```bash
pnpm install
pnpm dev
```

`.env.example`을 복사해 `.env`를 만들고 `PUBLIC_API_BASE_URL`을 실제 API 주소로 설정한다(현재는 임시 도메인).

## 구조

```text
src/
├─ params/lang.ts           로케일 URL 접두사 매처(ja, en만 — ko는 접두사 없음)
├─ lib/
│  ├─ api.ts                공개 API(/v1) 클라이언트, 응답 타입
│  ├─ i18n.ts                UI 문구 사전(ko/ja/en)과 로케일 경로 헬퍼
│  ├─ format.ts               날짜·상태·태그 코드값 → 문구 변환
│  └─ components/            Header, Footer, EventCard, FilterBar, LocaleSwitcher
└─ routes/
   └─ [[lang=lang]]/         홈(행사 목록+필터), events/[slug](상세), search
```

## 배포

Cloudflare(`adapter-cloudflare`, Workers)로 배포한다([docs/plan/10-infra-ops-security.md §10.1.2](../../docs/plan/10-infra-ops-security.md#1012-배포-구조-예시) 결정 사항). Node 전용 라이브러리 의존을 지양하고 공개 API `fetch` 위주로 유지한다.
