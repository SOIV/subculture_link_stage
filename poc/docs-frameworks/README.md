# SCLS Docs 프레임워크 비교 PoC

Starlight + Scalar와 Fumadocs + 공식 OpenAPI를 동일한 언어별 가이드·축약 OpenAPI·합성 API 응답으로 비교한다. 기존 Onstage와 Private API는 수정하지 않는다. 이 PoC의 스펙은 실제 API 계약 전체를 대체하지 않는다.

## 구성

- `apps/starlight`: Starlight 다국어 가이드 + Scalar API 화면. API 화면은 `template: 'splash'`로 Starlight 문서 사이드바를 빼고 Scalar 자체 사이드바·검색을 사용한다.
- `apps/fumadocs`: Next.js 정적 export + MDX 가이드 + `fumadocs-openapi`가 생성한 언어별 API 페이지 + 정적 검색.
- `fixtures`: 같은 ko/ja/en 설명을 가진 검증용 OpenAPI 3.1 문서 3개와 공통 가이드 문구.
- `scripts/fixture-server.mjs`: 실제 DB를 사용하지 않는 로컬 합성 API. JSON·ICS와 400/429 응답 표시를 검증한다.
- `scripts/compare.mjs`: Playwright/Chromium으로 정적 산출물을 비교한다.
- `artifacts/browser-results.json`: 기능별 실행 결과와 검색 결과 원문. 확인하지 않은 기능을 통과로 기록하지 않는다.

## 실행

Node.js 24.22.1 이상과 npm을 사용한다. 패키지 버전은 `package.json`과 `package-lock.json`에 고정했다.

```bash
npm ci
npx playwright install chromium
npm run prepare:fixtures
npm run build:starlight
npm run build:fumadocs
npm run serve
```

별도 터미널에서 브라우저 비교를 실행한다.

```bash
npm run test:browser
```

이번 Codex 실행 환경에서 이미 준비한 도구를 재사용한다면 설치 대신 다음 환경 변수를 먼저 설정할 수 있다. 일반적인 Node·Playwright 설치 환경에는 필요 없다.

```bash
export PATH=/tmp/scls-docs-poc-runtime/node-v24.22.1-linux-x64/bin:$PATH
export PLAYWRIGHT_BROWSERS_PATH=/tmp/scls-docs-poc-runtime/browsers
export LD_LIBRARY_PATH=/tmp/scls-docs-poc-runtime/browser-libs/root/usr/lib/x86_64-linux-gnu
```

기본 실행 주소:

- Starlight 가이드: `http://127.0.0.1:4321/ko/guide/`
- Starlight + Scalar API: `http://127.0.0.1:4321/ja/api/`
- Fumadocs 가이드: `http://127.0.0.1:4322/ko/guide/`
- Fumadocs API: `http://127.0.0.1:4322/ja/api/list-events/`
- 합성 API: `http://127.0.0.1:4310/v1/events`

두 정적 서버에는 프레임워크 런타임이 없다. `dist`/`out` 안의 파일만 HTTP로 제공한다. API 응답은 별도 fixture 서버가 제공한다.

## 비교 조건과 의도한 차이

- `/ko`, `/ja`, `/en`을 명시적으로 사용한다. Fumadocs에는 요청 시 실행되는 middleware/proxy를 두지 않았다.
- `en/subscription`을 두 앱에서 모두 생략했다. Starlight는 기본 fallback·안내를, Fumadocs는 `fallbackLanguage`와 PoC용 안내 컴포넌트를 사용한다.
- Scalar는 `renderMode="client"`를 사용하고 브라우저 번들도 고정 버전의 로컬 정적 자산으로 제공한다.
- 가이드·검색·읽기 API에서 실제 사용하는 UI에 한·일 번역을 추가했다. OAuth 등 사용하지 않은 UI까지 완역한 상태는 아니다.
- 문서 언어와 API 쿼리 `locale`은 독립적으로 조작한다.
- 응답 코드를 강제하는 `/__poc/status?next=400` 또는 `429`는 fixture에만 있는 테스트 제어 경로다. 실제 SCLS API 기능으로 문서화하지 않는다.
- 생성한 `api/*.mdx`는 스펙을 고친 뒤 `npm run build:fumadocs`로 재생성한다.

## 실행 환경에서 필요했던 처리

이번 검증은 Windows 프로젝트를 마운트한 Linux 환경에서 실행했다. Windows Node 실행 파일을 직접 실행할 수 없어 Node와 Chromium·필요 공유 라이브러리를 `/tmp`에 분리했다. 이 경로들은 저장소 재실행의 필수 경로가 아니다.

Astro 7.4.2 + Starlight 0.42.7은 이 구성에서 prerender 시 Starlight 가상 모듈이 외부 import로 남았다. `astro.config.mjs`의 `vite.environments.prerender.resolve.noExternal`로 Starlight를 번들에 포함했다.

Astro가 외부 의존성 symlink를 해석하는 경로 문제도 있었다. `scripts/build-starlight.mjs`는 같은 소스·fixture를 임시 디렉터리에 복사하고 실제 의존성 경로로 빌드한 뒤 `dist`를 가져온다. Linux에서는 가능한 경우 의존성을 하드링크하며, 불가능하면 복사한다. `POC_STAGE_DIR`로 임시 위치를 바꿀 수 있다. 이 환경 차이 때문에 양쪽 빌드 시간은 속도 순위로 사용하지 않는다.

## 결과

실제 결과와 해석, 남은 검증 범위는 [별도 PoC 결과 기록](../../docs/devlog/docs-site-tools-poc-results-codex-2026-10-24.md)에 보관한다. 기존 프레임워크 확정 기록을 변경하는 문서는 아니다.

## 2026-10-24 추가 대조 실행

패키지와 lockfile을 바꾸지 않고 다음을 추가했다.

- `search-probe`: 기본형만 있는 한·일 말뭉치와 평문 영문 식별자. 기존 가이드의 `행사를`, `티켓을`, `イベントを`도 제거해 조사형의 글자 그대로 일치를 배제한다.
- `/ja/scalar-modern-doc/`, `/ja/scalar-modern-splash/`: 기본 modern, `showSidebar:false`, URL/client.
- `/ja/scalar-classic-doc/`, `/ja/scalar-classic-splash/`: classic, `showSidebar:false`, URL/client.
- `/ja/scalar-classic-static-doc/`, `/ja/scalar-classic-static-splash/`: classic, `showSidebar:false`, content/default-static. 진단 페이지에서만 입력·배치를 바꾸며 원래 `/ja/api/`는 그대로다.
- 가이드의 `relative-url-probe`와 `relative-file-probe`: URL 상대 경로와 소스 파일 상대 경로를 구분한다.
- `/ja/relative-link-probe/`: 기존 dir 파서에 공식 `createRelativeLink`를 연결한 경우.
- `/ja/relative-link-dot-probe/`: 같은 컴파일된 본문을 Source API에서 dot 파일명으로 매핑해, 파일명 파서만 다르게 한 경우.

위 경로는 ko/en에도 생성된다. 파일 전용 정적 서버가 실행된 상태에서 다음으로 원문 결과를 갱신한다.

```bash
node --import tsx scripts/supplement.mjs
node scripts/analyze.mjs
```

`artifacts/browser-results.json`의 `supplementalChecks`는 추가 관찰이고, `searches`에서 `suite: controlled-morphology-identifiers`인 항목은 통제 검색 결과다. 검색에는 전체 원문 결과와 통제 문서 결과를 함께 보관한다. `artifacts/ui-translations-audit.json`은 사전 키 수와 실제 렌더된 미번역 영어를 구분한다.

`supplementalChecks[].pass`는 해당 사용성 조건의 충족 여부다. 예를 들어 루트 404는 `executed:true, pass:false`로 남긴다. 추가 스크립트의 비정상 종료는 관찰 자체 실패 또는 브라우저 예외를 뜻하며, 알려진 부정 결과까지 스크립트 실행 실패로 취급하지 않는다. 기존 15개 핵심 기능 검증은 `npm run test:browser`로 별도 실행한다.

보강 전 JSON은 `artifacts/browser-results-baseline.json`, `artifacts/build-summary-baseline.json`에 보존한다. 추가 진단 페이지 때문에 새 빌드 크기를 최초 결과와 혼동하지 않아야 한다. 이번 보강은 실제 SCLS API에 요청하지 않는다.
