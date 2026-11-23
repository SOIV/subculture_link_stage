# SCLS Onstage

SCLS(Subculture Link Stage)의 사용자 공개 웹. [SCLS 공개 API](../../docs/plan/08-api-and-ics.md)만 소비하며, 내부 DB나 Private `scls-platform`에는 직접 접근하지 않는다(전체 아키텍처는 [docs/plan/03-architecture-and-domain.md §3.2.1](../../docs/plan/03-architecture-and-domain.md#321-repository-구조-확정) 참고). Phase 1 범위는 메인 페이지, 행사 목록·필터·검색·상세와 ICS 구독 링크이며, 사용자 제보/수정 요청 같은 이후 기능은 아직 없다([docs/plan/02-users-and-scope.md §2.2.1](../../docs/plan/02-users-and-scope.md#221-core-mvp-기능-phase-1)). 목록의 검색어(`q`)와 태그 그룹별 조건(같은 그룹 "또는", 그룹 사이 "그리고")은 공개 API가 지원해야 동작한다([docs/plan/08-api-and-ics.md §8.2](../../docs/plan/08-api-and-ics.md#82-공개-api-예시)) — API를 먼저 배포한 뒤 Onstage를 배포한다.

## 개발 서버 실행

```bash
pnpm install
pnpm dev
```

`.env.example`을 복사해 `.env`를 만들고 `PUBLIC_API_BASE_URL`을 실제 API 주소로 설정한다(현재는 임시 도메인). 로컬 API를 붙여 개발할 때는 `http://localhost:3000/v1`(`scls-platform`의 `pnpm dev:api`)로 바꾼다. `.env`는 저장소에 올라가지 않는다.

## 검사

```bash
pnpm check    # 타입 검사 (check:types = wrangler types 확인, check:app = svelte-check)
pnpm lint     # prettier + eslint
pnpm format   # prettier 자동 정리
pnpm test     # 단위 테스트(vitest) — 날짜·일정 상태·API 응답 검사·service worker 캐시
pnpm build    # 운영 빌드 (Cloudflare 어댑터)
```

- `check:types`는 `.env.example`을 읽어 변수 이름만 맞춰 본다. 그래서 `.env`가 없어도 통과한다. `check:app`·`build`·`test`는 `PUBLIC_API_BASE_URL` 값이 있어야 한다(`.env` 또는 환경 변수).
- `worker-configuration.d.ts`는 wrangler가 만드는 파일이라 직접 고치거나 prettier·eslint로 정리하지 않는다(`.prettierignore`·`eslint.config.js`에서 제외). 내용을 바꿔야 하면 `pnpm gen`으로 다시 만든다.
- 저장소 루트의 `.gitattributes`가 텍스트 파일을 LF로 받게 한다. Windows에서 이 파일이 생기기 전에 받은 체크아웃이 CRLF면 prettier와 `wrangler types --check`가 실패한다 — 작업 내용이 없을 때 파일을 지우고 다시 받으면(`git rm --cached -r . && git reset --hard`) LF가 된다.
- 테스트는 서버(Cloudflare Workers)와 같은 UTC 시간대로 돈다. 날짜 계산이 실행 환경 시간대에 기대면 테스트가 잡는다.
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
│  ├─ dates.ts               일정 시간대 기준 날짜 계산(같은 날·종일 마지막 날)
│  ├─ clock.svelte.ts        화면 공통 "지금" 시각(15분 경계·화면 복귀 때 갱신)
│  ├─ pwa.svelte.ts          service worker와 앱 연결(새 버전 안내, 첫 방문 저장, 저장본 안내)
│  ├─ sw/cache.ts            service worker 캐시 도우미(저장 실패해도 네트워크 응답 유지)
│  ├─ url.ts                 외부 주소를 http(s)만 링크로 만들기
│  ├─ filters.ts             행사 목록의 검색·필터 조건(URL 쿼리와 1:1)
│  └─ components/            Header, SettingsMenu(언어·화면 모드), Footer, EventCard,
│                            FilterBar(휴대폰에서는 아래에서 올라오는 시트), CountryBadge(국기),
│                            PromotedEvents(광고 자리), UpcomingSchedules, OfflineNotice,
│                            UpdateNotice
├─ service-worker.ts          오프라인 보기(본 페이지·API 응답 저장) — SvelteKit이 자동 등록
└─ routes/
   └─ [[lang=lang]]/         메인(/), events(목록+검색+필터), events/[slug](상세), +error,
                             manifest.webmanifest(언어별 설치 정보)
static/icons/                 앱 아이콘(임시 — 디자인 확정 전)
```

## 휴대폰·PWA

- 휴대폰 폭(약 360~430px)에서 가로 스크롤이 없고, 누르는 곳은 40px 이상, 입력칸 글자는 16px 이상(아이폰 확대 방지)으로 둔다. 넓은 화면 크기는 `sm:` 이상에서 따로 준다.
- 홈 화면에 설치할 수 있다(언어별 매니페스트, 아이콘은 임시). 한 번 본 페이지는 통신이 끊겨도 다시 열린다 — 동작은 `src/service-worker.ts` 위 주석 참고. 저장본을 보여줄 때는(오프라인, API만 실패, 4초 넘게 느림) 헤더 아래에 "저장본·마지막 확인 시각"을 띄운다. 14일 넘은 저장본은 쓰지 않는다.
- 새로 배포하면 새 service worker는 설치 뒤 **기다린다**. 열린 화면에 "새 버전이 있어요 · 새로 고침" 안내가 뜨고, 누르거나 사이트 탭을 모두 닫으면 새 버전으로 바뀐다. 그때 지난 버전 저장본을 지우고 다시 본 페이지부터 저장된다. 서버는 HTML에 앱 버전(`x-scls-version`)을 붙이고, worker는 다른 버전의 HTML을 저장하지 않는다.
- 첫 방문한 페이지(와 그 언어의 시작 화면)는 worker가 처음 페이지를 맡을 때 저장한다.
- 개발 서버(`pnpm dev`)에서도 service worker가 등록된다. 이상하면 브라우저 개발자 도구 → Application → Service workers에서 해제한다.
- 오프라인 시험은 운영 빌드로 한다(`pnpm build` 뒤 `pnpm preview`). Windows에서는 `pnpm preview`를 띄운 채 다시 빌드하면 `.svelte-kit/cloudflare`가 잠겨 지난 빌드가 그대로 나간다 — 미리보기를 멈추고 빌드한다. 페이지를 몇 개 본 뒤 서버를 끄고 다시 연다(개발자 도구로 할 때는 Network의 Offline이 아니라 Application → Service workers의 Offline을 켠다 — Network 쪽은 service worker의 요청까지 막지 못할 수 있다).

## 배포

Cloudflare(`adapter-cloudflare`, Workers)로 배포한다([docs/plan/10-infra-ops-security.md §10.1.2](../../docs/plan/10-infra-ops-security.md#1012-배포-구조-예시) 결정 사항). Node 전용 라이브러리 의존을 지양하고 공개 API `fetch` 위주로 유지한다. 현재 임시 도메인으로 초기 배포해 테스트 중이다.

Cloudflare 대시보드의 Git 연결(Workers Builds)로 푸시할 때마다 자동 빌드·배포하며, 설정값은 다음과 같다.

| 칸            | 값                                                                                                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 루트 디렉터리 | `apps/onstage`                                                                                                                                                                      |
| 빌드 명령     | `pnpm exec vite build` (빌드만 한다. 2026-11-23부터 `pnpm build`도 `.env` 없이 돌지만, 배포 설정은 바꾸지 않았다)                                                                   |
| 빌드 변수     | `PUBLIC_API_BASE_URL` = 공개 API 주소(`…/v1`). 빌드 때 코드에 박히므로 _런타임_ 변수가 아니라 **빌드** 변수에 넣어야 한다. 콘텐츠 보안 정책(CSP)의 `connect-src`도 이 값에서 만든다 |
| Worker 이름   | `wrangler.jsonc`의 `name`과 Cloudflare 프로젝트 이름이 같아야 한다                                                                                                                  |
| 배포 명령     | 기본값                                                                                                                                                                              |

시크릿이나 API 쪽 허용 주소 등록은 필요 없다(공개 GET만 쓴다). 보안 헤더(CSP·`X-Frame-Options`·`nosniff`·`Referrer-Policy`)는 앱이 페이지 응답에 직접 붙인다(`vite.config.ts`의 `csp`, `src/hooks.server.ts`). 글꼴·API 외의 외부 스크립트·이미지를 쓰게 되면 CSP에 그 주소를 더해야 한다. `pnpm-workspace.yaml`에는 `packages`가 있어야 한다. 없으면 오래된 pnpm에서 `pnpm install`이 실패한다.
