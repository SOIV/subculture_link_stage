# Subculture Onstage

SCLS(Subculture Link Stage)의 사용자 공개 웹. [SCLS 공개 API](../../docs/plan/08-api-and-ics.md)만 소비하며, 내부 DB나 Private `scls-platform`에는 직접 접근하지 않는다(전체 아키텍처는 [docs/plan/03-architecture-and-domain.md §3.2.1](../../docs/plan/03-architecture-and-domain.md#321-repository-구조-확정) 참고). Phase 1 범위는 메인 페이지, 행사 목록·필터·검색·상세와 ICS 구독 링크이며, 사용자 제보/수정 요청 같은 이후 기능은 아직 없다([docs/plan/02-users-and-scope.md §2.2.1](../../docs/plan/02-users-and-scope.md#221-core-mvp-기능-phase-1)). 목록의 검색어(`q`)와 태그 그룹별 조건(같은 그룹 "또는", 그룹 사이 "그리고")은 공개 API가 지원해야 동작한다([docs/plan/08-api-and-ics.md §8.2](../../docs/plan/08-api-and-ics.md#82-공개-api-예시)) — API를 먼저 배포한 뒤 Onstage를 배포한다.

## 개발 서버 실행

```bash
pnpm install
pnpm dev
```

`.env.example`을 복사해 `.env`를 만들고 `PUBLIC_API_BASE_URL`을 실제 API 주소로 설정한다(현재는 임시 도메인). 로컬 API를 붙여 개발할 때는 `http://localhost:3000/v1`(`scls-platform`의 `pnpm dev:api`)로 바꾼다. `.env`는 저장소에 올라가지 않는다.

## 검사

```bash
pnpm check    # 타입 검사 (wrangler types 확인 + svelte-check)
pnpm lint     # prettier + eslint
pnpm format   # prettier 자동 정리
pnpm build    # 운영 빌드 (Cloudflare 어댑터)
```

- `worker-configuration.d.ts`는 wrangler가 만드는 파일이라 직접 고치거나 prettier로 정리하지 않는다(`.prettierignore`에 등록). 내용을 바꿔야 하면 `pnpm gen`으로 다시 만든다.
- `pnpm build`가 만든 `.svelte-kit/cloudflare`가 남아 있으면 `pnpm check`의 `wrangler types --check`가 실패한다. 그 폴더를 지우면 통과한다. 개발 서버(`pnpm dev`)가 떠 있으면 폴더가 잠겨(Windows) 빌드가 실패하니 서버를 먼저 멈춘다.

## 구조

```text
src/
├─ params/lang.ts           로케일 URL 접두사 매처(ja, en만 — ko는 접두사 없음)
├─ lib/
│  ├─ api.ts                공개 API(/v1) 클라이언트, 응답 타입
│  ├─ i18n.ts                UI 문구 사전(ko/ja/en)과 로케일 경로 헬퍼
│  ├─ format.ts               날짜·상태·태그 코드값 → 문구 변환
│  ├─ tags.ts                태그 색인, 드롭다운 옵션, 카드 분류 칩 고르기
│  ├─ schedule.ts            카드의 다음 일정·D-day, 메인의 티켓·신청 임박 일정 계산
│  ├─ filters.ts             행사 목록의 검색·필터 조건(URL 쿼리와 1:1)
│  └─ components/            Header, SettingsMenu(언어·화면 모드), Footer, EventCard,
│                            FilterBar, CountryBadge(국기), PromotedEvents(광고 자리),
│                            UpcomingSchedules
└─ routes/
   └─ [[lang=lang]]/         메인(/), events(목록+검색+필터), events/[slug](상세)
```

## 배포

Cloudflare(`adapter-cloudflare`, Workers)로 배포한다([docs/plan/10-infra-ops-security.md §10.1.2](../../docs/plan/10-infra-ops-security.md#1012-배포-구조-예시) 결정 사항). Node 전용 라이브러리 의존을 지양하고 공개 API `fetch` 위주로 유지한다. 현재 임시 도메인으로 초기 배포해 테스트 중이다.

Cloudflare 대시보드의 Git 연결(Workers Builds)로 푸시할 때마다 자동 빌드·배포하며, 설정값은 다음과 같다.

| 칸 | 값 |
|---|---|
| 루트 디렉터리 | `apps/onstage` |
| 빌드 명령 | `pnpm exec vite build` (`pnpm build`는 첫 단계 `wrangler types --check`가 로컬 `.env`가 있어야 통과해 Cloudflare에서 실패한다) |
| 빌드 변수 | `PUBLIC_API_BASE_URL` = 공개 API 주소(`…/v1`). 빌드 때 코드에 박히므로 *런타임* 변수가 아니라 **빌드** 변수에 넣어야 한다 |
| Worker 이름 | `wrangler.jsonc`의 `name`과 Cloudflare 프로젝트 이름이 같아야 한다 |
| 배포 명령 | 기본값 |

시크릿이나 API 쪽 허용 주소 등록은 필요 없다(공개 GET만 쓴다). `pnpm-workspace.yaml`에는 `packages`가 있어야 한다. 없으면 오래된 pnpm에서 `pnpm install`이 실패한다.
