[← 작업 로그 목록](README.md) · [Codex 사전 평가](docs-framework-evaluation-codex-2026-10-24.md) · [Claude 사전 평가](docs-site-tool-evaluation-claude.md)

# Docs 사이트 도구 PoC 실행 결과 — Codex (2026-10-24)

- 단계·성격: Phase 2 사전 검증 / 로컬 PoC. 프레임워크의 최종 변경 결정이나 운영 배포 기록이 아니다.
- 요청: Starlight + Scalar와 Fumadocs를 실제로 만들어 다국어·OpenAPI·검색·정적 빌드를 같은 조건으로 비교하고, Claude도 읽을 수 있는 별도 결과를 남긴다.
- 실행 주체·기준일: Codex, 2026-10-24. 이번에는 문서 조사에 더해 실제 빌드·Chromium 조작·HTTP 요청을 실행했다.
- 범위: 새 PoC 소스와 이 결과 파일을 추가했다. 기존 Onstage·Private API 구현, 기존 평가 문서와 Starlight 확정 결정은 변경하지 않았다.
- 보강 범위: 사용자 요청으로 이 파일과 `poc/docs-frameworks/`만 수정했다. 패키지 버전·lockfile은 유지했다. 보강 시험은 로컬 fixture만 사용하며 실제 SCLS API에는 추가 요청하지 않았다. `[관찰]`은 직접 실행, `[소스]`는 코드 확인, `[추정]`은 해석이다.

## 결론

**두 구성 모두 이번 PoC의 핵심 경로를 구현할 수 있었다. 최종 브라우저 검증은 각각 15/15 통과했다.** Fumadocs가 정적 배포에서 다국어·OpenAPI·검색을 함께 제공할 수 있는지에 대한 불확실성은 이 작은 구성에서 해소됐다. Starlight + Scalar도 언어 전환·API 호출·ICS 표시를 실제로 통과했다.

현재 SCLS처럼 API 개발자 문서가 주력인 조건에서는 **Fumadocs 우선 추천을 유지한다.** 이유는 기능의 가능 여부보다 탐색과 검색의 연결 방식이다. Fumadocs는 가이드 검색에서 생성된 API 페이지를 찾아 바로 이동했고, Starlight + Scalar는 가이드용 Pagefind와 API용 Scalar 검색을 나누어 사용했다.

반면 **Starlight + Scalar가 요구를 충족하지 못하는 구성이라는 결론도 아니다.** 기본 가이드 다국어·fallback을 활용하면서 API 화면의 별도 탐색을 받아들일 수 있다면 유효한 선택이다. 두 후보 사이의 판단은 이제 “정적 다국어 API 문서를 만들 수 있나”보다 “검색·탐색을 얼마나 통합할 것인가”에 가깝다.

15/15는 아래에 정의한 작은 실행 시나리오의 통과 수다. 전체 제품 요구의 100%나 90% 충족률로 환산하지 않는다. API UI 완역, 전체 공개 계약, Cloudflare 운영 배포·접근 제한과 장기간의 갱신 비용은 아직 검증하지 않았다.

보강 결과 한국어 조사형 검색의 차이, 루트·로고·상대 링크의 실패도 확인했다. 이 항목들은 최초 15개 합격선에 들어 있지 않았다. 따라서 아래의 기존 핵심 기능 통과와 [추가 확인](#추가-확인)의 부정 결과를 함께 읽어야 한다.

## 소스와 실행 증거

- [PoC 실행 안내](../../poc/docs-frameworks/README.md)
- [고정 의존성](../../poc/docs-frameworks/package.json), [lockfile](../../poc/docs-frameworks/package-lock.json)
- [공통 fixture·언어별 스펙 생성](../../poc/docs-frameworks/scripts/prepare.mjs)
- [브라우저 비교 코드](../../poc/docs-frameworks/scripts/compare.mjs)
- [브라우저 결과 JSON](../../poc/docs-frameworks/artifacts/browser-results.json): 시나리오별 통과 여부, 실제 요청 URL, 언어 전환 URL, 검색 결과 원문.
- [산출물·버전·계약 구조 확인 JSON](../../poc/docs-frameworks/artifacts/build-summary.json)
- [실제 공개 API의 브라우저 호출 결과](../../poc/docs-frameworks/artifacts/live-api-probe.json)
- [보강 실행 코드](../../poc/docs-frameworks/scripts/supplement.mjs): 구성별 검색, 루트·로고·상대 링크, 번역 감사. 결과는 같은 `browser-results.json`의 `supplementalChecks`와 `searches`에 남긴다.
- [번역 키·영어 잔여 문구 감사 원문](../../poc/docs-frameworks/artifacts/ui-translations-audit.json)
- 보강 전 [브라우저 결과](../../poc/docs-frameworks/artifacts/browser-results-baseline.json)와 [산출물 크기](../../poc/docs-frameworks/artifacts/build-summary-baseline.json)는 별도 보존했다.

스크린샷과 빌드 원문 로그는 실행 시 PoC의 `artifacts/`에 생성된다. 이미지·로그 및 `node_modules`, `dist`, `out`, `.next` 등은 PoC의 `.gitignore`로 제외했다. JSON 실행 증거는 저장소에 남긴다.

## 실행 환경과 비교 구성

| 구분 | 실제 사용 버전·구성 |
|---|---|
| 실행 환경 | Linux x86_64, Node.js 24.22.1 |
| 브라우저 | Playwright 1.64.1 / Chromium 156.0.8078.4, headless |
| Starlight | Astro 7.4.2 + Starlight 0.42.7 |
| Scalar | `@scalar/astro` 0.4.31 + `@scalar/api-reference` 1.76.0 |
| Fumadocs | core/UI 16.17.8, MDX 15.4.10, OpenAPI 12.5.5 |
| React 프레임워크 | Next.js 16.4.3, React/React DOM 19.3.1 |
| 정적 제공 | PoC의 파일 전용 HTTP 서버. Astro/Next 개발·운영 서버를 실행하지 않음 |
| API 응답 | 별도 로컬 fixture 서버. 실제 SCLS API는 소량의 GET으로 추가 확인 |

두 앱은 기존 서비스와 분리된 `poc/docs-frameworks/` 아래에 있다. 전체 산출물은 Starlight `apps/starlight/dist`, Fumadocs `apps/fumadocs/out`이다. Cloudflare에 배포하지 않았다.

## 같은 입력으로 맞춘 것

- 한국어·일본어·영어의 빠른 시작 가이드와 API 설명.
- OpenAPI 3.1의 `GET /events`, `GET /events/{slug}`, `GET /calendars/custom.ics`.
- `country`, `tags`, `from`, `to`, `q`, `locale` 입력을 포함한 행사 목록 예제. 전체 실제 API 계약을 대체하지 않는 축약 스펙이다.
- 동일한 기본 서버 주소와 합성 JSON·ICS 응답.
- 영어 구독 가이드를 일부러 생략해 기본 한국어 본문과 미번역 안내를 확인.
- `/ko`, `/ja`, `/en`을 명시한 정적 경로. Fumadocs의 middleware/proxy는 사용하지 않음.
- 사이트·검색·읽기 API의 일부 UI에 한·일 번역 사전. 표본 화면의 잔여 영어도 아래에 따로 집계하며, 미사용 OAuth 등까지 완역하지는 않음.

언어별 스펙은 같은 생성 함수에서 만든다. `summary`와 `description`을 제외한 구조가 세 언어에서 동일한지도 실제 검사해 통과했다.

## 브라우저 검증 결과

각 구성에 공통 14개 항목과 해당 검색 구조의 동작을 확인하는 1개 항목을 실행했다. 아래의 `ko/ja/en` 표시는 각각 별도 항목으로 세었다.

| 실행 항목 | Starlight + Scalar | Fumadocs |
|---|---|---|
| 가이드 직접 접속·제목·HTML lang (ko/ja/en: 3개) | 통과 | 통과 |
| API 페이지의 언어별 설명·호출 버튼 렌더 (ko/ja/en: 3개) | 통과 | 통과 |
| 영어 구독 가이드 누락 시 한국어 fallback와 안내 | 통과: 기본 기능 | 통과: 기본 fallback + PoC용 안내 구현 |
| 기본 언어 선택기로 같은 가이드 ko → ja 이동 | 통과 | 통과 |
| 가이드에서 API로 이동한 뒤 호출 화면 렌더 | 통과 | 통과 |
| API 언어 전환 후 같은 엔드포인트 유지 | 통과: URL hash 유지 | 통과: 엔드포인트 페이지 경로 유지 |
| 호출 화면에서 JSON 200·오류 400·429 전송 및 표시 | 통과 | 통과 |
| 호출 화면에서 `text/calendar` ICS 원문 표시 | 통과 | 통과 |
| 일본어 문서를 유지하고 API `locale=en` 선택·전송 | 통과 | 통과 |
| 일본어 사이트 검색 UI에서 실제 검색 결과 표시 | 통과 | 통과 |
| 구성별 검색 연결 확인 | Scalar 자체 검색에서 API 상세 찾기 통과 | 사이트 검색에서 생성 API 페이지로 이동 통과 |
| **최종 합계** | **15/15** | **15/15** |

최종 기록에 브라우저 `pageerror`는 없었다. 시나리오 중 테스트 선택자가 실제 DOM 역할과 달라 실패했던 항목은 실제 UI를 조사해 고쳤다. 예를 들어 Fumadocs 언어 메뉴는 `menuitem`이 아니라 버튼이고, Scalar enum 메뉴는 `menuitem`이었다. 선택자 오류를 프레임워크 기능 실패로 계산하지 않았다.

API 언어 독립 조작의 최종 요청은 양쪽 모두 `http://127.0.0.1:4310/v1/events?locale=en`이었으며, 문서의 HTML lang은 `ja`, 실제 응답의 locale은 `en`이었다.

API 언어 전환의 최종 위치:

- Starlight + Scalar: `/ja/api/#tag/events/GET/events/{slug}`
- Fumadocs: `/ja/api/get-event/`

## 실제 차이가 드러난 검색

최초에는 각 앱에서 14개 질의를 실행했다. 보강에서는 ko/ja에 기본형만 둔 `search-probe` 문서를 추가하고 각 앱 17개씩, 합계 34개 질의를 더 실행했다. 기존 가이드에서도 `행사를`, `티켓을`, `イベントを`를 제거했다. 시험한 조사형이 통제 문서와 가이드에 없음을 코드로 확인했다. 원문 결과는 `searches`의 `suite: controlled-morphology-identifiers`에 있다.

아래 수치는 **통제 문서에 대응한 결과 수**다. 전체 검색 결과와 별도로 보관했다. Pagefind는 페이지 중심, Fumadocs는 제목·문단 중심 결과라 **두 열의 수를 점수처럼 비교하지 않는다.** 일본어 `イベントを`가 다른 가이드를 반환하더라도 통제 문서를 찾지 못했다면 통제 결과는 0이다.

| 화면·질의 | Pagefind 통제 결과 | Fumadocs 통제 결과 | 질의가 통제 본문에 그대로 있는가 |
|---|---:|---:|---|
| ko `티켓` / `구독` | 각각 1 | 각각 2 | 있음 |
| ko `티켓을` / `티켓이` | 각각 1 | 각각 0 | 없음 |
| ko `구독을` / `구독이` | 각각 1 | 각각 0 | 없음 |
| ja `イベント` / `チケット` | 각각 1 | 각각 2 | 있음 |
| ja `イベントを` | 0 | 2 | 없음 |
| ja `イベントが` | 1 | 2 | 없음 |
| ja `チケットを` | 0 | 2 | 없음 |
| ko `v1` / `/v1/events` / `retryAfterSeconds` | 각각 1 | 각각 3 / 3 / 2 | 있음 |
| ja `v1` / `/v1/events` / `retryAfterSeconds` | 각각 1 | 각각 3 / 3 / 2 | 있음 |

`[관찰]` 최초의 `티켓을` 검색은 본문에 그 표현이 그대로 있어 조사 처리를 구별하지 못했다. 보강에서는 해당 표현을 제거했고, 기본형만 있는 문서에서 Pagefind는 한국어 조사형 네 개를 찾았지만 Fumadocs는 모두 0이었다. [Claude의 검색 결과 §6](docs-tool-poc-results-2026-10-24.md#6-검색-질의별-결과)의 한국어 관찰과 방향이 같다.

`[관찰]` 일본어는 반대 양상도 있다. Fumadocs는 `イベントを·イベントが·チケットを`에서 통제 문서를 찾았지만 Pagefind는 `イベントを·チケットを`에서 놓쳤다. 단순히 어느 검색기가 한국어·일본어 전체에 우수하다고 일반화하지 않는다. 이 표만으로 형태소 분석 알고리즘의 종류도 확정하지 않는다.

`[관찰]` 식별자는 통제 본문에 평문으로 명시한 상태에서 두 구성 모두 한·일 화면에서 세 질의를 찾았다. Claude의 한국어 Pagefind `v1`·`/v1/events` 0건 현상은 이 말뭉치에서 재현되지 않았다. `[추정]` 문서 원문·HTML 배치·색인 분절 조건의 차이가 후보지만, Claude 쪽 원문·색인을 같은 입력으로 가져와 교차 실행하지 않아 정확한 원인은 **미확인**이다. 버전만 같다고 동일한 말뭉치 시험은 아니다.

기존의 가이드→API 통합 검색 이동은 계속 통과했다. 파라미터 설명 질의 `개최 국가`의 검색 누락도 별도 한계로 유지한다.

또한 Fumadocs가 API 페이지를 검색한다고 해서 모든 중첩 파라미터·응답 스키마 설명까지 자동으로 완전하게 색인된다는 뜻은 아니다. 이번 생성은 `includeDescription: true`를 사용했고, 한국어 파라미터 설명 질의에서는 검색 누락이 실제로 나타났다. API 필드 수준 검색이 필수라면 어느 쪽이든 추가 색인 설계를 검토해야 한다.

## Scalar 배치를 바꾸며 확인한 점

`[관찰]` 처음의 **layout을 생략한 기본 modern 배치 + `showSidebar:false` + URL 입력/client 렌더**에서는 Scalar 내부 검색 버튼이 보이지 않았다. 보강에서 Starlight `doc`와 `splash`를 각각 시험해 모두 같은 결과였다. 따라서 “`showSidebar:false`이면 내부 검색이 없다”는 일반 조건으로 해석하면 안 된다. `[소스]` 설치한 Scalar 설정 스키마의 기본 layout 값은 `modern`이다.

`[관찰]` **`layout:'classic'` + `showSidebar:false`**로 바꾸면 `doc`·`splash` 모두 검색이 보이고 `events` 입력이 동작했다. `hideDarkModeToggle:true`, `withDefaultFonts:false`, `showDeveloperTools:'never'`, `telemetry:false`를 맞추고 URL/client와 content/default-static을 각각 실행해 네 조합 모두 통과했다. 원문 결과는 네 조합에서 동일했다.

| Scalar 조건 (`showSidebar:false` 공통) | Starlight 문서 사이드바 | 검색 표시·실행 |
|---|---|---|
| 기본 modern, URL/client, doc | 보임 | 실패: 검색 입력·버튼 없음 |
| 기본 modern, URL/client, splash | 없음 | 실패: 검색 입력·버튼 없음 |
| classic, URL/client, doc | 보임 | 통과: 태그 1 + 오퍼레이션 2 |
| classic, URL/client, splash | 없음 | 통과: 태그 1 + 오퍼레이션 2 |
| classic, content/default-static, doc | 보임 | 통과: 태그 1 + 오퍼레이션 2 |
| classic, content/default-static, splash | 없음 | 통과: 태그 1 + 오퍼레이션 2 |

```json
[
  " Tag:   events ,Description:  イベント一覧を取得",
  " Operation:   イベント一覧を取得 , getHTTP Method: getPath:  /events",
  " Operation:   イベント詳細を取得 , getHTTP Method: getPath:  /events/{slug}"
]
```

특수 공백을 포함한 원문은 `supplementalChecks[].detail.results`에 있다. Claude의 “오퍼레이션 2 + 모델 5”와 달리 여기서는 태그 1 + 오퍼레이션 2였다. `[소스]` 이 PoC 스펙에는 이름 있는 `components.schemas`가 0개이므로 모델 5개가 나올 입력 조건 자체가 없다.

최종 PoC에서는 API 화면의 Starlight template을 `splash`로 바꾸고 Scalar의 기본 사이드바·검색을 살렸다. 가이드로 돌아가는 링크도 추가했다. 이 구성에서는 이중 문서 사이드바를 피하면서 Scalar 내부 검색을 사용할 수 있었다.

따라서 Scalar 자체 검색을 위해 Starlight 사이드바를 반드시 제거해야 하는 것은 아니다. `classic`에서는 원래 문서 사이드바를 유지하는 배치도 가능했다. 기존 `/ja/api/`의 splash + Scalar 사이드바 구성은 보존했고, 진단 페이지에서만 조건을 바꿨다. 가이드 검색과 API 검색의 색인 범위가 분리되는 점은 그대로다.

## 빌드와 설정에서 실제로 해결한 문제

### Starlight + Scalar

- 이 실행 환경에는 Linux Node가 없었고 Windows Node도 직접 실행되지 않아 공식 Linux Node를 `/tmp`에 준비했다. Chromium에 부족한 공유 라이브러리도 시스템 설치 대신 `/tmp`에 풀었다. 프레임워크의 제품 제약으로 계산하지 않는다.
- 외부 `node_modules` symlink로 Astro의 스타일 모듈 경로 오류가 발생했다. 같은 소스·fixture를 임시 위치에 복사하고 앱 내부의 실제 의존성 경로로 빌드하는 스크립트로 분리했다.
- 이 고정 버전 조합의 prerender 단계에서는 Starlight의 `astro:` 가상 모듈이 외부 import로 남아 오류가 발생했다. `vite.environments.prerender.resolve.noExternal: ['@astrojs/starlight']`를 추가한 뒤 빌드에 성공했다. 다른 버전·환경에서도 반드시 필요한 설정이라고 일반화하지 않는다.
- Scalar는 `renderMode="client"`를 사용했다. 가이드에서 API로 이동한 뒤에도 실제 렌더·호출 버튼이 동작했다.
- Scalar 브라우저 번들은 고정 버전 패키지에서 복사해 정적 파일로 제공했다. 실행 시 외부 CDN의 최신 버전에 의존하지 않았다.

### Fumadocs

- `defineI18n()`의 반환 객체에는 함수도 있어 그대로 Client Component인 DocsLayout에 넘기면 정적 export가 실패했다. 언어 목록·기본 언어 등 직렬화 가능한 설정만 전달해 해결했다.
- 정적 검색은 기본 fetch 클라이언트 대신 정적 모드로 설정했다. 출력이 디렉터리가 아닌 파일인 `/api/search`였으므로 URL 끝에 `/`를 붙이지 않았다.
- 미번역 원문 안내는 PoC 코드에서 추가했다. 일반 문서의 fallback 자체는 공식 기능을 사용했다.
- 언어별 OpenAPI 입력으로 생성 함수를 세 번 실행했고, 생성 MDX와 i18n 디렉터리 규칙의 조합이 실제 빌드·브라우저에서 동작했다.
- CSS `::highlight` 최적화 경고가 있었으나 빌드와 이번 검색 UI 동작을 막지 않았다.

## 산출물과 실제 API 확인

아래는 **최초 PoC 스냅숏**이며, 추가 진단 페이지를 넣은 재빌드 크기와 구분한다.

| 정적 산출물 | 파일 수 | HTML 수 | 전체 비압축 파일 크기 |
|---|---:|---:|---:|
| Starlight + Scalar | 53 | 10 | 5,933,950 bytes (Scalar 번들 포함) |
| Fumadocs | 467 | 21 | 14,694,532 bytes |

**주석:** Starlight + Scalar의 **5,933,950 bytes에는 자체 호스팅한 `public/vendor/scalar.js` 4,858,049 bytes가 포함**된다. `[관찰]` 파일의 실제 바이트 수를 확인했다. [Claude §12](docs-tool-poc-results-2026-10-24.md#12-codex-poc와의-대조와-정정)는 같은 번들의 jsDelivr 전송을 brotli 1,318,795 bytes, gzip 1,395,525 bytes로 기록한다. 이 전송 값은 Claude의 관찰을 인용한 것이며 여기서 다시 측정하지 않았다. 원본 비압축 파일 크기와 압축 네트워크 전송량을 직접 비교하지 않는다. 추가 진단을 포함한 최신 전체 크기는 `build-summary.json`에 별도로 남긴다.

`[관찰]` 보강 후에는 Starlight 95파일·HTML 31개·6,421,741 bytes, Fumadocs 521파일·HTML 30개·15,400,542 bytes였다. 검색 통제 문서와 추가 진단 경로가 포함된 크기다. 두 앱의 정적 재빌드는 성공했고, 언어별 스펙의 구조 동일성 검사도 다시 통과했다.

이는 초기 방문자가 내려받는 양이 아니다. Fumadocs는 엔드포인트별 페이지와 RSC 관련 파일이 더 있고 배치도 다르므로, 이 수치만으로 로딩 속도나 운영 비용을 순위화하지 않는다. 빌드도 Starlight는 Linux 임시 경로, Fumadocs는 마운트된 프로젝트 경로에서 수행해 시간 비교용 실험이 아니다.

최초 PoC에서는 실제 `scls-api.fly.dev`의 health와 일본어 행사 목록을 소량의 읽기 요청으로 확인했다. 정적 Starlight 페이지의 Chromium에서도 `GET /v1/events?country=JP&locale=ja`가 CORS 오류 없이 200, `success: true`, `count: 2`로 응답했다. 실제 행사 본문은 결과 파일에 복사하지 않았다. 이번 보강에서는 이 호출을 재실행하지 않았다.

400·429 표시는 로컬 fixture의 다음 응답을 강제해 시험했다. 실제 운영 API에 잘못된 요청을 반복하거나 Rate Limit을 소진한 검증이 아니다. 이 테스트는 문서 UI가 응답을 전송·표시하는지를 확인한다.

## 추가 확인

`[관찰]` 기존 핵심 검증은 보강한 말뭉치에서도 각각 15/15 통과했다. 추가 사용성 관찰 22건은 모두 실행됐으며, 정의한 조건에 **통과 6건·실패 16건·실행 미확인 0건**이었다. 이는 Scalar 검색 6건과 아래의 루트·로고·상대 링크 16건을 합친 수다. 별도로 검색 질의 34건과 번역 감사를 실행했다. 부정 결과도 관찰 성공으로 보존하며, 전체 제품 요구 충족률로 환산하지 않는다. 보강 실행의 브라우저 `pageerror`는 없었다.

### 루트와 사이트 제목 링크

| 시나리오·합격 조건 | Starlight + Scalar | Fumadocs |
|---|---|---|
| 정적 산출물 `/`에서 페이지 또는 리다이렉트 | 실패: HTTP 404 | 실패: HTTP 404 |
| `/ja/guide/`에서 로고 클릭 → 현재 언어의 유효한 페이지 | 실패: `href="/ja"` → `/ja`, HTTP 404. **ja 자체는 유지** | 실패: `href="/"` → `/`, HTTP 404. **ja 손실** |

`[관찰]` 네 실패 응답의 본문 원문은 모두 `Static file not found`였다. `[소스]` 이 PoC에는 `/ko`·`/ja`·`/en`의 인덱스 문서와 루트 리다이렉트를 추가하지 않았다. 파일 전용 서버로 실행한 결과이며 Cloudflare의 호스트별 리다이렉트 동작을 시험한 것은 아니다.

[Claude의 구성·관찰 §5](docs-tool-poc-results-2026-10-24.md#5-상세-관찰-fumadocs)는 Fumadocs에 `public/index.html` meta refresh를 직접 넣었다. 여기에는 그 파일이 없으므로 루트 결과가 다르다. Fumadocs 로고가 일본어를 잃는 관찰은 같고, Starlight는 언어를 유지해도 대상 인덱스가 없으면 404라는 점을 추가로 확인했다. 리다이렉트나 로고 설정을 고치는 작업은 이번 관찰에 포함하지 않았다.

### 가이드 상대 링크와 다국어 파일 규칙

아래의 `{lang}`은 ko와 ja 각각 직접 실행했다는 뜻이다. 실패 응답 원문은 모두 `Static file not found`다. 통과한 링크는 해당 언어 구독 가이드로 실제 이동했고 HTTP 200이었다.

| 구성·본문 링크 원문 | 생성 href / 최종 경로 | 결과 |
|---|---|---|
| Starlight `subscription/` | `subscription/` → `/{lang}/guide/subscription/` | 실패: 404 |
| Starlight `./subscription.md` | `./subscription.md` → `/{lang}/guide/subscription.md` | 실패: 404 |
| Fumadocs 기본 `subscription/` | `subscription/` → `/{lang}/guide/subscription/` | 실패: 404 |
| Fumadocs 기본 `./subscription.mdx` | `./subscription.mdx` → `/{lang}/guide/subscription.mdx` | 실패: 404 |
| Fumadocs dir + `createRelativeLink`, `./subscription.mdx` | `./subscription.mdx` → `/{lang}/relative-link-probe/subscription.mdx` | 실패: 404 |
| Fumadocs dot + `createRelativeLink`, `./subscription.mdx` | `/{lang}/subscription/` | **통과: 200, 언어 유지** |

`[소스]` 기본 가이드는 Fumadocs MDX의 `a`에 `createRelativeLink`를 연결하지 않았기 때문에 파일 상대 링크가 그대로 남았다. 함수만 연결한 별도 페이지와, 같은 컴파일된 본문을 dot 파일명으로 Source API에 매핑한 페이지를 추가해 비교했다. 원래 앱의 dir 구조를 바꾸거나 Claude의 앱 전체를 복제한 것은 아니다.

`[관찰]` 일본어 진단 값의 원문은 다음과 같다. 한국어도 `ja` 대신 `ko`인 같은 결과였다.

```json
{"parser":"dir","pagePath":"ja/guide.mdx","pageLocale":"ja","resolved":"./subscription.mdx","rootLookup":"/ja/subscription"}
{"parser":"dot","pagePath":"guide.ja.mdx","pageLocale":"ja","resolved":"/ja/subscription"}
```

`[소스]` 설치한 `createRelativeLink`는 `source.resolveHref(href, page)`를 호출한다. 이 함수는 `dirname(page.path)`와 `page.locale`로 파일을 조회한다. dir에서는 부모 디렉터리가 `ja`, dot에서는 빈 경로가 되며, 진단의 빈 경로 조회(`rootLookup`)는 dir에서도 대상을 찾았다. 이 고정 버전·구성에서 경로 조회 조건의 차이를 확인한 것이며, 모든 dir 구성에서 상대 링크가 실패한다고 일반화하지 않는다.

Claude는 dot 파서를 사용했다. **공식 상대 링크 함수와 dot 파일명 조건을 맞춘 경우** 한·일 모두 언어를 유지해 이동하는 관찰이 재현됐다. 따라서 “Fumadocs의 상대 파일 링크는 언제나 자동으로 언어를 유지한다”로 확대할 수 없고, MDX 링크 컴포넌트와 파일 규칙을 함께 명시해야 한다.

### 번역 사전 분량과 화면의 잔여 영어

`[소스]` 고정된 실제 설치 패키지에서 함수를 호출해 키를 세고, 현재 한·일 사전에서 해당 키에 번역값이 등록됐는지 대조했다. 번역 품질의 원어민 검수는 아니다.

| 항목 | 현재 PoC 실측 |
|---|---:|
| `fumadocs-ui`의 `uiTranslations().keys` | 59개, 중복 제외 59개 |
| `openapiTranslations().keys` | 151개, 내부 중복 제외 149개 |
| 두 목록의 중복 | 2개 |
| 합집합 | **206개** |
| ko / ja 번역 등록 | **각각 89개**: UI 31 + OpenAPI 60 − 공통 2 |
| ko / ja 미등록 | **각각 117개** |

Claude의 63 + 151 → 210개와는 **UI 패키지 조건이 다르다.** [Claude §2·§5](docs-tool-poc-results-2026-10-24.md#2-구성과-버전)는 `fumadocs-ui`를 `@fumadocs/base-ui` 16.17.8의 별칭으로 설치했다. 여기서는 같은 버전 번호의 `fumadocs-ui` 패키지를 직접 사용한다. 설치본에서 얻은 합집합 206개를 분모로 썼다. 패키지·lockfile을 유지했으므로 Base UI의 63키 목록 자체를 여기서 다시 실행·대조하지는 않았다. 공통 중복 키 원문은 `Copied Text(code block)(aria-label)`, `Copy Text(code block)(aria-label)`이다.

`[관찰]` ko/ja 각각 가이드, 행사 목록 API 본문, API 링크 복사 툴팁, 플레이그라운드와 필드 정보 hover, 사이트 검색을 열어 확인했다. 코드·필드 식별자·기술 표기를 제외하고 **미등록 키의 영어 문구는 화면에서 각각 3종**이었다. 아래 수는 중복을 뺀 문구 종류이며, 같은 문구의 출현 횟수가 아니다.

| 언어 | 화면 텍스트·툴팁 원문 | 별도로 확인한 접근성 이름 |
|---|---|---|
| ko | `Copy Link`, `Length`, `Value in` — 3종 | `Field Info` — 1종 |
| ja | `Copy Link`, `Length`, `Value in` — 3종 | `Field Info` — 1종 |

가이드와 검색 표본에서는 미등록 영어 키가 보이지 않았다. API 본문의 `Length`·`Value in`, hover 시 `Copy Link`가 남았고, `Field Info`는 화면 본문과 구분해 `aria-label`로 집계했다. [감사 JSON](../../poc/docs-frameworks/artifacts/ui-translations-audit.json)에 누락 키 117개, 화면별 DOM 텍스트·접근성 속성 원문을 남겼다.

이 숫자는 **이번에 연 화면에서 미등록 사전 키와 일치한 영어 문구의 수**다. 전체 UI의 모든 상태, 동적으로 치환되는 문구, OAuth·오류 상태별 추가 UI까지 모두 세었다는 뜻은 아니다. 그 범위의 영어 잔여 총수는 **미확인**이다. Claude가 210개를 완역한 뒤 영어가 없었다는 기록과, 여기서 일부만 번역해 영어가 남은 결과는 번역 범위가 다르다.

## 사전 평가에서 이제 확인된 것과 남은 것

확인된 것:

- Fumadocs의 정적 export, 다국어 경로, 생성 OpenAPI, 정적 검색의 결합은 이 PoC에서 동작했다.
- Fumadocs의 미번역 안내는 작은 별도 구현으로 추가할 수 있었고, fallback과 함께 동작했다.
- Starlight + Scalar도 기본 언어 전환에서 같은 엔드포인트 hash를 유지했다.
- 양쪽 모두 일본어 문서에서 API 응답 언어를 독립적으로 바꿀 수 있었다.
- Scalar의 기본 API 탐색을 유지하면 별도 API 검색을 사용할 수 있었다.
- Scalar classic은 Starlight 문서 사이드바와 함께 배치해도 자체 검색이 동작했다.
- 기본형만 있는 통제 문서에서 한국어·일본어 조사형과 영문 식별자의 검색 결과를 분리했다.
- 루트·로고·상대 링크의 부정 결과와 Fumadocs 상대 링크의 파서 조건을 직접 확인했다.
- Fumadocs 번역 사전의 등록·누락 수와 표본 화면의 미번역 영어를 구분해 기록했다.

아직 남은 것:

- 사이트·API UI 전체의 한국어·일본어 완역과 버전 업데이트 시 번역 키 추적.
- 전체 실제 공개 API를 반영한 OpenAPI 계약, 오류·nullable 필드·스키마의 정합성.
- 파라미터·응답 필드 설명의 검색 범위 확대와 대표 질의에 대한 품질 기준.
- 스펙을 변경했을 때 번역의 OUTDATED 표시·누락 검출과 CI 연결. 생성은 실행했으나 장기간 갱신 비용은 측정하지 않음.
- Cloudflare 배포, Phase 2 비공개 접근 제한, 실제 운영 헤더·캐시·배포 경로.
- 모바일·키보드·스크린리더 등 접근성 전반, 대량 문서 성능, API Key·OAuth·여러 API 버전.

현재 도구 결정은 [08 §8.5.3](../plan/08-api-and-ics.md#853-문서-사이트-도구-확정)에 있는 Starlight다. 이번 실행은 그 결정을 자동으로 변경하지 않는다. 최종 선택 시에는 두 구성 모두 핵심 정적 다국어 API 경로를 통과했다는 사실과, 가이드·API 통합 검색을 얼마나 중요하게 보는지를 함께 반영하면 된다.
