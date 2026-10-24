[← 작업 로그 목록](README.md) · [2026-10 작업 로그](2026-10.md) · [현재 로드맵](../plan/11-roadmap-and-success.md)

# Docs 사이트 도구 PoC 실행 결과 — Starlight+Scalar 대 Fumadocs (2026-10-24)

[Claude 재평가](docs-site-tool-evaluation-claude.md)와 [Codex 독립 평가](docs-framework-evaluation-codex-2026-10-24.md)가 모두 "문서 조사만으로는 결론을 낼 수 없다"고 남긴 항목을, 두 구성을 실제로 설치·빌드·정적 서빙해 확인한 결과다. Claude(Sonnet 5.5)가 실행하고 기록했다. 사용자 요청으로 Codex도 읽고 검증·반박할 수 있게 관찰 값과 재현 방법을 함께 적었다.

- 단계·성격: Phase 2 사전 검증 / 실행 결과. **도구 선택을 확정하거나 [08 §8.5.3](../plan/08-api-and-ics.md#853-문서-사이트-도구-확정)을 바꾸는 기록이 아니다.**
- 범위: 임시 폴더에서만 설치·빌드했다. 이 저장소의 코드와 기존 확정 문서는 고치지 않았다. 이 파일과 [README](README.md) 목록 한 줄만 추가했다.
- 대조: 같은 날 Codex가 별도 환경에서 실행한 [PoC 결과](docs-site-tools-poc-results-codex-2026-10-24.md)와 대조해 이 파일의 오류를 정정했다. 내용은 [12절](#12-codex-poc와의-대조와-정정)에 있다.
- 표기: **(관찰)** 은 직접 실행해 본 값, **(소스)** 는 패키지 소스·공식 문서에서 읽은 값, **(판단)** 은 작성자의 해석이다.
- 한계: 로컬에서 Cloudflare Workers 정적 자산(`wrangler dev`)으로 서빙했을 뿐 실제 Cloudflare에 배포하지 않았다. 범위는 API 3개, 가이드 2종, 3개 언어라 규모에 따른 성능·유지보수 비용은 모른다. 번역 문구는 작성자가 직접 썼고 원어민 검수를 받지 않았다. 자세한 미검증 항목은 [아래](#10-미검증과-한계)에 있다.

## 찾아보기

- [요약](#요약)
- [1. 방법과 환경](#1-방법과-환경)
- [2. 구성과 버전](#2-구성과-버전)
- [3. 합격선별 결과](#3-합격선별-결과)
- [4. 상세 관찰: Starlight + Scalar](#4-상세-관찰-starlight--scalar)
- [5. 상세 관찰: Fumadocs](#5-상세-관찰-fumadocs)
- [6. 검색 질의별 결과](#6-검색-질의별-결과)
- [7. 규모와 번역 분량](#7-규모와-번역-분량)
- [8. 이전 평가의 예측과 실제 결과](#8-이전-평가의-예측과-실제-결과)
- [9. 작성자의 해석](#9-작성자의-해석)
- [10. 미검증과 한계](#10-미검증과-한계)
- [11. 재현 방법](#11-재현-방법)
- [12. Codex PoC와의 대조와 정정](#12-codex-poc와의-대조와-정정)

## 요약

- **두 구성 모두 필수 조건을 이 PoC 범위에서 통과했다.** 가이드 한·일·영, 미번역 대체, 로케일별 OpenAPI 레퍼런스, 한·일·영 UI 문구, 실제 요청 플레이그라운드, 정적 호스팅 동작이 모두 확인됐다.
- **Fumadocs의 가장 큰 미확인 항목이 해소됐다.** Next.js 정적 export에서 i18n, 생성된 OpenAPI 페이지, 플레이그라운드, 정적 검색이 한꺼번에 동작했다. 서버 기능, 미들웨어, 프록시, 외부 CDN이 필요 없었다.
- **Starlight + Scalar의 이음매가 실제로 확인됐다.** Scalar 레퍼런스는 Starlight 검색에 잡히지 않았고, 플레이그라운드 모달의 왼쪽이 Starlight 사이드바에 가려졌으며, Scalar 번들(비압축 4.86MB, brotli 전송 1.32MB)을 기본값으로 jsDelivr에서 받는다(버전 미고정이며, 패키지에서 복사해 자체 호스팅할 수 있다). 한국어·일본어 UI 문구도 일부 영어로 남았다.
- **반대로 Fumadocs에는 기본 제공이 없는 것이 확인됐다.** 미번역 안내 문구가 없고, 한국어 조사 변형 검색("구독을", "티켓을")이 0건이었다. 한·일 번역 사전 210개를 직접 써야 했고, 빌드 결과가 17.7MB/493파일이다.
- **작성자(Claude)의 사전 추천이었던 "Starlight + Scalar 우선"의 근거 하나가 약해졌다.** "필수 조건의 미확인 항목이 적다"는 이유는 Fumadocs 결합이 동작함으로써 성립하지 않는다. 자세한 해석은 [9절](#9-작성자의-해석)에 있다.

## 1. 방법과 환경

| 항목 | 내용 |
|---|---|
| 환경 | Windows 11 Home 10.0.26300, Node v24.17.0, npm 11.13.0. 내장 브라우저로 1400×900에서 확인했다 |
| 서빙 | `wrangler dev`(wrangler 4.152.0)로 정적 산출물을 Cloudflare Workers 정적 자산 방식으로 서빙했다. Starlight는 `dist`, Fumadocs는 `out`이다. 서버 코드는 없다 |
| API | 운영 임시 도메인 `https://scls-api.fly.dev/v1`([Onstage `.env.example`](../../apps/onstage/.env.example)에 공개된 값)에 읽기 전용 GET을 약 10여 건 보냈다. 429는 운영 API를 때리지 않고 같은 응답 모양의 목 서버(`localhost:4010`)로 확인했다 |
| 공통 스펙 | OpenAPI 3.1, 엔드포인트 3개(`GET /events`, `GET /events/{slug}`, `GET /calendars/custom.ics`), 오류 스키마 3종. Private `scls-platform`의 `public-events.ts`, `event-filter.ts`, `public-event-shape.ts`, `public-hardening.ts` 구현을 기준으로 썼고 페이지네이션 같은 미구현 기능은 넣지 않았다 |
| 로케일별 스펙 | 구조는 한 곳에 두고 언어별 문구 표만 다르게 해 `openapi.ko/ja/en.json` 3개를 생성하는 스크립트(약 370줄, 문구 표 포함)를 썼다. 번역 대상은 소개·태그·오퍼레이션 요약과 설명·파라미터 설명·응답 설명·주요 필드 설명이다 |
| 가이드 | `quickstart`(ko/ja/en), `calendar-subscription`(ko/ja, **en은 일부러 없음**). 번역 누락 시 대체 동작을 확인하기 위해서다 |
| 합격선 | [Claude 평가 §7](docs-site-tool-evaluation-claude.md#7-최소-검증poc-범위)의 6개와 [Codex 평가 §7](docs-framework-evaluation-codex-2026-10-24.md)의 추가 항목(문서 언어와 API `locale` 분리, 운영 빌드 직접 접속, `text/calendar` 응답)을 합쳤다 |

## 2. 구성과 버전

| 구성 | 패키지 | 설치 |
|---|---|---|
| A: Starlight + Scalar | `astro` 7.4.2, `@astrojs/starlight` 0.42.7, `@scalar/astro` 0.4.31, Scalar 번들 `@scalar/api-reference` 1.76.0(CDN 고정), Pagefind 1.5.2(Starlight 내장) | 설치 61초, 패키지 360개(lock), `node_modules` 208MB |
| B: Fumadocs + Next.js 정적 export | `next` 16.4.2, `react` 19.3.1, `fumadocs-core` 16.17.8, `fumadocs-ui`(= `@fumadocs/base-ui` 16.17.8), `fumadocs-mdx` 15.4.10, `fumadocs-openapi` 12.5.5, `shiki` 4.5.0, `tailwindcss` 4.3.3 | `create-fumadocs-app` 생성과 설치 185초 + `fumadocs-openapi` 추가 25초, 패키지 459개(lock), `node_modules` 545MB |

B는 `create-fumadocs-app`의 `+next+fuma-docs-mdx+static` 템플릿(`output: 'export'`)에서 시작했다. 템플릿 기본 검색 설정은 `language: 'english'`라서 다국어에서는 옵션을 뺐다.

직접 쓴 설정·코드 분량(번역 사전과 템플릿 제공분 포함, 가이드·스펙 제외)은 A가 약 160줄(이 중 부분 번역 사전 88줄), B가 약 700줄(이 중 한·일 사전 430줄)이다.

## 3. 합격선별 결과

| # | 합격선 | A: Starlight + Scalar | B: Fumadocs (Next 정적 export) |
|---|---|---|---|
| 1 | 가이드 ko↔ja 전환, en 미번역 시 기본 언어 대체와 안내 | 통과. 언어 선택이 같은 경로로 이동하고, `/en/calendar-subscription/`은 한국어 본문에 "This content is not available in your language yet." 안내가 붙는다 | 부분 통과. 언어 전환과 대체 표시는 되지만 **미번역 안내 문구가 없다**. `/en/docs/calendar-subscription`은 안내 없이 한국어 본문만 보인다 |
| 2 | 레퍼런스가 세 로케일에서 UI 문구와 설명이 해당 언어로 나오고, 언어 전환 시 같은 엔드포인트로 이동 | 통과(조건부). 설명은 로케일별 스펙으로, UI는 `localization.translations`로 번역했다. 번역하지 않은 키는 영어로 남는다([4절](#4-상세-관찰-starlight--scalar)). 언어 전환은 `/ko/api/#tag/events/GET/events`에서 `/ja/api/#tag/events/GET/events`로 해시까지 유지된다 | 통과. 사전 210개를 모두 번역하자 기술 표기(`GET`, `string`, `cURL`, `Ctrl`)를 빼고 영어가 남지 않았다. 오퍼레이션마다 별도 페이지라 언어 전환이 같은 오퍼레이션 페이지로 간다 |
| 3 | 배포된 임시 도메인(다른 오리진)에서 실제 요청, JSON·`text/calendar`·400·429 표시 | 통과. 운영 API로 200 JSON, 400, ICS 200, 목 서버로 429를 확인했다. 프록시 없이 직접 요청된다 | 통과. 같은 4가지를 확인했고 상태 라벨이 번역되어 나온다(`400 不正なリクエスト`, `429 リクエストが多すぎます`). 프록시 설정 없음 |
| 4 | 한·일 검색, 언어별 필터, 레퍼런스 검색 | 부분 통과. 가이드 검색은 한·일 모두 잘 된다. **레퍼런스 내용은 Pagefind에 잡히지 않는다**(`layout: 'classic'`에서는 Scalar 자체 검색이 동작한다). 한국어 영문 식별자(`v1`, `/v1/events`)가 0건이다([6절](#6-검색-질의별-결과)) | 부분 통과. 레퍼런스 설명까지 검색되고 `/v1/events`도 잡힌다. **한국어 조사 변형("구독을", "티켓을")은 0건**이다 |
| 5 | 서버 기능 없이 정적 호스팅에서 1~4가 동작 | 통과. 단 Scalar 번들(비압축 4.86MB, brotli 1.32MB)을 기본값으로 jsDelivr에서 받는다(자체 호스팅 가능). 루트 `/`는 404였다 | 통과. 외부 도메인 요청 0건. 루트 `/`는 `public/index.html`(meta refresh)을 추가해 처리했다 |
| 6 | 스펙에 파라미터 1개를 추가했을 때 갱신 | 통과. 스펙 3개 재생성 후 복사와 빌드만으로 새 파라미터가 번역 문구와 함께 나타났다 | 통과. 복사, `generateFiles` 재실행, 빌드로 반영됐다. 생성 단계가 하나 더 있다 |
| 7 | 문서 언어와 API `locale` 파라미터의 독립성 | 통과. 일본어 문서에서 `locale`은 `ko|ja|en` 선택 입력으로 따로 있다 | 통과. 같은 방식이다 |
| 8 | 구현된 계약만 스펙에 반영 | 통과. 페이지네이션과 `ko-KR`은 넣지 않았고 "페이지네이션은 아직 없다"고 명시했다 | 같음(스펙 공통) |

필수 조건으로 분류한 항목(Claude 평가 M1~M7)은 위 결과에서 두 구성 모두 충족했다. 다만 한쪽만 약한 항목이 있다(1번의 미번역 안내는 B, 4번의 레퍼런스 검색은 A).

## 4. 상세 관찰: Starlight + Scalar

### 구성

- 가이드는 `src/content/docs/{ko,ja,en}/*.md`에 둔다. 사이드바는 `astro.config.mjs`의 `sidebar`에서 `translations`로 라벨을 번역하고 `slug`로 항목을 건다.
- 레퍼런스는 로케일별 `api.mdx`(`/ko/api/`, `/ja/api/`, `/en/api/`)에 Astro 컴포넌트 `ScalarEmbed.astro`를 넣는 방식이다. 해당 언어 스펙 JSON을 `content`로 넘기고 `localization: { locale: 'en', translations: ko|ja }`로 UI 문구를 덧붙인다.
- 핵심 설정은 `layout: 'classic'`, `showSidebar: false`, `showDeveloperTools: 'never'`, `telemetry: false`, `withDefaultFonts: false`, `cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.76.0'`이다.

### 관찰

- **가이드 다국어는 설정만으로 끝났다.** ko·ja UI 문자열은 Starlight에 내장돼 있어(31/31 키) 번역 파일이 필요 없었다. 사이드바 라벨, `<html lang>`, 언어 선택, 대체 안내가 모두 동작했다.
- **Starlight 검색 대화상자 일부가 영어로 남는다.** 일본어 화면에서 "2 results for カレンダー", "Clear"가 영어였다. 소스상 `pagefind.*` 키는 별도 `i18n` 컬렉션에 직접 넣어야 한다.
- **Scalar는 사전 렌더링되지 않는다.** 기본 `renderMode: 'static'`이 빌드 결과에 넣는 것은 `<div id="app">`와 `<script src=…>`뿐이고 오퍼레이션 본문은 없다. 그래서 Pagefind가 색인하지 못한다(소스: `@scalar/astro/src/ScalarComponent.astro`). 통합 소스는 Starlight처럼 클라이언트 라우팅을 쓰는 사이트에서는 `renderMode="client"`를 권장한다.
- **CDN 의존.** 기본 CDN은 버전이 없는 `https://cdn.jsdelivr.net/npm/@scalar/api-reference`(소스: `DEFAULT_CDN`)다. 번들은 비압축 4,858,049바이트(4.86MB)이고 brotli 전송은 1.32MB, gzip은 1.40MB다. 고정 버전 패키지에서 복사해 정적 자산으로 제공하면 CDN 의존을 없앨 수 있다(Codex가 같은 크기의 파일을 이 방식으로 제공해 동작을 확인했다). 한 번은 `cdn`에 `…/esm.js`를 넣었다가 정적 모드가 일반 `<script>`로 내보내서 레퍼런스가 아예 그려지지 않았다. 버전만 붙인 `…/api-reference@1.76.0`으로 고정해야 동작한다.
- **개발자 도구 UI.** localhost에서 "Developer Tools / Configure / Share / Deploy / Generate SDK" 도구 모음과 SDK 생성 버튼이 보였다. `showDeveloperTools: 'never'`로 숨겨진다. 운영 도메인에서의 기본 동작은 확인하지 못했다.
- **플레이그라운드 모달이 Starlight 사이드바에 가려졌다.** 1400px에서 모달 왼쪽(파라미터 이름 열)이 사이드바 뒤에 있다. 좁은 창(800px)에서는 모달 폭 1024px가 잘렸다. CSS 보정이 필요하다 **(관찰)**.
- **영어로 남은 문구.** 한국어·일본어 화면에서 레퍼런스에 "Keyboard Shortcut:", "Control", "Client Libraries", "More", "Select from all clients", "Request Example for", "Copy"가 남았고, 플레이그라운드 안에는 "Cookies", "Request Headers", "Response Headers", "Body", "Preview/Raw", "Download", "Value"가 남았다. 작성자가 번역한 키는 103개(전체 약 517개의 약 20%)다. 나머지를 번역하면 줄어들겠지만 분량은 큰 편이다.
- **태그 이름.** 스펙의 태그 `name`(`Events`)이 그대로 제목으로 나왔다. 로케일별 제목은 `x-displayName`으로 해결했고 이 보정은 두 구성에 공통으로 넣었다.
- **상대 링크.** 가이드 안의 `[…](calendar-subscription/)`는 현재 페이지 URL 기준으로 풀려 `/ko/quickstart/calendar-subscription/`(404)이 됐다. 로케일 접두가 붙은 절대 경로(`/ko/calendar-subscription/`)로 써야 한다. 이 PoC에서는 고치지 않고 404만 확인했다.
- **루트 `/` 는 404.** `defaultLocale: 'ko'`이고 root 로케일이 없으면 정적 빌드에 루트 페이지나 리다이렉트가 생성되지 않았다.
- **`wrangler dev` 감시 중 재빌드하면 서버가 죽었다**(`dist/.prerender` 소실). 개발 도구와의 상호작용이며 운영 배포와는 무관하다.
- **성능 값(관찰, 로컬).** API 레퍼런스 페이지는 같은 출처 163KB(JS 97KB, CSS 66KB, 문서 56KB)에 jsDelivr 번들(비압축 4.86MB, 전송 1.32MB)이 더해진다. DOMContentLoaded는 약 1.3초였다.

## 5. 상세 관찰: Fumadocs

### 구성

- `lib/i18n.ts`: `defineI18n({ defaultLanguage: 'ko', languages: ['ko','ja','en'], parser: 'dot' })`. `hideLocale`은 기본값 `never`라서 모든 언어에 접두가 붙는다.
- 라우트를 `app/[lang]/…`로 옮기고 `generateStaticParams`로 3개 언어를 사전 생성한다. 루트 `app/layout.tsx`는 지우고 `app/[lang]/layout.tsx`에 `<html lang>`을 둔다.
- 가이드는 `quickstart.ko.mdx` 같은 점 파서 파일명이고 사이드바 순서와 구분선은 `meta.ko.json`으로 둔다.
- OpenAPI: `createOpenAPI({ input: { ko, ja, en } })`(스키마 ID가 로케일 코드)와 `generateFiles`를 로케일별로 돌려 `api/listEvents.ko.mdx`처럼 만들었다. `name(output)` 훅이 `${operationId}.${loc}`를 돌려주면 점 파서 규칙에 맞게 생성됐다. 생성 스크립트는 19줄이다.
- 검색은 템플릿의 `staticGET`과 `useStaticSearch({ locale })`를 그대로 쓰고 `language: 'english'`만 뺐다.

### 관찰

- **정적 export에서 필요 없었던 것.** `proxy.ts`(미들웨어), 서버 라우트, OpenNext, 플레이그라운드 프록시. 외부 도메인 요청도 0건이었다(폰트는 빌드 때 자체 호스팅).
- **언어 전환은 같은 페이지로 간다.** 가이드와 오퍼레이션 페이지 모두 `/ko/docs/quickstart` → `/ja/docs/quickstart`처럼 로케일 구간만 바뀐다.
- **본문 상대 링크가 로케일을 따라간다.** `./calendar-subscription.mdx`가 `/ko/docs/calendar-subscription`으로 풀렸다.
- **한·일 UI 사전은 210개 전부 직접 작성해야 했다.** 키 목록은 `uiTranslations()` 63개 + `openapiTranslations()` 151개이고, 중복을 빼면 210개(표시 이름 `displayName` 포함)다. 공식 언어 팩은 zh-CN·zh-TW뿐이다. 모두 번역한 뒤 플레이그라운드 상태 라벨(`400 不正なリクエスト`)과 서버 선택 팝오버, 레퍼런스 소제목이 전부 번역되어 나왔다.
- **미번역 안내가 없다.** `fallbackLanguage`는 본문만 대체하고 안내 컴포넌트는 기본 제공되지 않는다. 사이드바는 `meta.en.json`을 따라 영어 구분선과 한국어 페이지 제목이 섞인다.
- **로고 링크가 `/`로 간다.** 로케일 없이 루트로 가서 meta refresh로 `/ko/docs/`가 된다. 일본어 사용자가 로고를 누르면 한국어로 돌아간다. `nav.url`을 로케일별로 줘서 고쳐야 한다.
- **`<title>`에 사이트 이름이 붙지 않는다**(페이지 제목만). 메타데이터 템플릿을 설정하면 된다 **(판단)**.
- **루트 `/`는 `public/index.html`(meta refresh)로 처리했다.** 앱에 루트 페이지가 없으면 Starlight처럼 404일 것이다. 이 파일이 없는 상태는 실행해 보지 않았다 **(판단)**.
- **첫 빌드가 한 번 실패했다.** `spawn UNKNOWN`(esbuild), Go 런타임 스택 덤프 출력, 약 103초 후. 같은 입력으로 다시 실행한 2회는 성공했다. 원인은 모른다. 당시 다른 프로세스(wrangler, 브라우저)가 같이 돌고 있었다.
- **빌드와 크기(관찰).** 콜드 빌드 45초(컴파일 29.7초, 정적 페이지 24개 4.2초). 산출물 17.7MB(17,692,462바이트), 493파일. 검색 색인 `api/search`는 3개 언어 합본 141KB이며 모든 클라이언트가 내려받는다. API 레퍼런스 페이지는 같은 출처 1.75MB(JS 1.59MB 24개 파일, CSS 117KB, 문서 109KB, 폰트 47KB)다.
- **레퍼런스 설명이 검색에 잡힌다.** 생성된 MDX의 `structuredData`에 설명이 들어가 "페이지네이션" 검색이 API 페이지까지 나왔다.

## 6. 검색 질의별 결과

숫자는 결과 개수다. A는 Pagefind가 세는 페이지 수, B는 결과 행(제목, 소제목, 문단) 수라서 두 열을 서로 비교하면 안 된다. 같은 열에서 0건인지만 의미가 있다.

| 화면 | 질의 | A(Pagefind) | B(Fumadocs 정적 검색) |
|---|---|---|---|
| ko | 행사 | 2 | 15 |
| ko | 행사를 | 1(가이드만) | 4(API 페이지 포함) |
| ko | 캘린더 구독 | 2 | 12 |
| ko | 구독을 | 2 | **0** |
| ko | 티켓을 | 1 | **0** |
| ko | `/v1/events` | **0** | 2 |
| ko | `v1` | **0** | 2 |
| ko | `events` | 1 | 확인 안 함 |
| ko | `VALIDATION_ERROR` | 1 | 2 |
| ko | `locale` | 2 | 3 |
| ko | 페이지네이션 | 1(가이드만, 레퍼런스 페이지 없음) | 4(레퍼런스 포함) |
| ko | `retryAfterSeconds` | 1 | 2 |
| ja | イベント | 2 | 15 |
| ja | イベントを | 2 | 24 |
| ja | カレンダー | 2 | 11 |
| ja | 購読 | 2 | 11 |
| ja | チケット | 1 | 4(API 페이지 포함) |
| ja | `/v1/events` | 1 | 2 |
| ja | ページネーション | 1(가이드만) | 4(레퍼런스 포함) |
| ja | リクエスト | 1 | 4 |
| ja | 行事(없는 단어) | 0 | 0 |

- **A**: 한국어 조사 변형이 통한다(`티켓을`, `구독을`). Pagefind 1.5.2가 한국어를 형태소 단위로 나누는 것으로 보인다 **(판단)**. 하지만 같은 한국어 색인에서 `v1`, `/v1/events`가 0건이다. 일본어에서는 `/v1/events`가 1건이다. 색인 시점과 질의 시점의 분절이 어긋나는 [Pagefind #1237](https://github.com/Pagefind/pagefind/issues/1237) 유형으로 보인다 **(판단)**.
- **B**: 영문 식별자와 경로는 잘 찾지만 한국어 조사 변형은 못 찾는다. 단어 경계 분절이라 공백으로 나뉘는 한국어는 어절 그대로 비교된다 **(판단)**.
- **로케일 필터**: 두 구성 모두 현재 언어의 문서만 검색된다.
- **Scalar 레퍼런스**: A에서는 Pagefind가 오퍼레이션 본문을 색인하지 못한다. Scalar의 자체 검색만 쓸 수 있다. `layout: 'classic'` + `showSidebar: false`에서 검색창이 보였고 "events"를 입력하면 오퍼레이션 2건과 모델 5건이 나왔다(관찰). 같은 옵션의 기본 배치에서는 검색 버튼이 보이지 않았다는 Codex의 기록이 있어, 배치에 따라 다르다([12절](#12-codex-poc와의-대조와-정정)).

## 7. 규모와 번역 분량

| 항목 | A: Starlight + Scalar | B: Fumadocs |
|---|---|---|
| 사이트 UI 한·일 번역 | 0개(Starlight 내장 31/31 키). 단 검색 대화상자 `pagefind.*` 문구는 별도 | 63개 직접 작성(UI) |
| 레퍼런스·플레이그라운드 UI 번역 | 전체 약 517키 추정(레퍼런스 약 197, API 클라이언트 약 262, 스키마 약 58). 103개 번역, 영어 대체 허용 | 151개 직접 작성(OpenAPI). UI와 합쳐 210개 전부 번역해 영어 잔여 없음 |
| 로케일별 스펙 | 3개(공통) | 3개(공통) + `generateFiles` 로케일별 실행 |
| 설치 | 61초, 360패키지, `node_modules` 208MB | 210초(생성 185 + 추가 25), 459패키지, `node_modules` 545MB |
| 콜드 빌드(Astro·Next 보고값) | 7~14초(벽시계 약 18초) | 약 45초 |
| 산출물(실제 바이트) | 1.36MB(1,357,155바이트), 56파일. 런타임에 Scalar 번들 4.86MB(전송 1.32MB)를 CDN에서 받음 | 17.7MB(17,692,462바이트), 493파일 |
| 레퍼런스 페이지 JS(비압축) | 97KB + Scalar 번들 4.86MB(CDN) | 1.59MB(24개 파일) |
| 스펙 변경 갱신 | 벽시계 68초(Astro 보고 9.6초, 측정 잡음 큼) | 벽시계 36초 |

- 스펙 변경은 가상의 쿼리 파라미터 `status`를 3개 언어 문구와 함께 추가했다(**PoC 전용, 실제 API에 없는 파라미터**). 문구 표 한 곳을 고쳐 스펙 3개를 재생성하는 데는 1초 미만이었다. 구조 동일성 검사 스크립트가 처음에는 `x-displayName`을 번역 대상으로 알지 못해 거짓 실패를 냈고, 목록에 추가해 고쳤다. 자체 검사 스크립트도 스펙 변경 때 같이 관리해야 한다는 뜻이다.
- 위 시간 측정은 한 번씩이고 다른 프로세스와 겹쳤다. 절대 값이 아니라 대략적인 순서만 참고해야 한다.

## 8. 이전 평가의 예측과 실제 결과

| 출처 | 예측 또는 미확인 | 결과 |
|---|---|---|
| Claude | Pagefind는 클라이언트 렌더 Scalar 내용을 색인하지 못한다 **(판단)** | 확인됨. 사전 렌더링된 HTML에 오퍼레이션 본문이 없다 |
| Claude, Codex | Fumadocs 정적 export에서 i18n·생성 OpenAPI·플레이그라운드·검색의 결합이 미확인 | 이 범위에서 동작함. 서버·프록시·CDN 불필요 |
| Claude, Codex | Fumadocs의 미번역 안내가 문서에 없다 | 실제로 기본 제공되지 않는다 |
| Claude | Starlight와 Scalar 사이에 언어·검색·탐색의 이음매가 생긴다 | 부분 확인. 검색 분리와 모달 겹침은 확인됐다. 언어 전환은 해시까지 보존돼 우려보다 나았다 |
| Claude | Scalar 한·일 번역 분량이 크다(약 500) | 확인됨. 103개만 번역해도 영어가 7여 곳 남는다. 단 영어 대체가 허용돼 점진 번역은 가능하다 |
| Codex | 정적 export에서는 로케일 경로를 사전 생성하고 정적 검색을 쓰는 방향이 맞다 | 확인됨. `proxy.ts` 없이 `/ko`, `/ja`, `/en`이 동작했다. 루트 `/`는 별도 처리가 필요했다 |
| Codex | 한·일 UI 사전 작성 비용을 예산에 포함해야 한다 | 실측 210개 |
| Codex | 문서 언어와 API `locale`을 분리해야 한다 | 두 구성에서 플레이그라운드의 `locale`이 문서 언어와 별개 입력으로 동작했다 |
| Codex | 정적 빌드에서 직접 접속·새로고침이 되어야 한다 | 두 구성 모두 `wrangler dev` 정적 자산 서빙에서 직접 접속이 됐다. 슬래시 처리가 다르다(A는 `/ko/quickstart/`로, B는 `/ko/docs/quickstart`로 정규화) |
| Codex | 응답에 페이지네이션이 없다 | 스펙에 "아직 없다"고 명시해 반영했다 |

## 9. 작성자의 해석

이 절은 관찰이 아니라 작성자(Claude)의 판단이다.

- **필수 조건은 두 구성 모두 통과**했으므로 선택은 중요 조건 사이의 균형이다.
- **Fumadocs가 나은 점.** 레퍼런스와 가이드가 한 사이트 안에서 같은 사이드바·검색·언어 전환을 쓴다. 외부 CDN이 없다. 플레이그라운드 문구가 완전히 번역된다. 레퍼런스 설명이 검색된다. 구성 요소가 한 벤더라 이음매가 적다.
- **Starlight + Scalar가 나은 점.** 가이드 다국어가 설정만으로 끝난다. 미번역 안내가 기본이다. 한국어 조사 변형 검색이 된다. 설치·빌드·가이드 페이지가 가볍다(단 레퍼런스 페이지는 Scalar 번들 4.86MB를 받으므로 비압축 JS는 Fumadocs보다 크다). 번역해야 할 UI 사전이 작다(영어 대체 허용).
- **Claude의 사전 추천 철회 범위.** 평가 문서([§6](docs-site-tool-evaluation-claude.md#6-추천))의 추천 이유 1번("필수 조건에서 불확실한 항목이 적다")은 이 PoC로 성립하지 않는다. 이유 2번(가이드 다국어가 설정으로 끝남)과 3번(구성 요소 독립)은 유지된다. 새로 확인된 약점이 있다(검색 분리, 모달 겹침, CDN 의존, 영어 잔여, 루트 404).
- **현재 입장.** API 개발자 문서가 주력이고 레퍼런스·플레이그라운드·다국어가 한곳에서 동작해야 한다는 조건에서는 Fumadocs 쪽이 낫다는 판단으로 기운다. 단 미번역 안내와 한국어 조사 검색은 직접 보완해야 한다. 가이드 위주이고 레퍼런스가 작은 문서라면 Starlight가 여전히 더 가볍다. 이는 Codex의 "Fumadocs 우선" 추천 방향과 같아졌고, 사실 판단은 거의 같았으며 달랐던 것은 위험 선호였다.
- **이 판단의 약점.** 범위가 작다(API 3개, 가이드 2종). Fumadocs는 Next 16, React 19, 일 단위 릴리스라 업그레이드 부담이 크고, 첫 빌드 실패 한 번의 원인을 모른다. 규모가 커졌을 때의 빌드 시간·산출물(17.7MB)과 Cloudflare 실제 배포는 보지 않았다.

## 10. 미검증과 한계

- 실제 Cloudflare 배포는 하지 않았다. `wrangler dev`는 로컬 workerd이고, 빌드 크기·자산 개수 제한, 캐시, 커스텀 도메인은 확인하지 않았다.
- Phase 2의 접근 제한(관리자 전용 공개)은 시험하지 않았다. 도구와 무관한 배포 계층 문제로 보지만 확인한 것은 아니다.
- 한·일 검색 품질은 5개 안팎의 짧은 문서로 질의 20여 개를 시험한 것이다. 문서가 늘어난 뒤의 품질, 형태소 분석이 필요한 경우, Pagefind의 한국어 색인 분할 문제([#1211](https://github.com/Pagefind/pagefind/issues/1211))는 확인하지 못했다.
- 번역 문구는 작성자가 썼다. 용어와 어투는 검수받지 않았다.
- `@fumadocs/openapi-standalone`(Next 없이 정적 HTML 생성)과 Fumadocs의 Astro·TanStack Start 템플릿은 시험하지 않았다.
- 스펙 번역을 Overlay 방식으로 관리하는 방법은 시험하지 않았다(생성 스크립트로 3개 파일을 만들었다).
- 접근성, 모바일 화면, 다크/라이트 전환은 확인하지 않았다.
- 운영 임시 API에 보낸 요청은 약 10여 건의 GET이다(상태 확인, 목록, 검증 오류, ICS). 429는 목 서버로만 확인했다.
- 이 PoC의 코드와 산출물은 이 저장소 밖 임시 폴더에 있어 세션이 끝나면 사라질 수 있다. 핵심 설정은 위 [4절](#4-상세-관찰-starlight--scalar), [5절](#5-상세-관찰-fumadocs)에 적었다.

## 11. 재현 방법

공통 자료는 다음과 같다. 스펙 3개는 한 스크립트가 언어별 문구 표에서 생성한다(구조 동일성 검사 포함).

```text
poc/shared/gen-specs.mjs      구조 1벌 + 언어별 문구 표 → openapi.{ko,ja,en}.json
poc/shared/mock-api.mjs       429/400/ICS를 흉내 내는 목 서버(localhost:4010, CORS *)
poc/shared/guides/{ko,ja,en}  quickstart, calendar-subscription(en은 없음)
```

A: Starlight + Scalar

```bash
npm i astro@7.4.2 @astrojs/starlight@0.42.7 @scalar/astro@0.4.31
npx astro build                  # dist/
npx wrangler dev --port 9301     # assets.directory = ./dist
```

B: Fumadocs

```bash
npx create-fumadocs-app@latest fumadocs-next --template +next+fuma-docs-mdx+static --search orama --no-git --pm npm --install -y
npm i fumadocs-openapi@12.5.5 shiki
# lib/i18n.ts, [lang] 라우트, 번역 사전, lib/openapi.ts, generateFiles 스크립트 추가
node scripts-generate-openapi.mjs    # content/docs/api/*.{ko,ja,en}.mdx 생성
npx next build                       # out/
npx wrangler dev --port 9302         # assets.directory = ./out
```

Windows에서 `npx next build`가 한 번 실패한 뒤 재실행으로 성공했다는 점을 감안해, 재현이 안 되면 같은 명령을 한 번 더 실행해 본다.

## 12. Codex PoC와의 대조와 정정

같은 날 Codex가 Linux·Playwright 환경에서 별도로 실행한 [PoC 결과](docs-site-tools-poc-results-codex-2026-10-24.md)(구성별 15개 시나리오 통과)와 대조했다. **모순되는 관찰은 없었고**, 달라 보인 항목은 시험 조건의 차이였다. 두 환경에서 같은 현상이 나온 항목도 있다(Starlight 검색 대화상자의 영어 문구, 파라미터 설명 질의 0건, 언어 전환 시 같은 엔드포인트 유지, JSON·400·429·ICS 표시, 문서 언어와 API `locale`의 독립).

| 쟁점 | 이 파일 | Codex | 정리 |
|---|---|---|---|
| 한국어 조사 변형 검색 | "구독을", "티켓을"을 Fumadocs는 0건, Pagefind는 찾음 | "티켓을" 등을 두 구성 모두 찾음 | 말뭉치 차이다. 이 파일의 본문에는 "구독을"과 "티켓을"이 0회, Codex 본문에는 "티켓을"이 1회 들어 있다. Codex도 본문에 실제로 들어 있어 형태소 품질을 보장하지 않는다고 적었다. 조사 변형을 구별할 수 있는 쪽은 이 파일의 시험이다(단어 2개뿐이라 표본은 작다) |
| Scalar 내부 검색 | `layout: 'classic'` + `showSidebar: false`에서 검색창이 보이고 동작한다 | 기본 배치에서 `showSidebar: false`이면 검색 버튼이 보이지 않았다 | 레이아웃 차이다. Codex는 `splash` 템플릿으로 Starlight 사이드바를 빼고 Scalar 기본 사이드바·검색을 살렸다 |
| 산출물 크기 | (정정 전) Fumadocs 19MB | 14.7MB(467파일) | 정정 전 값은 `du` 반올림이었다. 실제는 17,692,462바이트(493파일)다. 3MB 차이의 원인은 모른다 |

정정한 내용은 다음과 같다.

- **Scalar 번들 크기.** 초안의 "1.32MB(비압축)"은 틀렸다. 비압축 4,858,049바이트(4.86MB), brotli 전송 1,318,795바이트, gzip 1,395,525바이트다. Codex가 자체 호스팅한 번들과 바이트 수가 같다. 이에 따라 "Starlight + Scalar가 가볍다"는 표현을 설치·빌드·가이드 페이지로 한정했고, 레퍼런스 페이지의 비압축 JS는 Starlight 쪽 약 5.0MB(97KB + 4.86MB), Fumadocs 쪽 1.59MB다.
- **산출물 용량.** 19MB를 17.7MB(17,692,462바이트)로, Starlight 1.5MB를 1.36MB(1,357,155바이트, Scalar 번들 제외)로 바로잡았다.
- **Scalar 검색.** "Scalar 검색만 쓸 수 있다"에 `classic` 배치에서의 동작 관찰을 보탰다([6절](#6-검색-질의별-결과)의 설명, [3절](#3-합격선별-결과)의 4번 행).

한쪽에만 있는 항목은 다음과 같다.

- 이 파일에만 있음: 번역 사전 분량 실측, 스펙 변경 시험, 운영 API의 실제 400·ICS 요청, 루트 `/` 404, 가이드 상대 링크 404, Fumadocs 로고 링크의 언어 손실, 플레이그라운드 모달과 Starlight 사이드바의 겹침, Scalar 기본 CDN의 버전 미고정.
- Codex에만 있음: 재현 가능한 Playwright 검증(락파일 고정), Fumadocs 미번역 안내를 작게 구현한 것(이 파일은 구현하지 않았다), Scalar 번들 자체 호스팅, 환경별 우회(Starlight의 `noExternal`, Fumadocs `defineI18n` 객체 직렬화). 이 우회들은 이 파일의 Windows 로컬 설치에서는 필요하지 않았다.
- Codex 산출물에서 확인한 것: Starlight 사이드바 `link: '/api/'`가 빌드 결과에서 `/ko/api/`로 로케일 접두가 붙었다.
