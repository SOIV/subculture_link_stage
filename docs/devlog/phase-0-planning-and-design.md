[← 작업 로그 목록](README.md) · [현재 로드맵](../plan/11-roadmap-and-success.md)

# Phase 0 기획·기반 설계 기록

기획 단계의 명칭·공개 범위·저장소 구조·ERD·초기 분류를 정리한 이력이다. Phase 1 중 추가로 보강한 설계 내용과 당시 미결 항목도 원문 맥락에 따라 함께 보관한다.

> 2026-10-20에 기존 문서에서 이관했다. 이관일은 개별 작업일이나 재검증일이 아니다. 날짜·완료 여부·미결 상태는 원문에 명시된 범위만 보존한다. 최신 계획과 상태는 각 기획 문서와 [로드맵](../plan/11-roadmap-and-success.md)에서 관리한다.

## 찾아보기

- [기획·기반 설계 체크리스트](#record-1)
- [기획 결정 및 당시 미결 항목](#record-2)
- [문서 분리와 설계 보강 이력](#record-3)
- [Repository 구조와 프론트엔드 선택](#record-4)
- [초기 태그 매핑과 티켓 분류 검토](#record-5)
- [ERD 구성 확정](#record-6)
- [ERD의 참조·상태·세션 설계 확정](#record-7)
- [2026-09-27 — 초기 행사 시리즈 등록 기준](#record-8)
- [무료 운영 원칙의 변경 이력](#record-9)
- [v2 이후 설계 방향 변경](#record-10)
- [OpenAPI 공개 단계 조정](#record-11)

<a id="record-1"></a>

## 기획·기반 설계 체크리스트

기록 출처: [docs/plan/11-roadmap-and-success.md](../plan/11-roadmap-and-success.md)

- **완료** — 프로젝트명 확정: Subculture Link Stage (SCLS)
- **완료** — Repository 구조 및 분리 방식 확정 ([03-architecture-and-domain.md §3.2.1](../plan/03-architecture-and-domain.md#321-repository-구조-확정))
- **완료** — PostgreSQL ERD 작성 ([database/erd.md](../plan/database/erd.md), [database/schema.sql](../plan/database/schema.sql))
- **완료** — 일정 분류 코드 정의 (`schedule_type` 15종 — [database/schema.sql](../plan/database/schema.sql) §1)
- **완료** — 번역 상태 및 검수 상태 정의 (`translation_source`/`translation_status` — [06-i18n-translation-glossary.md §6.1.3](../plan/06-i18n-translation-glossary.md#613-번역-출처-및-상태))
- **완료** — 태그 분류 코드 확정 (트리 구조는 [04-database-design.md §4.4](../plan/04-database-design.md#44-태그-구조), 확정 9개 행사 기준 초기 시드 매핑은 [§4.4.1](../plan/04-database-design.md#441-초기-시드-매핑-확정-9개-행사-기준) — 티켓 방식 세부 구분 등 잔여 항목은 Phase 1 구현과 병행)
- **완료** — 초기 대상 행사 시리즈 9개 선정 ([02-users-and-scope.md §2.3.3](../plan/02-users-and-scope.md#233-초기-대상-행사-시리즈-확정) — 실제 DB 등록 콘텐츠 작업은 Phase 1 구현과 병행)
- **미완료·검토 중** — 초기 수집 출처 및 이용 조건 확인 (X/Instagram 등 SNS API 접근 가능 여부 포함 — Phase 2에서 필요, Phase 1 착수를 막지 않음)

<a id="record-2"></a>

## 기획 결정 및 당시 미결 항목

기록 출처: [docs/plan/11-roadmap-and-success.md](../plan/11-roadmap-and-success.md)

- **완료** — 전체 플랫폼 및 서비스 명칭 확정: SCLS / Subculture Onstage / Subculture Backstage / SCLS API
- **완료** — 행사와 일정 분리
- **완료** — 수집·분석·검수 계층 구분
- **완료** — 다국어 번역 구조 정의
- **완료** — 번역 수정 요청 및 용어집 제안 방향 정의
- **완료** — PostgreSQL + Object Storage 방향 확정
- **완료** — 프로젝트명 확정: Subculture Link Stage (SCLS)
- **완료** — 계획 문서를 카테고리별 파일로 분리 ([docs/plan/](../plan/README.md))
- **완료** — OpenAPI 공개 시점 확정 (Phase 2 개발 착수 / Phase 3 전체 공개)
- **완료** — 운영 형태 방향 정리 (무료 운영·후원 기반. 부분 유료화는 확정하지 않았고 제외되어 무료·비영리로 갈 수도 있음, Onstage 광고 패널은 검토 중)
- **완료** — 공개 범위 확정 (프로젝트·개발/설계·ERD·참고 DDL·Roadmap·Legacy 문서 공개, 향후 OpenAPI/API 문서·Onstage 소스 공개, API/Backstage/Worker/Scheduler 및 내부 운영 구현 비공개)
- **완료** — 개발·운영 참여 방식 확정 (메인 개발자 문의 기반)
- **미완료·검토 중** — 초기 데이터 분류 코드 잔여 항목 확정 (기본 schedule/translation/tag 코드는 §11.1 Phase 0에서 정리, 티켓 방식 등 세부 분류는 구현과 병행)
- **완료** — 관리자 인증 방식 확정 (루트 관리자 / 행사 관리자 대표 / 행사 관리자 하위 계정 3단계 구조 — [07-admin-dashboard.md §7.6](../plan/07-admin-dashboard.md#76-인증-및-권한-구조))
- **완료** — Repository 구조 확정 (2-Repo: 현재 `Subculture_Link_Stage` 공식 공개 Repository에 문서와 향후 Onstage를 함께 관리 + `scls-platform` 비공개 Monorepo — [03-architecture-and-domain.md §3.2.1](../plan/03-architecture-and-domain.md#321-repository-구조-확정))
- **완료** — ERD 확정 (도메인별 6개 다이어그램 + 전체 DDL — [database/erd.md](../plan/database/erd.md), [database/schema.sql](../plan/database/schema.sql))
- **완료** — DB 제공자 확정 (Supabase, Neon은 상시 커넥션 시 과금 급증 리스크로 제외 — [10-infra-ops-security.md §10.1.1](../plan/10-infra-ops-security.md#1011-권장-기술-스택))
- **완료** — 행사 관리자 권한 부여 세부 절차 확정 (신원 확인은 행사 공식 SNS 계정 DM, 대표는 최초 신원 확인된 요청자로 고정 — [07-admin-dashboard.md §7.6.3](../plan/07-admin-dashboard.md#763-권한-부여-절차))
- **완료** — 행사 관리자 계정 도입 Phase 배치 (Change Proposal 파이프라인이 구축되는 Phase 2로 확정 — [02-users-and-scope.md §2.1.3](../plan/02-users-and-scope.md#213-행사-측-담당자-행사-관리자) 참고)
- **완료** — Backstage 관리자 UI 다국어 지원 범위 확정 (ko/en/ja 3개 언어, `i18next` 기반 — 행사 콘텐츠 다국어(`entity_localizations`)와는 별개 개념. 결정 및 구현 완료 — [07-admin-dashboard.md §7.7](../plan/07-admin-dashboard.md#77-관리자-ui-다국어-지원))
- **미완료·검토 중** — 비용 상한 및 트리거 확정

<a id="record-3"></a>

## 문서 분리와 설계 보강 이력

기록 출처: [docs/plan/README.md](../plan/README.md)

### 문서 이력

| 버전 | 형태 | 비고 |
|---|---|---|
| v1~v2 | 단일 문서 (`subculture_event_calendar_api_개발_계획서*.md`) | 프로젝트 개명 전, [docs/legacy/](../legacy) 보관 |
| v3 | 단일 문서 (`Subculture_Link_Stage_개발_계획서_v3.md`) | SCLS 명칭 확정 버전, [docs/legacy/](../legacy) 보관 |
| v4 (현재) | 주제별 분리 문서 (본 폴더) | 파일 분리 + 세부 보강, 초기 구현 진행 단계 (지속 갱신) |

### 이번 분리 작업에서 추가/보강된 내용

- **운영 형태 및 공개 정책** ([01-overview-and-principles.md §1.6](../plan/01-overview-and-principles.md#16-운영-형태-및-공개-정책)) — 시장 차별점(해외 포함 통합 정보와 통합 ICS 피드를 제공하는 서비스는 제한적), 무료 운영 기본(부분 유료화(F2P)는 확정이 아니며 제외될 수 있음, 후원 기반, Onstage 광고 패널 검토 중), 프로젝트·설계 문서 공개 / 서비스 구현 소스 중 Onstage 공개 예정 / API·Backstage·Worker·Scheduler 및 운영 구현 비공개, 문의 채널(`biz@soiv-studio.xyz`)을 통한 개발·운영 참여 방식을 명시.
- **OpenAPI 공개 전략** ([08-api-and-ics.md](../plan/08-api-and-ics.md)) — 원래 후기 확장(Phase 6)이었던 공개 API 문서화를 Phase 2(개발 착수)/Phase 3(전체 공개)로 앞당김. 이미 개인 개발자들이 흩어져서 앱을 만들어 쓰고 있는 상황이라, 공개 API가 초기 사용자 확보 포인트가 될 수 있다는 판단에 따른 것. OpenAPI 스펙 공개는 소스코드 오픈소스화와는 다르다는 점도 함께 명시.
- **SNS 수집 ToS 리스크** ([05-storage-and-collection.md](../plan/05-storage-and-collection.md)) — X/Instagram 자동 수집의 API 접근성·약관 제약을 리스크로 명시.
- **관리자 인증 방식 결정 이력** ([07-admin-dashboard.md](../plan/07-admin-dashboard.md)) — 최초 분리 시에는 세션/JWT/외부 Auth 중 미정이었다. 이후 3단계 인증·권한 구조를 확정하고 루트 관리자 DB 세션 + HttpOnly 쿠키를 구현했다 ( [07-admin-dashboard.md §7.6](../plan/07-admin-dashboard.md#76-인증-및-권한-구조) 참고)
- **비용 상한 미결 표시** ([10-infra-ops-security.md](../plan/10-infra-ops-security.md)) — 구체적 예산 트리거는 운영 데이터가 쌓인 뒤 정하기로 함.
- **ERD 결정 이력** ([04-database-design.md](../plan/04-database-design.md)) — 최초 분리 시 미결이던 다이어그램화를 이후 완료하고 설계 기준을 정리했다 ( [database/erd.md](../plan/database/erd.md)·[database/schema.sql](../plan/database/schema.sql) 참고)

### v4 분리 이후 추가로 확정된 사항

- **Repository 구조 확정** ([03-architecture-and-domain.md §3.2.1](../plan/03-architecture-and-domain.md#321-repository-구조-확정)) — 공식 공개 Repository `Subculture_Link_Stage`에 프로젝트·개발 문서, 아키텍처·데이터 모델, ERD·참고 DDL, Roadmap, Legacy, 향후 OpenAPI/API 문서와 Subculture Onstage 소스를 함께 두고, `scls-api`·`scls-backstage`·`scls-worker`·`scls-scheduler`는 `scls-platform` 비공개 Monorepo로 묶어 DB 스키마·도메인 타입을 공유 패키지로 직접 공유한다. AI 페어 프로그래밍(Claude Code/Codex) 환경에서 서비스 간 공유 타입을 사설 패키지로 나누어 관리하는 비용이 실이익보다 크다는 판단이 근거.
- **ERD 확정** ([database/erd.md](../plan/database/erd.md), [database/schema.sql](../plan/database/schema.sql)) — 약 50개 테이블의 관계를 도메인별 6개 다이어그램으로 정리하고, 전체 컬럼·제약조건을 담은 참고용 DDL을 작성. 기존 문서에 "또는"으로 열려 있던 태그 현지화 방식, `change_proposals` 제출 주체 표현, 다형 참조 허용 범위 등도 함께 확정.

- **프론트엔드 호스팅·위젯·실시간 경로 결정** ([10-infra-ops-security.md §10.1.2](../plan/10-infra-ops-security.md#1012-배포-구조-예시), [§10.3.3](../plan/10-infra-ops-security.md#1033-위젯-임베드-격리-정책)) — Onstage·Backstage·위젯 셸은 Cloudflare에 배포(Vercel 제외), 위젯은 Onstage와 분리해 별도 서브도메인의 정적 셸로 두고 API/WS에 직접 접속, 실시간(WS/SSE)은 별도 서버 없이 API 서버의 별도 경로로 제공하며, Backstage↔API는 `backstage.*`에서 `/admin/*`를 프록시해 동일 오리진을 유지하며, API는 프록시 경유 시크릿과 Origin 검증으로 직접 접근을 막는다. API/Worker는 Supabase가 도쿄 리전이라는 점을 근거로 Fly.io 도쿄로 결정해 초기 배포했고(머신 1대·GitHub Actions 자동 배포, 작업 대기열 Redis 여부는 Phase 2에서 결정), 행사 관리자 로그인·인증 방식(SSO 로그인 + 소셜 연동 자동 인증 후 루트 관리자 최종 확인, 추가 행사는 증명 자료 심사, 소셜·일반 로그인은 기존 수동 절차 유지)은 Phase 2 계정 도입 구현 전에 설계하기로 미결로 남겨 두었다([07-admin-dashboard.md §7.6](../plan/07-admin-dashboard.md#76-인증-및-권한-구조)).

<a id="record-4"></a>

## Repository 구조와 프론트엔드 선택

기록 출처: [docs/plan/03-architecture-and-domain.md](../plan/03-architecture-and-domain.md)

**결정 이유**

- 공개 범위와 비공개 핵심 구현을 Repository 경계로 분리한다([01-overview-and-principles.md §1.6.3](../plan/01-overview-and-principles.md#163-소스-공개-및-참여-정책)). 공개 Repository에는 문서와 향후 Onstage를 함께 두고, API/Backstage/Worker/Scheduler 및 내부 운영 구현은 Private `scls-platform`에 유지한다. Onstage는 공개 REST API만 소비하므로 Private 내부 DB 스키마·패키지와 직접 결합하지 않는다. `scls-onstage`는 서비스 컴포넌트 식별자이며 별도 공개 Repository 이름을 의미하지 않는다.
- `api`/`backstage`/`worker`/`scheduler` 네 서비스는 `events`/`event_schedules`/`change_proposals`/`entity_localizations` 등 핵심 도메인 모델을 그대로 공유한다([§3.5](../plan/03-architecture-and-domain.md#35-데이터-계층), [04-database-design.md](../plan/04-database-design.md)). 이를 4개의 개별 저장소로 나누면 공유 타입을 사설 패키지로 배포·버전관리해야 하는데, 1인 + AI 페어 프로그래밍(Claude Code, Codex 등) 체제에서는 이 비용이 실이익보다 크다.
- AI 코딩 에이전트는 하나의 워킹 디렉터리 컨텍스트 안에서 여러 서비스에 걸친 변경(예: DB 스키마 변경 → api/worker/backstage 동시 반영)을 한 번에 처리할 때 가장 효율적이다. 4개로 쪼개진 저장소를 오가며 각각에서 세션을 새로 여는 구조는 이런 작업에서 불필요한 마찰을 만든다.
- 따라서 공개 범위 경계(문서·향후 Onstage vs 비공개 핵심 구현)에서만 저장소를 나누고, 비공개 영역은 하나의 Monorepo로 묶어 공유 패키지(`packages/db`, `packages/domain`)를 통해 타입을 직접 공유한다.

> **결정 (2026-09-03)**: 프론트엔드 프레임워크는 두 앱을 다르게 가져간다. `apps/backstage`는 React + Vite + TanStack Router/Query + Tailwind v4로 구현한다 — CRUD/폼 위주의 내부 관리자 도구라 관리자 UI 생태계와 AI 코딩 어시스트 학습량이 풍부한 React가 유리하다. 이 공개 Repository의 `apps/onstage`에서 개발하는 Subculture Onstage는 Svelte/SvelteKit을 사용한다 — 공개 웹이라 SEO·초기 로딩이 중요하고, 특히 iframe 위젯(embed/overlay/ambient, [08-api-and-ics.md §8.1.1](../plan/08-api-and-ics.md#811-노출-채널-계층-구조))은 번들 크기에 민감해 Svelte의 작은 런타임이 이점이 크다. Backstage는 기존 Fastify `/admin` API를 그대로 소비하는 순수 SPA이며, 개발 환경에서는 CORS 설정 대신 Vite dev server 프록시(`/admin` → API)로 동일 오리진처럼 동작시키며, 프로덕션에서도 `backstage.*` 호스트가 `/admin/*`를 API로 프록시해 같은 구조를 유지한다([10-infra-ops-security.md §10.1.2](../plan/10-infra-ops-security.md#1012-배포-구조-예시)).

<a id="record-5"></a>

## 초기 태그 매핑과 티켓 분류 검토

기록 출처: [docs/plan/04-database-design.md](../plan/04-database-design.md)

> **미확정 메모**: (일자별 권종·가격과 국내/해외 예매처는 위 `event_ticket_types`·`event_ticket_channels`로 반영했다.) 티켓 방식 중 "선착순"/"추첨" 세부 구분은 행사마다, 회차마다 다르므로 이 표에서는 무료/유료 대분류만 확정하고 세부값은 실제 일정(Event Schedule) 등록 시점에 개별 확인한다. 확인된 것: AGF·일러스타 페스는 둘 다 일산 킨텍스 개최로 수용 인원만큼 전체 입장권 수량이 한정된 선착순 구조(추첨 아님), WONDERLIVET은 선착순·추첨 없이 일자별(1일권/2일권/3일권) 고정가 판매 구조. 지스타는 서울이 아닌 부산 벡스코 개최라 AGF·일러스타 페스와는 규모가 달라 수량 제한이 없는 것으로 추정(미확인). TGS는 정보 없음(미확인). 일자별 티켓처럼 태그로 담기 어려운 세부 구조는 Event Schedule 단위 설계에서 반영한다.

<a id="record-6"></a>

## ERD 구성 확정

기록 출처: [docs/plan/04-database-design.md](../plan/04-database-design.md)

전체 테이블 간 관계를 다이어그램으로 정리한 ERD는 [database/erd.md](../plan/database/erd.md)에 있다. 도메인별로 6개 다이어그램(행사/일정, 조직·장소·작품·인물·태그, 수집·분석, 검수·변경, 다국어·번역, 인증·사용자·알림·스토리지)으로 나누어 정리했으며, 본 파일 §4.2~4.4에서 "또는"으로 열려 있던 세부 사항(태그 현지화 방식, change_proposals 제출 주체 표현, 다형 참조 허용 범위 등)을 확정한 내용도 포함한다.

<a id="record-7"></a>

## ERD의 참조·상태·세션 설계 확정

기록 출처: [docs/plan/database/erd.md](../plan/database/erd.md)

### 확정하며 정리한 사항

기존 §4.2/§4.4에 "또는"으로 열려 있던 항목을 다이어그램화 과정에서 다음과 같이 확정했다.

- **태그 표시명**: 전용 `tag_localizations`를 새로 만들지 않고 `entity_localizations`(entity_type='TAG')로 통일한다.
- **change_proposals 제출 주체**: `staff_accounts`와 `event_organizer_accounts`를 가리키는 두 개의 nullable FK(`submitted_by_staff_id`, `submitted_by_organizer_account_id`)로 표현한다. 신뢰 수준이 다른 두 계정 체계를 하나의 다형 FK로 묶지 않기 위함이며, 둘 다 NULL이면 시스템(자동 파이프라인) 제출로 간주한다.
- **다형 참조 허용 범위**: `entity_id`/`target_id`/`scope_id` 형태의 다형 컬럼은 `entity_localizations`, `user_subscriptions`, `glossary_terms`/`glossary_suggestions` 세 곳에만 남기고, 나머지 핵심 관계(행사·태그·조직·스토리지 등)는 전부 대상별 전용 FK로 분리했다 — §4.2 원칙("target_type+target_id 범용 연결 테이블은 사용하지 않는다")과의 정합성을 유지하기 위함이다.
- **event/event_schedule status 값**: 문서에 명시되지 않았던 `events.status`(DRAFT/CONFIRMED/CANCELLED/POSTPONED/ENDED/ARCHIVED), `event_schedules.status`(SCHEDULED/CONFIRMED/CANCELLED/POSTPONED/COMPLETED) 등 세부 상태값을 이번에 확정했다. 구현 중 부족하면 CHECK 제약을 조정한다.
- **staff_sessions 추가**: 최초 ERD 확정 시에는 없던 테이블이다. Phase 1 구현 중 루트 관리자 로그인을 세션+쿠키 방식으로 확정하면서([07-admin-dashboard.md §7.6.3](../plan/07-admin-dashboard.md#763-권한-부여-절차)) 추가했다.

<a id="record-8"></a>

## 2026-09-27 — 초기 행사 시리즈 등록 기준

기록 출처: [docs/plan/02-users-and-scope.md](../plan/02-users-and-scope.md)

선정 기준은 수집 가능성, 공식 출처 안정성, 실제 사용 빈도다. 코믹월드처럼 지역별로 개별 개최되는 시리즈는 하나의 Event Series 아래 지역별 Event로 묶는 방식으로 초기 데이터 등록 시 확정했다(2026-09-27 — 코믹월드 330~338 등록 기준).

<a id="record-9"></a>

## 무료 운영 원칙의 변경 이력

기록 출처: [docs/plan/10-infra-ops-security.md](../plan/10-infra-ops-security.md)

v2는 완전 무료 운영을 가정했다. 현재 운영 형태는 무료를 기본으로 하며, 부분 유료화(F2P)는 확정된 내용이 아니고 제외될 수도 있다. 운영 비용은 후원과 검토 중인 Onstage 광고 패널로 충당할 수 있다. 수익이 생길 경우의 사용처(개발·운영 유지비 우선, 잉여는 행사 관련 투자·참여 비용)는 [01-overview-and-principles.md §1.6.2](../plan/01-overview-and-principles.md#162-운영-형태) 참고.

<a id="record-10"></a>

## v2 이후 설계 방향 변경

기록 출처: [docs/plan/01-overview-and-principles.md](../plan/01-overview-and-principles.md)

- v2의 공식 행사 일정 캘린더·읽기 전용 API 구조를 기반으로 **수집·검수·번역이 가능한 행사 데이터 플랫폼**으로 확장
- MongoDB 단일 구조에서 **PostgreSQL + Object Storage + Worker Queue** 구조로 변경
- 행사 본체와 개별 일정(공연, 추첨, 판매, 스트리밍 등)을 분리
- 단순 카테고리/배열 태그에서 **다대다 태그 및 계층형 분류 체계**로 변경
- 공식 웹, SNS, 예매처 등 행사별 다중 수집 소스 등록
- 과거 승인·거절 데이터를 활용한 규칙 기반 분류 및 유사도 비교 도입
- 한국어·일본어·영어 다국어 현지화 및 자동 번역 파이프라인 추가
- 공식 번역, 자동 번역, 검수 번역을 구분하고 번역 리비전 관리
- 사용자 번역 수정 요청 및 용어집 제안 기능 추가
- 원본 HTML, JSON, 이미지, 포스터 등을 위한 오브젝트 스토리지 도입
- 완전 무료 운영 고정 조건을 제거하고, 초기 저비용 운영을 우선하는 방향으로 변경

<a id="record-11"></a>

## OpenAPI 공개 단계 조정

기록 출처: [docs/plan/08-api-and-ics.md](../plan/08-api-and-ics.md)

이에 따라 공개 문서화 일정은 원래 후기 확장(Phase 6) 계획에서 앞당겨졌다.
