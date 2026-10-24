[← 작업 로그 목록](README.md) · [현재 로드맵](../plan/11-roadmap-and-success.md)

# Docs 사이트 도구 재평가 기록 (Claude)

2026-10-24에 Docs 사이트 도구를 Starlight로 확정한 뒤, 확정 근거를 다시 따져 보려고 Starlight와 Fumadocs를 요구사항 기준으로 재평가한 기록이다. Claude(Sonnet 5.5)가 작성했다. 같은 주제의 별도 평가(Codex)와 선택이 갈려 비교하기 쉽게 분리해 두었으며, 그 평가의 내용은 이 문서에 없다.

- 단계·성격: Phase 2 사전 결정 / 검토 중. 확정이 아니다.
- 범위: 문서 조사와 평가, 추천까지. 도구 설치, 구현, 실행 검증은 하지 않았다.
- 이전 기록과의 관계: [2026-10 작업 로그](2026-10.md)의 "API Docs 사이트 도구 확정(Starlight)"과 [08 §8.5.3](../plan/08-api-and-ics.md#853-문서-사이트-도구-확정)은 고치지 않았다. 이 평가를 채택하면 고쳐야 할 곳은 [후속](#후속)에 적었다.
- 표기: 별도 표시가 없는 내용은 공식 문서나 소스에서 확인한 사실이다. **(판단)** 은 작성자의 추정, **(검증)** 은 실행해 봐야 알 수 있는 부분이다.

## 찾아보기

- [요약](#요약)
- [1. 저장소에서 도출한 요구사항](#1-저장소에서-도출한-요구사항)
- [2. 비교한 구성](#2-비교한-구성)
- [3. 요구사항별 충족도](#3-요구사항별-충족도)
- [4. 필수 조건과 중요 조건 판단](#4-필수-조건과-중요-조건-판단)
- [5. 보완 방법과 유지보수 부담](#5-보완-방법과-유지보수-부담)
- [6. 추천](#6-추천)
- [7. 최소 검증(PoC) 범위](#7-최소-검증poc-범위)
- [8. 이전 주장 중 바로잡은 것](#8-이전-주장-중-바로잡은-것)
- [9. 근거와 한계](#9-근거와-한계)
- [후속](#후속)

## 요약

- `starlight-openapi` 단독 구성은 탈락이다. 플레이그라운드가 없고, 생성되는 페이지의 UI 문구가 영어로 고정돼 있다.
- 잠정 추천은 **Starlight 유지, API 레퍼런스는 Scalar** 이다. Fumadocs는 대조군이자 전환 후보다.
- 필수 조건은 Starlight+Scalar와 Fumadocs 모두 충족 가능하다. 다만 확인할 항목이 남아 있다.
- 중요 조건의 90% 충족은 지금 근거로 약속할 수 없다. 문서 기준 추정은 Starlight+Scalar 약 80%, Fumadocs 약 70%이고, 확인할 항목이 모두 통과하면 각각 약 89%, 약 93%까지 오를 수 있다.
- 확신도는 중간이다. 두 구성의 점수 차이는 오차 범위 안이라 최소 검증(PoC) 전에는 확정할 수 없다.

## 1. 저장소에서 도출한 요구사항

### 구현 완료와 계획의 구분

| 구분 | 내용 | 근거 |
|---|---|---|
| 구현됨 | 공개 API `/v1`: `events`, `events/:slug`, `event-series`, `schedules`, `venues`, `tags`, `search`, `health`, `calendars/*.ics` | [08 §8.2](../plan/08-api-and-ics.md#82-공개-api-예시), Private `scls-platform`의 `apps/api/src/server.ts`, `apps/api/src/routes/public-*.ts` |
| 구현됨 | 응답은 `{success, data}`, 오류는 `{success:false, error}`. 요청 제한은 IP당 분당 600회 기본값이고 초과하면 `RATE_LIMITED`를 돌려준다 | `apps/api/src/lib/public-hardening.ts` |
| 구현됨 | `/v1`은 CORS를 전체 허용한다(GET·HEAD·OPTIONS). 다른 도메인의 문서 사이트에서 브라우저가 직접 요청할 수 있어 플레이그라운드용 프록시가 필요 없다 | `apps/api/src/server.ts` |
| 구현됨 | `locale`은 `ko`·`ja`·`en`만 받고, 그 밖의 값(`ko-KR` 등)은 오류 없이 `ko`로 처리한다 | `packages/domain/src/locale.ts`, `apps/api/src/lib/resolve-locale.ts` |
| 구현됨 | ICS 피드는 `text/calendar`로 응답한다. 플레이그라운드가 JSON이 아닌 응답도 보여 줘야 한다 | `apps/api/src/routes/public-calendars.ts` |
| 구현 없음 | OpenAPI 스펙과 Fastify 라우트 스키마가 없다. Zod 검증은 수동으로 하고 응답은 함수로 조립하므로, 스펙은 직접 쓰거나 변환 도구가 필요하다 | `apps/api/package.json`, `apps/api/src/routes/public-events.ts` |
| 구현됨 | Onstage는 SvelteKit·Cloudflare로 ko/ja/en UI를 제공한다. Backstage는 React SPA이고 ko/en/ja UI를 지원한다 | `apps/onstage`(이 저장소), [로드맵 Phase 1](../plan/11-roadmap-and-success.md) |
| 계획만 있음 | OpenAPI 스펙과 Docs는 Phase 2에서 비공개로 착수하고 Phase 3에서 공개한다. Docs 사이트 구현은 미착수다 | [08 §8.5.1](../plan/08-api-and-ics.md#851-단계별-계획), [로드맵](../plan/11-roadmap-and-success.md) |
| 계획만 있음 | `/v1/changes`, `/events/upcoming`, franchises, 위젯·JS SDK(Phase 5~6), 디스코드 예제(Phase 5), API Key·개발자 콘솔(Phase 6), 응답의 `translation` 객체 | 08 §8.1.1, §8.3, §8.4 |
| 인프라 제약 | Onstage·Backstage·위젯은 Cloudflare 정적/엣지에 올리고, 서버 프로세스는 API뿐이다 | [10 §10.1.2](../plan/10-infra-ops-security.md#1012-배포-구조-예시) |
| 인프라 제약 | 개발자 문서는 공식 공개 저장소에서 관리한다 | [01 §1.6.3](../plan/01-overview-and-principles.md#163-소스-공개-및-참여-정책), [03 §3.2.1](../plan/03-architecture-and-domain.md#321-repository-구조-확정) |

설계 문서의 `locale=ko-KR` 예시(08 §8.2, §8.6.2)는 구현과 다르다. Docs 본문은 구현 기준으로 써야 한다.

### 요구사항 등급

사용자가 전달한 조건과 위 근거를 바탕으로 작성자가 등급을 나눴다. 등급을 바꾸면 다시 평가해야 한다. 플레이그라운드(I1)를 필수로 올려도 결론은 같다. 탈락한 구성은 필수 M4에서 이미 걸러지고, 나머지 두 구성은 모두 플레이그라운드를 제공한다.

| ID | 요구사항 | 등급 |
|---|---|---|
| M1 | 가이드의 언어별 본문·제목·사이드바·URL과 같은 페이지 언어 전환 | 필수 |
| M2 | 번역이 없는 페이지의 기본 언어 대체 표시. 1인 운영이라 번역이 점진적일 것이라는 판단이다 **(판단)** | 필수 |
| M3 | OpenAPI 3.x에서 API 레퍼런스 생성 | 필수 |
| M4 | 레퍼런스·플레이그라운드의 UI 문구를 한·일·영으로 제공 | 필수 (공개 시점) |
| M5 | 엔드포인트·파라미터·응답 설명 본문을 언어별로 관리하고 렌더링 | 필수 (공개 시점) |
| M6 | 위 기능과 검색이 정적 배포에서 함께 동작 | 필수 |
| M7 | 마크다운 가이드, 코드 예제, ICS 연동 가이드 작성 | 필수 |
| I1 | 실제 요청을 보내는 플레이그라운드 (가중치 25) | 중요 |
| I2 | 검색 UI 번역과 언어별 검색 결과 (15) | 중요 |
| I3 | 한국어·일본어 검색 품질 (10) | 중요 |
| I4 | 미번역 안내 표시 (5) | 중요 |
| I5 | 스펙 변경 시 번역·생성 문서를 함께 갱신하는 흐름 (15) | 중요 |
| I6 | 레퍼런스와 가이드의 일관성: 언어 전환, 사이드바, 검색 (15) | 중요 |
| I7 | 1인 유지보수 부담 (15) | 중요 |
| L1~L4 | 문서 버전(`/v2`), 위젯·SDK·디스코드 예제·API Key 콘솔 문서, Phase 2 비공개 접근 제한, Onstage·Backstage 사용 안내 | 추후·부가 (두 도구 차이 없음) |

## 2. 비교한 구성

| 약칭 | 구성 | 비고 |
|---|---|---|
| S-A | Starlight + `starlight-openapi` | 커뮤니티 플러그인 |
| S-B | Starlight + Scalar(`@scalar/astro`) | Scalar 공식 Astro 통합 |
| F | Fumadocs(Next.js `output: 'export'`) + `fumadocs-openapi` | 공식 별도 패키지 |

Fumadocs가 공식 지원하는 프레임워크는 Next.js, Astro(React 사용), TanStack Start, React Router, Waku다. 정적 배포 설정은 프레임워크마다 따로 있다. 이 평가에서는 가장 문서화가 잘 된 Next.js 정적 export를 기준으로 했다.

npm 레지스트리에서 2026-10-24에 조회한 최신 버전이다.

| 패키지 | 버전 | 발행일 |
|---|---|---|
| `@astrojs/starlight` | 0.42.7 | 2026-10-23 |
| `astro` | 7.4.2 | 2026-10-21 |
| `starlight-openapi` | 0.27.0 (Starlight 0.41 이상, Astro 7.0.2 이상 필요) | 2026-10-07 |
| `starlight-versions` | 0.10.1 | 2026-08-26 |
| `pagefind` | 1.5.2 | 2026-04-12 |
| `fumadocs-core`, `fumadocs-ui` | 16.17.8 | 2026-10-23 |
| `fumadocs-openapi` | 12.5.5 | 2026-10-23 |
| `@scalar/astro` | 0.4.31 | 2026-10-23 |
| `@scalar/api-reference` | 1.76.0 | 2026-10-23 |
| `next` | 16.4.3 | 2026-10-23 |

## 3. 요구사항별 충족도

값은 `기본 지원` / `설정으로 충족` / `외부 도구로 충족` / `자체 구현 필요` / `미확인` / `미충족` 중 하나다.

| 요구사항 | S-A | S-B | F |
|---|---|---|---|
| 가이드 언어별 본문·제목·사이드바·URL (M1) | 기본 지원 | 기본 지원 | 설정으로 충족: `[lang]` 라우트 배선, 파일은 `.ko.mdx` 또는 언어 폴더, 사이드바는 `meta.ko.json` |
| 같은 페이지 언어 전환 (M1) | 기본 지원 | 기본 지원 | 설정으로 충족: 소스상 경로의 로케일 구간을 바꿔 이동 |
| 미번역 시 기본 언어 대체 (M2) | 기본 지원 | 기본 지원 | 설정으로 충족: `fallbackLanguage` |
| 미번역 안내 표시 (I4) | 기본 지원 | 기본 지원 | 미확인: 문서에서 찾지 못했고 자체 구현 가능성이 있다 |
| 사이트 UI 한·일 번역 (M1) | 기본 지원: ko·ja 내장 | 기본 지원 | 자체 구현 필요: 공식 언어 팩은 zh-CN·zh-TW뿐 |
| 검색 UI 번역·언어별 결과 (I2) | 기본 지원: Pagefind가 `html lang`별로 색인, UI는 한·일 번역 포함 | 기본 지원 (가이드 한정) | 설정으로 충족: `locale` 전달, UI 문구는 직접 번역 |
| 한·일 검색 품질 (I3) | 미확인: CJK 분절은 지원하나 형태소 분석은 없고 관련 이슈가 열려 있다 | 같음. 다만 Scalar 레퍼런스는 Pagefind에 잡히지 않는다 **(판단)** | 미확인: 일본어는 명시돼 있고 한국어는 문서에 없다 |
| 스펙에서 레퍼런스 생성 (M3) | 외부 도구로 충족 | 외부 도구로 충족 | 기본 지원 |
| 플레이그라운드 (I1) | 미충족 | 기본 지원: Scalar Test Request | 기본 지원: 서버 선택·인증 포함 |
| 레퍼런스 UI 문구 번역 (M4) | 미충족: 영어 고정 | 설정으로 충족: ko·ja 문구는 직접 번역 | 설정으로 충족: ko·ja 문구는 직접 번역 |
| 설명 본문 번역 (M5) | 자체 구현 필요: 로케일별 스펙, 비공식 우회 | 자체 구현 필요: 로케일별 스펙 | 자체 구현 필요: 로케일별 스펙 |
| 스펙 변경 시 갱신 (I5) | 자체 구현: CI 검사 | 자체 구현: CI 검사 | 자체 구현: CI 검사와 MDX 생성 단계 |
| 정적 배포 (M6) | 기본 지원: 어댑터 불필요 | 기본 지원 | 설정으로 충족: `proxy`·redirects·rewrites 사용 불가 |
| 4개 기능 동시 동작 (M6) | 미확인 | 미확인: Starlight 안에 Scalar 배치 | 미확인: 개별로만 문서화돼 있다 |

표의 근거는 다음과 같다.

### 가이드 다국어

- Starlight는 언어별 폴더와 root 로케일([i18n 가이드](https://starlight.astro.build/guides/i18n/)), 사이드바 항목의 `translations`([사이드바 가이드](https://starlight.astro.build/guides/sidebar/)), 언어 선택기가 현재 경로를 해당 로케일 경로로 바꿔 이동하는 `LanguageSelect`, 미번역 시 기본 언어 내용에 안내를 붙이는 `FallbackContentNotice`를 기본으로 제공한다. UI 번역 파일에 `ko.json`·`ja.json`·`en.json`이 모두 들어 있다.
- Fumadocs는 `defineI18n({ languages, defaultLanguage, fallbackLanguage, hideLocale, parser })`로 설정한다([i18n 설정](https://www.fumadocs.dev/docs/headless/internationalization/config), [Next.js 가이드](https://www.fumadocs.dev/docs/internationalization/next)). 페이지는 `get-started.ko.mdx`처럼 쓰거나 언어 폴더로 나누고, 사이드바는 `meta.ko.json`으로 만든다. 공식 언어 팩은 소스 저장소 기준 zh-CN·zh-TW뿐이다([UI 번역](https://www.fumadocs.dev/docs/ui/translations)).

### 검색

- Pagefind는 `html lang`별로 색인을 나누고, 한국어·일본어 UI 번역을 제공한다. 한국어는 형태소 분석(stemming)이 없고, 일본어와 중국어는 "specialized languages"로 분절만 지원한다. 이 분절은 `npx pagefind`의 기본 확장 빌드에 들어 있다([다국어 문서](https://pagefind.app/docs/multilingual/)).
- 관련 이슈: Pagefind #1237(일본어 복합어 질의에서 색인 시점과 질의 시점의 분절이 어긋남, 열림), #1211(한국어 색인이 조각나지 않아 검색마다 전체 색인을 받음, 열림), #1212(한국어 분절 추가, 닫힘).
- Fumadocs 기본 검색(ZBSearch)은 `multilingual` 모드에서 유니코드 단어 분절을 쓰고 중국어·일본어를 명시한다. 형태소 분석은 없다. 정적 모드는 클라이언트가 색인을 통째로 내려받는다([검색 문서](https://www.fumadocs.dev/docs/headless/search/orama)).

### OpenAPI

- `starlight-openapi`는 구성 옵션에 코드 스니펫(`snippets`)만 있고 요청을 보내는 기능이 없다([설정](https://starlight-openapi.vercel.app/configuration/)). 생성 컴포넌트에 `Responses`, `Parameters` 같은 헤딩이 영어로 박혀 있다. i18n 호환 이슈 [#37](https://github.com/HiDeoo/starlight-openapi/issues/37)과 UI 번역 PR [#132](https://github.com/HiDeoo/starlight-openapi/pull/132)는 열려 있고 병합되지 않았다. 유지관리자는 #132에서 "완전한 i18n에는 로케일별 페이지 생성과 로케일 인식 링크가 더 필요하다"고 했다. 한 컨트리뷰터는 로케일별 스키마에 `base: 'ja/api'`처럼 접두를 달아 쓰고 있다고 보고했지만 공식 지원은 아니다.
- Scalar는 내장 로케일이 en, ru, es, fr, de, zh-CN, zh-TW, ar, pt다. 한국어·일본어는 없지만 `localization.translations`로 문구를 덧붙일 수 있고, 빠진 키는 영어로 대체된다. OpenAPI 문서의 요약·설명 본문은 번역하지 않으므로 "번역된 OpenAPI 문서를 따로 제공"해야 한다고 적혀 있다([로컬라이제이션](https://github.com/scalar/scalar/blob/main/documentation/localization.md), [설정](https://github.com/scalar/scalar/blob/main/documentation/configuration.md)). 프록시(`proxyUrl`)는 선택 옵션이다.
- 번역 분량은 소스 파일의 문자열 항목을 정규식으로 센 추정치다. Scalar는 레퍼런스 약 200개, API 클라이언트 약 260개, 스키마 약 60개다. Fumadocs 공식 zh-CN 팩은 약 350개 항목인데 AsyncAPI·GraphQL용이 섞여 있어 이 프로젝트에 해당하는 분량은 그보다 적다.
- `fumadocs-openapi`는 기본 제공 기능으로 엔드포인트 정보, 인터랙티브 플레이그라운드, 여러 언어의 요청 예제 코드, 응답 샘플, 요청 파라미터·본문을 든다([OpenAPI 문서](https://www.fumadocs.dev/docs/integrations/openapi)). `createOpenAPI({ input })`은 스키마 ID를 키로 하는 객체를 받을 수 있고, `generateFiles`는 `per`·`groupBy`·`name` 옵션으로 파일 구성과 이름을 바꿀 수 있다. 로케일별 생성 기능은 문서에서 찾지 못했다.
- Fumadocs 플레이그라운드의 프록시(`createProxy`, `proxyUrl`)는 대상 API가 CORS를 허용하지 않을 때 쓰는 기능이고 서버 핸들러가 필요하다. `/v1`은 CORS를 전체 허용하므로 쓰지 않는다([서버 문서](https://www.fumadocs.dev/docs/integrations/openapi/server)).

### 정적 배포

- Astro 정적 사이트는 `wrangler.jsonc`의 `assets.directory`를 `dist`로 두면 Cloudflare Workers에 배포되고 어댑터가 필요 없다([Astro 문서](https://docs.astro.build/en/guides/deploy/cloudflare/)).
- Fumadocs는 기본이 서버 우선이고, Next.js는 `output: 'export'`로 정적 HTML을 내보낸다([정적 빌드](https://www.fumadocs.dev/docs/deploying/static)). Next.js 정적 export는 Proxy(미들웨어), redirects, rewrites, headers를 쓸 수 없고 Route Handler는 정적 GET만 된다([Next.js 문서](https://nextjs.org/docs/app/guides/static-exports)). Fumadocs의 Next.js i18n 가이드가 쓰는 `proxy.ts` 로케일 리다이렉트는 쓸 수 없으므로, 로케일 접두를 항상 붙이고 루트 `/`가 `/ko/`로 넘어가게 정적으로 처리해야 한다 **(판단, 검증)**.
- 서버 기능을 쓰는 Next.js 배포를 Cloudflare에 올릴 때만 OpenNext가 필요하다. 이 프로젝트의 어느 요구사항도 서버 기능이 필요하지 않다.

## 4. 필수 조건과 중요 조건 판단

### 필수 조건

필수 조건의 부족분을 다른 기능으로 상쇄하지 않았다.

- S-A: 미충족. M4(UI 영어 고정)와 M5(비공식 우회)가 걸린다.
- S-B: 충족 가능(조건부). 확인할 것은 M6의 4개 기능 동시 동작과, Scalar에서 한·일 문구가 실제로 렌더되는지다. 필수 중 불확실한 항목은 1~2개다.
- F: 충족 가능(조건부). 확인할 것은 정적 export에서 i18n·OpenAPI·검색이 함께 동작하는지, 로케일별 스펙 생성이 i18n과 맞물리는지, 로케일 접두를 항상 붙이는 라우팅이 문제없는지다. 필수 중 불확실한 항목은 3개다.

### 중요 조건 가중 충족률

점수는 충족하거나 소규모 보완으로 충족하면 1, 미확인이면 0.5, 미충족이면 0으로 매겼다. 기능 개수가 아니라 중요도를 반영한 작성자의 판단이며, 가중치와 점수는 바꿀 수 있다. 괄호 안은 가중치를 곱한 점수다.

| 항목 | 가중치 | S-A | S-B | F |
|---|---|---|---|---|
| I1 플레이그라운드 | 25 | 0 (0) | 1 (25) | 1 (25) |
| I2 검색 UI 번역·언어별 결과 | 15 | 1 (15) | 1 (15) | 1 (15) |
| I3 한·일 검색 품질 | 10 | 0.5 (5) | 0.5 (5) | 0.5 (5) |
| I4 미번역 안내 | 5 | 1 (5) | 1 (5) | 0.5 (2.5) |
| I5 스펙 변경 시 갱신 흐름 | 15 | 0.5 (7.5) | 1 (15) | 0.5 (7.5) |
| I6 레퍼런스·가이드 일관성 | 15 | 0.5 (7.5) | 0.5 (7.5) | 0.5 (7.5) |
| I7 1인 유지보수 부담 | 15 | 0.5 (7.5) | 0.5 (7.5) | 0.5 (7.5) |
| **문서 기준 합계** | 100 | 약 48 | 약 80 | 약 70 |
| **확인 항목이 모두 통과할 때 상한** | | 약 50 | 약 89 | 약 93 |

- S-B 상한은 I3를 1, I6을 0.75로 올린 값이다. 레퍼런스가 Starlight 사이드바와 검색 밖에 있는 구조라 I6은 1까지 오르기 어렵다.
- F 상한은 I3·I4·I5·I6을 1로 올린 값이다. 레퍼런스와 가이드가 같은 사이드바·검색·언어 전환을 쓰는 점이 이 구성의 강점이다.
- S-A는 플레이그라운드가 없어 상한이 낮다. Scalar를 붙이면 S-B가 된다.

어느 쪽도 현재 근거로는 90%를 약속할 수 없다. F는 상한이 높지만 확인할 항목이 많고, S-B는 기반이 더 안정적이다.

## 5. 보완 방법과 유지보수 부담

### 공통: 로케일별 OpenAPI 문서 (M5, I5)

- 소규모 방식: 공개 엔드포인트가 9개 안팎이므로 `openapi.ko/ja/en.yaml` 3개를 두고, CI에서 키 구조가 같은지 검사하는 스크립트를 자체 구현한다. 스펙을 바꿀 때마다 설명 문구 3개를 함께 갱신해야 하고, 기계번역 후 검수하는 흐름이 현실적이다 **(판단)**.
- 대안: OpenAPI Overlay Specification 1.0.0으로 기준 스펙 하나에 로케일별 오버레이를 적용해 병합할 수 있다. 이 규격은 "설명 갱신"을 용도로 들지만 번역은 언급하지 않아 번역 용도는 작성자의 추정이다([Overlay 1.0.0](https://spec.openapis.org/overlay/v1.0.0.html)). 도구 선택은 따로 조사해야 한다.
- 스펙 작성 방식(Spec-first 대 Code-first)은 [08 §8.5.2](../plan/08-api-and-ics.md#852-미결-사항)의 별도 미결 사항이며, 어느 도구든 영향이 없다.

### S-B (Starlight + Scalar)

- 로케일별로 `/ko/api/`, `/ja/api/`, `/en/api/` 페이지를 만들어 해당 언어 스펙과 Scalar를 연결한다. Scalar의 `url`, `showSidebar`, `hideSearch` 옵션으로 Starlight 레이아웃 안에 배치하는 방식을 PoC에서 확인한다 **(검증)**.
- Scalar 한·일 문구를 직접 번역해야 한다. 빠진 키는 영어로 대체되므로 점진적으로 번역할 수 있다.
- Pagefind는 클라이언트에서 렌더되는 Scalar 내용을 색인하지 못하므로 **(판단)**, 레퍼런스 검색은 Scalar 자체 검색에 맡겨야 한다.
- 의존성은 `astro`, `@astrojs/starlight`(0.x), `@scalar/astro`(0.x), Pagefind다. Scalar는 릴리스가 매우 빠르므로 버전을 고정하고 주기적으로 올려야 한다.

### F (Fumadocs)

- `proxy.ts`를 쓰지 않고 로케일 접두를 항상 붙이는 정적 라우팅으로 구성한다 **(검증)**.
- 한·일 UI 번역 사전을 직접 만든다. 미번역 안내 컴포넌트는 자체 구현해야 할 수 있다 **(검증)**.
- 로케일별 스펙은 `createOpenAPI({ input: { ko, ja, en } })`로 받고, 페이지는 `generateFiles`를 로케일별로 실행해 만든다. `name` 옵션으로 `.ko.mdx` 같은 파일명을 만드는 방식과 `staticSource` 방식이 있으며, i18n 규칙과 맞물리는지는 추정이다 **(판단, 검증)**.
- 검색은 정적 모드로 설정한다. 클라이언트가 색인을 통째로 내려받는다.
- 의존성은 `fumadocs-core`·`fumadocs-ui` 16.x, `fumadocs-openapi` 12.x, `next` 16.x와 React다. 모두 2026-10-23에 릴리스됐고, 2024년 1월에 처음 나온 패키지가 벌써 16.x다. 업그레이드 주기를 정해 두는 편이 안전하다 **(판단)**.

## 6. 추천

잠정 추천은 **Starlight 유지, API 레퍼런스는 `starlight-openapi`가 아니라 Scalar** 다. 이유는 다음과 같다.

1. 필수 조건에서 불확실한 항목이 적다. S-B는 1~2개, F는 3개다.
2. 가이드 다국어가 설정만으로 끝난다. 한·일 UI 문구와 미번역 안내가 이미 들어 있다.
3. 구성 요소가 서로 독립적이다. Scalar 연동이 마음에 들지 않으면 레퍼런스만 단독 페이지로 빼면 되므로 최악의 경우에도 피해 범위가 작다.
4. Fumadocs가 앞서는 점은 레퍼런스와 가이드가 한 사이트 안에서 같은 사이드바·검색·언어 전환을 쓴다는 것이다. 다만 그 효과는 확인하지 못한 세 조합이 모두 동작해야 얻을 수 있다.

Fumadocs로 바꿔야 할 신호는 다음과 같다.

- Scalar를 Starlight에 넣었을 때 이중 내비게이션, 테마 불일치, 검색 분리가 수용할 수 없는 수준일 때
- Scalar 한·일 번역이 과도하게 큰 작업으로 판명될 때
- Fumadocs PoC가 아래 합격선을 전부 통과하고 Starlight 쪽이 하나라도 실패할 때

확신도는 중간이다. 점수 차이가 오차 범위 안이라, PoC가 끝나기 전에는 최종 확정이라고 말하기 어렵다.

## 7. 최소 검증(PoC) 범위

문서 조사만으로 결론낼 수 없는 부분을 임시 폴더에서 확인한다. 구성당 반나절에서 하루로 본다 **(판단)**.

- 구성: A = Starlight + Scalar, B = Fumadocs(Next 정적 export). S-A는 문서와 소스로 탈락이 확정돼 제외한다.
- 대상 API: `GET /v1/events`(쿼리 `country`, `tags`, `from`, `to`, `q`, `locale`), `GET /v1/events/{slug}`, `GET /v1/calendars/custom.ics`, 그리고 `VALIDATION_ERROR`·`RATE_LIMITED` 오류 예시. 스펙은 이 3개 엔드포인트만 한·일·영 3개 파일로 손으로 쓴다.
- 대상 가이드: "ICS 구독 연동 가이드" 1페이지를 ko·ja로만 쓰고 en은 비워 둔다. 대체 표시와 안내를 함께 확인하기 위해서다.

합격선은 두 구성에 동일하게 적용한다.

1. 가이드 ko↔ja 전환이 같은 페이지로 이동하고, en에서는 기본 언어 내용과 안내 문구가 나온다.
2. 레퍼런스가 세 로케일에서 각각 UI 문구와 설명이 해당 언어로 나오고, 언어를 바꿔도 같은 엔드포인트로 이어진다.
3. 배포된 임시 도메인에서 실제 `GET /v1/events?locale=ja` 요청이 성공하고, ICS 응답과 400·429 오류도 화면에 표시된다.
4. 검색에서 "행사", "イベント", 한국어 조사 변형("행사를", "티켓을") 질의 결과와 로케일 필터, 레퍼런스 내용 검색 가능 여부를 확인한다.
5. 서버 기능 없이 Cloudflare Workers 정적 자산으로 1~4가 모두 동작한다.
6. 스펙에 파라미터 1개를 추가했을 때 3개 로케일 갱신에 드는 단계와 시간을 기록한다.

## 8. 이전 주장 중 바로잡은 것

같은 날 앞선 대화와 기록에서 한 주장을 이번 조사로 바로잡았다.

- "Next.js로 쓰면 Cloudflare에서 OpenNext가 필요하다"는 서버 기능을 쓰는 배포에만 해당한다. 정적 export는 OpenNext 없이 가능하다. 이 부분은 [2026-10 작업 로그](2026-10.md)에서 이미 고쳤다.
- "Fumadocs는 세 번째 스택을 관리하게 된다"는 정확하지 않았다. Backstage가 이미 React이고, Starlight의 Astro도 새 프레임워크다. 이 평가의 근거로 쓰지 않았다.
- 이전 계획은 "Phase 2에서 `starlight-openapi`와 Scalar를 비교"였다. `starlight-openapi`는 플레이그라운드 부재와 UI 영어 고정이 소스와 문서로 확인돼 비교 대상에서 뺐다.

## 9. 근거와 한계

- 핵심 근거는 공식 저장소의 문서 원문과 소스를 직접 읽은 것이다: Starlight(i18n, 사이드바, 검색, `LanguageSelect`, `FallbackContentNotice`), Pagefind, `starlight-openapi`(문서, 소스, 이슈), Scalar(로컬라이제이션, 설정, Astro 통합), Fumadocs(i18n, UI 번역, 정적 빌드, OpenAPI, 검색, 소스), Next.js 정적 export 문서.
- Astro Cloudflare 배포 문서와 Overlay 스펙은 요약 도구를 거쳐 읽었다.
- 버전과 발행일은 2026-10-24 npm 레지스트리 조회값이다. 번역 분량은 정규식 추정이다.
- 실행 검증은 하지 않았다. **(검증)** 과 "미확인"으로 표시한 곳이 PoC 대상이다.
- 가중치와 점수는 작성자의 판단이며, 저장소 요구사항 등급은 사용자 조건을 바탕으로 작성자가 나눴다.

## 후속

- 이 평가를 채택하면 고칠 곳: [08 §8.5.2](../plan/08-api-and-ics.md#852-미결-사항)의 "API 레퍼런스 방식(`starlight-openapi` 또는 Scalar)" 항목, [2026-10 작업 로그](2026-10.md)의 2026-10-24 항목 중 `starlight-openapi`를 전제로 한 문장.
- PoC 결과가 나오면 이 문서를 고쳐 쓰지 않고 `2026-10.md`에 후속 기록을 추가한다. 최종 확정은 [08 §8.5.3](../plan/08-api-and-ics.md#853-문서-사이트-도구-확정)과 [로드맵 Phase 2](../plan/11-roadmap-and-success.md)의 "API Docs 페이지 개발 착수"에서 관리한다.
