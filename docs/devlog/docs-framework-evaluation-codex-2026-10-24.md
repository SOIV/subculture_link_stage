[← 작업 로그 목록](README.md) · [2026-10 작업 로그](2026-10.md) · [현재 로드맵](../plan/11-roadmap-and-success.md)

# SCLS Docs 프레임워크 독립 평가 — Codex (2026-10-24)

- 단계·성격: Phase 2 사전 검토 / 비교 평가. 도구 변경을 확정하거나 구현에 착수한 기록이 아니다.
- 평가 주체·기준일: Codex, 2026-10-24. 사용자 요청에 따라 개발 문서와 실제 구현을 확인한 독립 평가다.
- 작성 배경: 사용자가 Claude와 Codex의 추천이 다르다고 알려 두 평가를 비교할 수 있도록 별도 보관한다. Claude의 최신 평가 원문은 이 문서 작성 시 제공받지 않았으므로 그 평가를 요약하거나 반박하는 문서로 취급하지 않는다.
- 결정과의 관계: 현재 Starlight 확정 내용은 [08 §8.5.3](../plan/08-api-and-ics.md#853-문서-사이트-도구-확정), 당시 결정 근거는 [2026-10 작업 로그](2026-10.md)에 있다. 이 평가의 Fumadocs 우선 추천은 재검토 제안이며 기존 결정을 대체하지 않는다.
- 확인 수준: 저장소 읽기와 외부 공식 문서·소스 조사. 설치·프로토타입·빌드·배포 실험은 미실시다.

## 결론

주력이 API 개발자 문서이고 Onstage·Backstage 사용 안내를 함께 제공하며 한국어·일본어·영어를 지원해야 한다는 요구에서는 Fumadocs를 우선 추천한다. 단, 한국어·일본어 UI 사전, API 설명 번역의 생성 흐름, 정적 다국어 빌드를 프로젝트에서 구성하는 조건이다.

Starlight 자체는 좋은 다국어 문서 도구다. 그러나 Starlight 본체의 다국어 지원을 starlight-openapi 생성 페이지에도 그대로 적용할 수 있다고 계산하면 안 된다. 해당 플러그인에는 다국어 페이지·사이드바 연동 이슈가 열려 있다. Starlight를 선택한다면 Scalar를 별도로 연결하는 구성까지 비교해야 한다.

Fumadocs와 Starlight + Scalar는 프로젝트 작업을 포함하면 요구사항 90% 이상을 목표로 삼을 수 있는 설계다. 지금 어느 쪽도 “모든 필수 조건을 실제 통과했다”거나 “설치만 하면 90%가 완성된다”고 판정할 근거는 없다. 비중이 큰 다국어·API·검색·정적 배포의 결합을 아직 실행하지 않았다. 필수 조건은 점수로 상쇄하지 않고 각각 통과해야 한다.

## 1. 확인한 범위와 한계

- 공개 저장소의 API/ICS 설계, 인프라 설계, 관리자 UI 다국어 계획, 로드맵, 작업 로그를 읽었다.
- 실제 Onstage의 API 클라이언트와 ko/ja/en 문구·경로 구성을 확인했다.
- 인접한 비공개 scls-platform의 API 서버 등록, 공개 행사 API, 필터·locale 처리, ICS 응답, package.json을 읽기 전용으로 확인했다.
- 두 후보의 최신 공식 문서, 공식 저장소 코드, starlight-openapi 이슈와 유지관리자 답변을 확인했다.
- 프레임워크 설치, 프로토타입 구현, 빌드·배포·브라우저 실험은 하지 않았다. 운영 API도 호출하지 않았다. 기존 확정 문서는 수정하지 않았다.
- 공식 저장소의 기본 브랜치와 배포 문서가 설치할 특정 릴리스와 동일하다고 가정하지 않았다. 특히 Fumadocs dev 브랜치에서 확인한 언어팩 범위는 출시판 전체에 관한 단정이 아니다.

## 2. 프로젝트에서 실제로 필요한 것

| 우선순위 | 요구사항 | 근거 |
|---|---|---|
| 필수 | API 사용을 중심으로 하는 개발자 문서 | 사용자 명시, docs/plan/08-api-and-ics.md §8.5 |
| 필수 | 한국어·일본어·영어의 문서, 탐색, UI | 사용자 명시, Onstage·Backstage의 현재 ko/ja/en 지원 |
| 필수 | 일반 사용 안내와 API 문서의 병행 운영 | 사용자 명시: Onstage·Backstage 사용 방법 |
| 필수 | 실제 API 계약과 문서의 일치 | §8.2의 구현/계획 구분, 실제 public-events.ts와 event-filter.ts |
| 중요 | OpenAPI 기반 페이지 생성, 예제, 호출 실습 | 사용자 논의의 핵심 요구, §8.5.2의 레퍼런스 도구 선택 |
| 중요 | 미번역 문서 처리, 언어별 검색 | 사용자 논의의 다국어 품질 요구 |
| 중요 | Cloudflare 배포, 가능하면 정적 운영 | 현재 인프라 방향과 1인 개발·운영 조건 |
| 필수(초기 단계) | Phase 2의 관리자 전용 검증, Phase 3의 전체 공개 | §8.5.1 및 로드맵 Phase 2/3 |
| 추후 | 여러 API 버전의 문서 | 현재 공개 계약 /v1 하나, /v2 현실화 시 검토 |
| 추후 | API Key·개발자 콘솔·Webhook 관련 문서 | 로드맵 Phase 6 |

현재 공개 API는 /v1/events, 행사 상세 :slug, 시리즈·일정·장소·태그·검색·health와 ICS 피드를 제공한다. 공개 /v1은 인증 없는 GET 중심이며 서버 코드에서 GET·HEAD·OPTIONS의 CORS origin을 *로 설정한다. 따라서 현재 읽기 API 호출 실습은 브라우저가 API로 직접 요청하는 설계가 가능하다. Docs 서버나 CORS 프록시는 필수 전제가 아니다. 이는 코드 확인에 따른 판단이며 배포 환경 검증은 별도다.

현재 조사 범위에서 공개 OpenAPI 산출물과 자동 생성 연결은 확인하지 못했다. API package.json에도 Swagger/OpenAPI 생성 의존성이 없고, 읽은 행사 라우트는 핸들러 내부에서 Zod로 검증한다. 문서 프레임워크를 설치한다고 현 API 계약이 자동으로 완성되는 상태는 아니다.

또한 행사 목록의 현재 응답은 count/items이며 해당 라우트에 페이지네이션 입력·처리는 없다. 페이지네이션은 설계 방향으로 문서화할 수 있지만 구현된 계약처럼 안내하면 안 된다. Docs 프레임워크 선택과 별개로 실제 응답을 기준으로 스펙을 작성해야 한다.

## 3. 기능보다 실제 조합을 비교한 결과

아래는 실행 통과표가 아니라 문서·소스 근거를 바탕으로 한 구현 가능성과 필요한 작업의 비교다.

| 조건 | Fumadocs + 공식 OpenAPI + Next.js 정적 export | Starlight + starlight-openapi | Starlight + Scalar |
|---|---|---|---|
| 일반 가이드·스크린샷·표 | 기본 문서 기능으로 가능 | 기본 문서 기능으로 가능 | 기본 문서 기능으로 가능 |
| 문서 언어별 경로·탐색 | 공식 i18n 설정 필요 | 본체 기본 지원, 생성 API 경로는 별도 문제 | 본체 지원, Scalar source 선택 연결 필요 |
| 미번역 일반 문서 fallback | 공식 fallbackLanguage 지원 | 본체 기본 지원 | 일반 문서는 본체 지원 |
| 미번역 안내 표시 | 원하는 표시를 별도 확인·구현 | 본체 기본 지원 | 일반 문서는 본체 지원 |
| ko/ja 사이트 UI | 번역 사전 추가를 예산에 포함 | 본체에 ko/ja 번역 파일 존재 | 본체에 ko/ja 번역 파일 존재 |
| OpenAPI 페이지 자동 생성 | 공식 fumadocs-openapi 설정 | 커뮤니티 플러그인 설정 | Scalar가 스펙을 렌더링; 외부 사이트 경로·탐색 설계 필요 |
| API 요청 코드 예제 | 공식 지원 | 플러그인이 지원 | Scalar 기능 사용 |
| 요청 플레이그라운드 | 공식 지원 | 확인한 기능·구현에서 동등 기능 확인 못함 | Scalar API Client 연결 |
| API UI의 ko/ja | 공식 번역 확장 API + 프로젝트 사전 | 영어 고정 문구가 확인됨; 수정 비용 검토 | localization.translations로 프로젝트 사전 추가 |
| 언어별 API 설명 본문 | 번역 입력과 페이지 생성 흐름 설계 필요 | i18n 연동 이슈가 있어 우선 검증 필요 | 언어별 OpenAPI source를 연결해야 함 |
| 언어별 정적 검색 | 공식 정적 모드와 locale 필터 지원 | 본체 Pagefind 사용; 생성 페이지 언어·색인 검증 | 가이드는 Pagefind, Scalar 콘텐츠의 통합 검색 연결 검증 |
| Cloudflare 정적 호스팅 | 공식 정적 export + 정적 검색 설정 | 기본 정적 빌드 | 정적 셸 + 브라우저 렌더링 구성 가능 |
| Phase 2 사이트 접근 제한 | 배포 계층에서 구성 | 배포 계층에서 구성 | 배포 계층에서 구성 |
| 계약 변경·번역 누락 감지 | 프로젝트 빌드/CI 설계 필요 | 프로젝트 빌드/CI 설계 필요 | 프로젝트 빌드/CI 설계 필요 |

## 4. 추천에 영향을 준 구체적 근거

① Starlight의 다국어 장점은 사실이지만 API 플러그인까지 자동으로 이어지지 않는다.

Starlight 공식 문서는 언어별 경로, fallback 본문과 미번역 안내를 설명한다. 본체 공식 소스에도 ko.json과 ja.json이 있다.

그러나 starlight-openapi의 “Compatibility with Internationalization (i18n)” 이슈 #37은 확인 시점에 open이었다. 유지관리자가 사이드바 컴포넌트 교체·필터링을 우회안으로 제시했고, 이후 이용자들이 해당 방법의 컴파일/데이터 문제를 보고했다. 과거 이슈만으로 현재 모든 조합이 실패한다고 단정하지는 않지만, 다국어 API 문서가 기본 완성되어 있다고 인정할 근거도 없다.

현재 main 소스의 common.astro에는 Overview, OperationDescription.astro에는 Toggle operation URLs 같은 영어 문자열도 확인된다. API 페이지 UI 번역은 Starlight 본체 번역만으로 해결된다고 보기 어렵다.

- [Starlight 다국어 지원](https://starlight.astro.build/guides/i18n/)
- [Starlight 본체 번역 파일(main)](https://github.com/withastro/starlight/tree/main/packages/starlight/src/translations)
- [starlight-openapi 다국어 연동 이슈 #37](https://github.com/HiDeoo/starlight-openapi/issues/37)
- [starlight-openapi 공통 페이지 구현(main)](https://github.com/HiDeoo/starlight-openapi/blob/main/packages/starlight-openapi/routes/common.astro)
- [starlight-openapi 요청 설명 UI 구현(main)](https://github.com/HiDeoo/starlight-openapi/blob/main/packages/starlight-openapi/components/operation/OperationDescription.astro)

② Fumadocs는 다국어가 없는 도구가 아니라, 조립과 번역 사전 준비가 필요한 도구다.

공식 문서는 locale 라우팅, 언어별 콘텐츠, fallbackLanguage, UI 번역, OpenAPI 번역 확장을 안내한다. 따라서 한국어·일본어 지원을 위해 본체를 포크하는 설계는 필요하지 않다.

다만 “지원 API가 있다”와 “한국어·일본어 번역 사전이 완성되어 제공된다”는 다르다. 확인한 공식 dev 브랜치의 @fumadocs/language package.json exports는 zh-cn/zh-tw였고, 영어는 기본 언어다. ko/ja 완성 언어팩을 가정하지 말고 프로젝트 사전 작성·업데이트 확인 비용을 포함해야 한다. 실제 채택 릴리스에서 다시 확인할 항목이다.

- [Fumadocs Next.js 다국어 구성](https://www.fumadocs.dev/docs/internationalization/next)
- [Fumadocs 다국어 설정과 fallback](https://www.fumadocs.dev/docs/headless/internationalization/config)
- [Fumadocs UI 번역](https://www.fumadocs.dev/docs/ui/translations)
- [Fumadocs OpenAPI UI 번역](https://www.fumadocs.dev/docs/integrations/openapi/api-page#internationalization)
- [Fumadocs 언어팩 구성(dev)](https://github.com/fuma-nama/fumadocs/blob/dev/packages/language/package.json)

③ 정적 배포와 플레이그라운드는 원리상 양립한다.

Next.js의 Server Components는 정적 export의 빌드 단계에 실행할 수 있다. “server-side API”라는 코드 주석만으로 런타임 서버가 필수라고 결론 내리면 안 된다. Fumadocs는 정적 사이트·정적 검색을 안내하고, 별도 OpenAPI standalone 도구에서도 정적 HTML 생성 경로를 공식 제공한다. 다만 standalone의 가능성이 곧 SCLS 전체 다국어 사이트의 실행 검증은 아니다.

정적 export에서는 요청 시 실행되는 middleware/proxy나 cookies에 의존한 언어 선택을 그대로 사용할 수 없다. /ko, /ja, /en 같은 경로를 사전 생성하고 언어 전환 링크로 연결하며 검색도 정적 클라이언트로 구성하는 방향이 적합하다. 모든 Docs 경로가 Onstage의 기본 언어 무접두사 규칙을 따라야 하는 요구는 현재 확인되지 않았다.

- [Fumadocs 정적 배포](https://www.fumadocs.dev/docs/deploying/static)
- [Fumadocs OpenAPI 정적 HTML 생성](https://www.fumadocs.dev/docs/integrations/openapi/standalone)
- [Next.js 정적 export 지원과 제약](https://nextjs.org/docs/app/guides/static-exports)

④ 한국어·일본어 검색은 “설정 필요 여부”와 “실제 품질”을 구분해야 한다.

현재 Fumadocs 공식 검색 문서는 Unicode word segmentation 기반 multilingual 모드, locale 필터, 정적 모드에도 locale을 전달하는 구성을 설명한다. 따라서 현재 문서를 두고 일본어 검색은 반드시 별도의 외부 검색 서비스가 필요하다고 판단할 근거는 없다. 다만 API 식별자·일본어 복합어·한국어 조사까지 원하는 방식으로 검색되는지는 실제 질의로 평가해야 한다.

Starlight의 기본 검색은 Pagefind이며 Pagefind는 다국어 사이트를 언어별로 색인한다. Scalar처럼 브라우저에서 렌더링하는 API 본문이 정적 HTML 색인에 포함되는지는 별도 문제다. 가이드와 API를 통합 검색할지, API 내부 검색을 분리할지도 결정해야 한다.

- [Fumadocs 정적·다국어 검색](https://www.fumadocs.dev/docs/headless/search/orama#internationalization)
- [Starlight 사이트 검색](https://starlight.astro.build/guides/site-search/)
- [Pagefind 다국어 검색](https://pagefind.app/docs/multilingual/)

⑤ Starlight + Scalar도 유효하지만 다국어 작업이 없어지는 대안은 아니다.

Scalar 공식 localization 문서는 UI 번역과 OpenAPI 설명 본문 번역을 분리한다. 확인한 내장 locale 목록에는 ko/ja가 없으므로 프로젝트 번역을 추가하는 계획이 필요하다. 언어에 맞는 스펙 선택, 사이트 언어 메뉴와 Scalar 상태 연결, 검색 범위도 구성해야 한다.

- [Scalar UI 다국어 지원](https://scalar.com/products/api-references/localization)
- [Scalar API Reference 설정](https://scalar.com/products/api-references/configuration)

## 5. 두 후보에 공통으로 필요한 API 설명 번역 설계

권장안은 API 계약을 한 곳에서 관리하고, 번역할 문구만 별도 자료로 관리한 뒤 빌드 때 언어별 OpenAPI 산출물을 만드는 것이다. 이는 프로젝트 설계 제안이며 각 프레임워크가 자동으로 제공한다고 주장하는 기능이 아니다.

- 경로·HTTP method·파라미터 이름·타입·필수 여부·상태 코드는 언어별로 독립 편집하지 않는다.
- summary·description과 번역 대상 설명을 operationId 및 안정적인 스키마 위치에 연결한다.
- 번역이 없으면 ko 설명을 쓰되 미번역 상태를 표시하는 정책을 명시한다. 원문 변경으로 번역이 오래된 경우도 감지할 수 있도록 원문 해시나 변경 상태를 관리한다.
- 언어별 산출물의 계약 구조가 같은지, 잘못된 참조나 생성 실패가 없는지 검증한다.
- 사용 가이드도 공통 페이지 식별자를 기준으로 언어 전환과 fallback을 연결한다.

특히 Docs에서 읽는 언어와 API의 locale 쿼리 파라미터는 분리한다. 일본어 문서로 설명을 읽으면서 locale=ko를 시험하는 것도 가능해야 한다. 현재 실제 API는 ko/ja/en을 처리하며 ko-KR 같은 다른 값은 ko로 fallback한다. 기존 기획 예시를 그대로 스펙으로 옮기면 차이가 생길 수 있다.

행사 콘텐츠용 entity_localizations나 Phase 3 번역 Worker를 Docs 번역 체계로 자동 재사용할 수 있다고 가정하지 않는다. 기존 파이프라인의 주 대상은 행사 데이터이고 개발자 문서의 구조·소스와 다르다.

## 6. 90% 충족 여부와 유지보수 판단

- Fumadocs: API 생성·플레이그라운드·일반 가이드·다국어 설정·정적 검색에 공식 경로가 있어, 프로젝트 번역 사전과 빌드 흐름을 추가하면 주요 요구 90% 이상을 목표로 삼기 현실적이다. 필수 조건 전체 통과 판정은 통합 검증 후다. 초기 작업은 중간 정도이며, 이후에는 사전 추가와 API 계약·번역 갱신을 관리하게 된다.
- Starlight + starlight-openapi: 일반 문서에는 적합하다. 그러나 필수에 가까운 다국어 API 문서와 호출 실습에 미해결·추가 구성 항목이 있어 현 상태에서 90% 충족 후보로 확정하지 않겠다. 플러그인 내부 수정까지 필요해지면 1인 운영에 부담이 커진다.
- Starlight + Scalar: 요구 90% 이상을 목표로 삼을 수 있는 대안이다. 대신 문서 셸과 API 화면 사이의 언어·검색·탐색 연결을 유지해야 한다. 통합된 API 개발자 문서 경험을 우선하면 Fumadocs가 더 직접적인 경로라는 판단이다.

가중치를 수치로 만들어 92점 대 88점처럼 제시하지 않았다. 실행 검증이 없는 정성 평가에 그런 정밀도는 근거가 부족하다. API 문서와 다국어를 동시에 통과시키는 것이 일반 부가 기능 수보다 중요하다.

## 7. 최소 검증과 통과 조건

새 도구를 모두 설치해 큰 사이트를 두 개 만들 필요는 없다. Fumadocs 우선 후보의 실제 통합을 아래 범위로 확인하고, 필수 조건이 막히면 Starlight + Scalar를 같은 기준으로 비교한다.

1. ko/ja/en으로 API 빠른 시작 한 페이지와 Onstage 캘린더 구독 안내 한 페이지를 작성한다. 하나의 번역을 일부러 누락해 fallback과 안내도 확인한다.
2. 실제 공개 계약을 반영한 GET /v1/events, /v1/events/{slug}, /v1/calendars/custom.ics를 작은 OpenAPI 입력으로 준비한다. 계획 중인 필터나 페이지네이션을 구현된 기능으로 넣지 않는다.
3. 동일 엔드포인트의 언어 전환 후 제목·사이드바·URL·설명·플레이그라운드 UI를 확인한다. ko/ja UI에 영어가 남는 범위를 목록화한다.
4. country=JP, tags 조건, locale=ja 등을 바꿔 실제 공개 GET 요청을 시험한다. 문서 언어와 API locale을 독립적으로 변경한다. JSON과 text/calendar 응답을 각각 확인한다.
5. “행사”, “캘린더 구독”, “イベント”, “カレンダー”, “locale”, “/v1/events”로 언어 필터·검색 결과를 확인한다. 응답 필드와 파라미터 설명까지 검색되어야 한다면 해당 항목도 따로 확인한다.
6. 개발 서버가 아닌 정적 운영 빌드 결과로 모든 언어 URL의 직접 접속·새로고침·링크 이동·검색·호출을 확인한다. middleware/proxy와 런타임 검색 API가 숨어 남지 않게 한다.
7. API 설명 한 곳을 바꿔 생성 문서·번역 누락/구버전 표시가 어떻게 갱신되는지 확인한다.
8. Phase 2 접근 제한은 배포 계층에서 확인한다. 공개 저장소에 커밋한 본문은 사이트 접근 제한만으로 비공개가 되지 않으므로, 비공개 초안의 소스 보관 범위도 구분한다.

접근 제한은 실제 단계별 요구에 따른 확인 사항이다. 공개 Backstage 사용 안내에 관리자 로그인 기능을 반드시 넣어야 한다는 뜻은 아니다. 사용 가이드와 내부 관리자 API 레퍼런스도 구분한다.

## 최종 추천 구성(아직 확정·구현한 내용 아님)

Fumadocs + Next.js App Router + 공식 fumadocs-openapi + MDX 가이드 + 명시적 언어 경로 + 정적 export/정적 검색을 우선 검증한다. Cloudflare에는 정적 산출물을 배포하고, 현재 공개 API 플레이그라운드는 브라우저 직접 요청으로 구성한다. ko/ja 사이트·OpenAPI UI 사전과 계약/번역 생성 흐름은 프로젝트에서 관리한다.

추천 이유는 “Fumadocs면 다국어가 완제품”이어서가 아니다. 다국어 UI 사전과 번역 입력은 명시적인 프로젝트 작업으로 해결하고, 주력 기능인 API 페이지·요청 실습은 공식 경로로 유지할 수 있어, API 플러그인의 다국어 연동 자체를 고치는 것보다 유지보수 범위를 예측하기 쉽다는 판단이다.

## 저장소 근거

- [API 및 ICS 설계](../plan/08-api-and-ics.md): 공개 API 구현/계획 구분, OpenAPI 공개 단계, 현재 도구 결정.
- [인프라·운영 설계](../plan/10-infra-ops-security.md): Cloudflare 배포 방향, 공개 API CORS 현황.
- [관리자 대시보드 설계](../plan/07-admin-dashboard.md): Backstage 기능과 관리자 UI 다국어 지원.
- [다국어·번역 설계](../plan/06-i18n-translation-glossary.md): 행사 콘텐츠 번역 대상과 상태. Docs 번역과 구분해 읽었다.
- [로드맵](../plan/11-roadmap-and-success.md): OpenAPI와 Docs 미착수, Phase 2/3 및 이후 개발자 기능 계획.
- [Onstage API 클라이언트](../../apps/onstage/src/lib/api.ts), [Onstage 다국어 구성](../../apps/onstage/src/lib/i18n.ts): 현재 공개 API 소비 방식과 ko/ja/en UI.
- Private `scls-platform`의 구현 근거: `apps/api/src/server.ts`, `apps/api/src/routes/public-events.ts`, `apps/api/src/routes/public-calendars.ts`, `apps/api/src/lib/event-filter.ts`, `apps/api/src/lib/resolve-locale.ts`, `apps/api/package.json`. 공개 저장소에서는 구현 근거 경로만 기록한다.
