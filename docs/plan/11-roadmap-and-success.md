[← 목차](README.md)

# 11. 개발 단계, 성공 기준, 구현 체크리스트

> [!NOTE]
> 현황 기준: 2026-09-30. 현재 Phase 1 Core MVP 개발을 Private `scls-platform`에서 진행 중이다. API·Backstage 초기 기능과 공개 GET API·ICS 피드, Localizations CRUD API/UI를 구현했고, Backstage(Cloudflare Workers)와 API(Fly.io 도쿄)를 임시 도메인으로 초기 배포해 테스트 중이다. §2.3.3 확정 9개 시리즈 기준 초기 행사 데이터 22건(장소 7·태그 16·다국어 이름 162건 포함)을 등록했다 — 공식 출처로 확인한 것은 13건, 기사 등 간접 출처로 확인한 것은 9건이며 공식 표기가 없는 언어의 제목 다수는 기계번역(검수 필요) 상태다. 정식 도메인 확정 등은 남아 있다. Subculture Onstage는 이 공식 공개 Repository의 `apps/onstage`에서 착수해 메인 페이지·행사 목록·상세를 구현했으며, 정식 도메인 미연결로 아직 배포 전이다.
> `[x]`는 해당 기획·설계 또는 개별 구현 항목의 완료를 뜻하며, 세부 기능 완료만으로 Phase 전체 완료나 운영 배포를 뜻하지 않는다. Private 파일 경로는 개발 기록의 구현 근거로만 남긴다.

## 11.1 개발 단계

### Phase 0 — 기획 및 기반 설계

- [x] 프로젝트명 확정: Subculture Link Stage (SCLS)
- [x] Repository 구조 및 분리 방식 확정 ([03-architecture-and-domain.md §3.2.1](03-architecture-and-domain.md#321-repository-구조-확정))
- [x] PostgreSQL ERD 작성 ([database/erd.md](database/erd.md), [database/schema.sql](database/schema.sql))
- [x] 일정 분류 코드 정의 (`schedule_type` 15종 — [database/schema.sql](database/schema.sql) §1)
- [x] 번역 상태 및 검수 상태 정의 (`translation_source`/`translation_status` — [06-i18n-translation-glossary.md §6.1.3](06-i18n-translation-glossary.md#613-번역-출처-및-상태))
- [x] 태그 분류 코드 확정 (트리 구조는 [04-database-design.md §4.4](04-database-design.md#44-태그-구조), 확정 9개 행사 기준 초기 시드 매핑은 [§4.4.1](04-database-design.md#441-초기-시드-매핑-확정-9개-행사-기준) — 티켓 방식 세부 구분 등 잔여 항목은 Phase 1 구현과 병행)
- [x] 초기 대상 행사 시리즈 9개 선정 ([02-users-and-scope.md §2.3.3](02-users-and-scope.md#233-초기-대상-행사-시리즈-확정) — 실제 DB 등록 콘텐츠 작업은 Phase 1 구현과 병행)
- [ ] 초기 수집 출처 및 이용 조건 확인 (X/Instagram 등 SNS API 접근 가능 여부 포함 — Phase 2에서 필요, Phase 1 착수를 막지 않음)

### Phase 1 — Core MVP

- [x] PostgreSQL 및 Migration 구성 (Supabase 프로젝트 연결, `scls-platform` 비공개 저장소의 `packages/db`에 Phase 1 범위 Prisma 스키마 및 초기 migration 적용 완료)
- [x] Event Series, Event, Event Schedule 구현 (Prisma 스키마·테이블은 위 migration에 포함됨. `/admin` 프리픽스 CRUD API 구현·인증 연결 완료(`scls-platform`의 `apps/api/src/routes/event-series.ts`, `events.ts`, `event-schedules.ts`), 관리자 UI도 3종 모두 CRUD 구현 완료(`scls-platform`의 `apps/backstage/src/routes/EventSeriesPage.tsx`, `EventsPage.tsx`, `EventSchedulesPanel.tsx`) — Event Schedule은 선택된 행사에 종속되는 패널 형태)
- [x] Venue, Organizer, Tag 구현 (스키마 포함 — `/admin` CRUD API 구현·인증 연결 완료(`scls-platform`의 `apps/api/src/routes/venues.ts`, `organizers.ts`, `tag-groups.ts`, `tags.ts`), 관리자 UI도 구현 완료(`scls-platform`의 `apps/backstage/src/routes/VenuesPage.tsx`, `OrganizersPage.tsx`, `TagsPage.tsx` — Tag는 그룹 선택형 2단 구성))
- [x] Localizations 구현 (스키마 포함, `/admin` CRUD API 구현·인증 연결 완료 — `scls-platform`의 `apps/api/src/routes/entity-localizations.ts`. EVENT/EVENT_SERIES/EVENT_SCHEDULE/VENUE/ORGANIZER/TAG 대상 `/admin/localizations/:entityType/:entityId` GET·POST, `/admin/localizations/:id` PATCH·DELETE 구현. 관리자 UI도 구현 완료 — `scls-platform`의 `apps/backstage/src/routes/LocalizationsPanel.tsx`를 EventSeries/Events/Venues/Organizers/Tags 각 관리 화면에 연결)
- [x] 루트 관리자 로그인 구현 (DB 저장 세션 + 쿠키 방식 — [07-admin-dashboard.md §7.6.3](07-admin-dashboard.md#763-권한-부여-절차) 결정 사항 참고. `scls-platform`의 `apps/api/src/routes/auth.ts`)
- [x] 행사 수동 등록·수정 UI (위 Event 관리자 UI로 충족 — `scls-platform`의 `apps/backstage/src/routes/EventsPage.tsx`)
- [x] 공개 GET API ([08-api-and-ics.md §8.2](08-api-and-ics.md#82-공개-api-예시)의 현재 구현 범위로 `/v1` 프리픽스, `{success,data}` 응답 봉투로 구현 완료 — `scls-platform`의 `apps/api/src/routes/public-*.ts`. `events`/`events/:slug`/`event-series`/`schedules`/`venues`/`tags`/`search`/`health` 전부 구현, `events` 목록은 `country`/`tags`/`from`/`to` 필터 지원. `category`/`franchise` 필터는 대응 데이터 모델이 아직 없어(franchises는 Phase 1 범위 밖) 보류. title/summary는 `entity_localizations` 조회로 채워지며, 초기 행사 데이터 22건 등록 후 대부분 채워졌다 — 공식 표기가 없는 언어는 기계번역·검수 필요 상태로 남아 있다)
- [x] ICS 전체 피드 ([08-api-and-ics.md §8.6](08-api-and-ics.md#86-ics-및-캘린더-설계) 기준 `/v1/calendars/all.ics`·`online.ics`·`custom.ics`(country/tags/from/to 필터)와 국가 코드 기반 피드(`kr.ics`/`jp.ics` 등, 하드코딩 없이 일반화) 구현 완료 — `scls-platform`의 `apps/api/src/routes/public-calendars.ts`. VTIMEZONE 블록 없이 TZID만 쓰는 최소 RFC 5545 구현)
- [x] Backstage·API 초기 배포 (Backstage는 Cloudflare Workers, API는 Fly.io 도쿄 — [10-infra-ops-security.md §10.1.2](10-infra-ops-security.md#1012-배포-구조-예시) 결정 기준. API는 GitHub Actions, Backstage는 Cloudflare의 Git 연동으로 push 시 자동 배포. 임시 도메인으로 테스트 중이며 정식 공개는 아님)
- [ ] 정식 도메인 확정 및 연결 (Backstage·API 호스트 — API 도메인 연결 절차는 [10-infra-ops-security.md §10.1.2](10-infra-ops-security.md#1012-배포-구조-예시) 참고)
- [x] 테스트 행사 20개 이상 등록 (22개 등록 완료 — §2.3.3 확정 9개 시리즈 기준, 공식 확인 13건·간접 확인 9건. 등록 스크립트는 Private `scls-platform`의 `apps/api/src/scripts/seed-events.ts`, 데이터는 같은 경로의 `seed-data/events-2026.ts`)
- [ ] Subculture Onstage 행사 상세 웹페이지 — 착수. `apps/onstage`(SvelteKit, `adapter-cloudflare`)에 메인 페이지(`/`), 행사 목록·필터·검색(`/events`), 상세와 ICS 구독 링크, ko/ja/en(로케일 접두사 `/ja`, `/en`, 기본 `/`) 구현 완료. 로컬 개발 서버로 실제 공개 API 데이터로 확인함 — 정식 도메인 미연결로 아직 배포 전이고, 사용자 제보·수정 요청 등 이후 기능은 범위 밖([02-users-and-scope.md §2.2.1](02-users-and-scope.md#221-core-mvp-기능-phase-1)). 아래는 1차 디자인 패스 뒤에 적어 둔 수정 항목이다(2026-09-30 반영)
  - [x] Main HP 작업 — 메인 페이지가 없이 곧바로 행사 검색으로 넘어가던 구조를 바꿔 `/`를 메인 페이지로, 행사 목록은 `/events`로 분리했다(`apps/onstage`의 `routes/[[lang=lang]]/+page.svelte`, `events/+page.svelte`). 메인에는 소개 문구, 필터와 무관하게 검색어만 넘기는 단독 검색창, 국가·분류 바로가기, 곧 열리는 행사, 티켓·신청 임박 일정, 캘린더 구독 안내를 둔다. 행사 광고는 "광고" 표시가 붙는 추천 행사 자리(`lib/components/PromotedEvents.svelte`)만 마련했고, 광고 데이터가 없어 운영 화면에는 나오지 않는다(개발 모드에서만 점선 자리 표시) — 광고 등록·과금·표기 정책은 미정
  - [x] 검색 시스템 관련 — 행사 목록의 필터 박스 맨 위에 검색창을 넣어 검색과 필터를 함께 쓴다(`lib/components/FilterBar.svelte`). 별도 `/search` 페이지와 헤더의 "검색" 메뉴는 없앴다. 공개 API에 검색어 `q`(모든 언어의 제목·slug 부분 일치)를 추가했다 — `scls-platform`의 `apps/api/src/lib/event-filter.ts`, `routes/public-events.ts` ([08-api-and-ics.md §8.2](08-api-and-ics.md#82-공개-api-예시))
  - [x] 언어 및 배경 모드 — 헤더 오른쪽 "설정" 메뉴 하나에 언어(한국어/日本語/English)와 화면 모드(시스템/라이트/다크)를 모았다(`lib/components/SettingsMenu.svelte`). 언어를 바꿔도 현재 경로와 검색 조건은 유지된다
  - [x] 행사별 보여주는 내용물 관련 — 카드를 "요약 + 다음 일정" 방식으로 바꿨다(`lib/components/EventCard.svelte`, `lib/schedule.ts`, `lib/tags.ts`). 기간·제목·장소·분류 칩(최대 4개)만 싣고, 그 행사에서 지금 시점 기준 가장 가까운 일정 1개(D-day, 진행 중이면 "진행 중")와 "일정 N개 더 보기"를 붙여 일정 종류가 행사마다 달라도 카드 크기가 일정하다. "확정" 표시는 빼고 연기·취소 등만 표시한다. 같은 종류 일정이 여러 개인 행사는 DB·API에 구분 이름이 없어 같은 이름으로 나온다(후속)
  - [x] 한국 국기 관련 — 직접 그린 그림(태극기 4괘 누락)과 Windows에서 글자로 깨지는 이모지를 flag-icons(MIT)의 표준 국기 SVG로 교체했다(한국·일본, `lib/components/CountryBadge.svelte`). 국가 선택칸의 이모지는 뺐다
  - [ ] 그 외 — 1차 정리 완료: 이모지를 통일된 선 아이콘(`@lucide/svelte`)으로 교체, 헤더 로고 아래 태그라인 중복 삭제, 목록 페이지 상단 정리, 한국어 줄바꿈을 단어 단위로, 언어 전환 시 `<html lang>` 갱신. 이후 화면을 쓰면서 발견되는 수정은 이어서 반영한다
  - [x] 필터 검색 관련 기능 — 태그를 행사 형식 / 참가 방식 / 티켓 방식 드롭다운 3개로 나눠 각각 하나씩 골라 검색한다(`lib/components/FilterBar.svelte`, `events/+page.ts`). 같은 그룹 안의 태그는 "또는", 그룹 사이는 "그리고"로 처리하고 상위 태그를 고르면 하위 태그가 붙은 행사도 포함한다 — 공개 API `tags`와 ICS `custom.ics`가 같은 규칙을 쓰도록 `scls-platform`의 `apps/api/src/lib/event-filter.ts`로 조건 조립을 통합했다([08-api-and-ics.md §8.2](08-api-and-ics.md#82-공개-api-예시))

### Phase 2 — 수집 및 검수

- [ ] 행사 관리자 로그인·인증 방식 설계 (SSO 로그인 + 소셜 연동 자동 인증으로 메인 계정에 묶인 행사 시리즈 연결 + 루트 관리자 최종 확인, 그 외 행사는 증명 자료 심사, 소셜·일반 로그인은 기존 수동 절차 유지. 공식 SNS 계정 목록과 시리즈 단위 권한 범위 등 스키마 신설·변경 포함, 계정 도입 구현 전에 확정 — [07-admin-dashboard.md §7.6.3](07-admin-dashboard.md#763-권한-부여-절차) 미결 사항 참고)
- [ ] 행사 관리자 계정 도입 (대표·하위 3단계 권한 부여 절차 구현 — [07-admin-dashboard.md §7.6.3](07-admin-dashboard.md#763-권한-부여-절차), Change Proposal 파이프라인을 통해 제안 제출)
- [ ] Sources 및 Source Rules 구현
- [ ] 공식 웹사이트 1~2개 Collector 구현
- [ ] Collected Documents 및 Storage Object 구현
- [ ] 해시 중복 검사
- [ ] Change Proposal 생성
- [ ] 관리자 승인·거절 UI
- [ ] 원문 스냅샷 및 변경 비교
- [ ] **OpenAPI 3.x 스펙 작성 착수** (비공개, 내부 검증용) — [08-api-and-ics.md §OpenAPI 공개 전략](08-api-and-ics.md#85-openapi-공개-전략)
- [ ] **API Docs 페이지 개발 착수** (비공개)

### Phase 3 — 다국어 번역

- [ ] 언어 감지
- [ ] 한국어·일본어·영어 번역 Worker
- [ ] 번역 출처 및 상태 표시
- [ ] 원문 리비전과 OUTDATED 처리
- [ ] 용어집 기본 기능
- [ ] 공식 명칭 초기 용어 등록
- [ ] 관리자 번역 검수 UI
- [ ] **OpenAPI 스펙 및 API Docs 페이지 전체 공개**

### Phase 4 — 커뮤니티 기여

- [ ] 사용자 로그인
- [ ] 행사 정보 수정 요청
- [ ] 번역 수정 요청
- [ ] 용어집 제안
- [ ] 중복 제안 병합
- [ ] 신뢰 기여자 및 번역 검수자 권한

### Phase 5 — 외부 연동 및 자동화

- [ ] 디스코드 봇 API 연동 예제 및 문서화 (이미 공개된 OpenAPI Docs를 소비하는 사례로 작성)
- [ ] 카테고리·작품별 ICS
- [ ] 알림 작업 생성
- [ ] Discord 알림 발송
- [ ] 임베딩 및 유사 문서 검색
- [ ] 고신뢰 출처 제한적 자동 승인

### Phase 6 — 운영 확장

- [ ] API Key 발급 체계 및 개발자 콘솔 (기본 공개 조회는 Phase 3에 이미 개방됨 — 여기서는 상향 Rate Limit, Webhook 구독 등 심화 기능 대상)
- [ ] 사용자 개인 구독 및 개인 ICS
- [ ] 내 행사 기록(관심·갈 예정·다녀옴)과 연간 리캡 (Phase 4 로그인 직후가 아니라 등록 행사와 사이트 사용량이 어느 정도 확인된 뒤 착수 — 방향은 [02-users-and-scope.md §2.2.4](02-users-and-scope.md#224-후기-확장-기능) 메모 참고)
- [ ] Webhook 또는 변경 Feed
- [ ] 외부 수집 소스 확대
- [ ] 비용·용량 모니터링 자동화
- [ ] 백업 및 재해 복구 훈련

## 11.2 성공 기준

### MVP 성공 기준

- 행사 및 일정 50건 이상 관리
- 공식 출처 3개 이상 정기 수집
- 수집 후보를 관리자 화면에서 승인·거절 가능
- 한국어·일본어·영어 행사 상세 제공
- 전체 및 국가별 ICS 피드 정상 동작
- 디스코드 봇 또는 외부 클라이언트에서 공개 API 조회 가능

### 초기 운영 성공 기준

- 행사 시리즈 20개 이상
- 장소 30개 이상
- 작품/IP 30개 이상
- 승인·거절 수집 데이터 1,000건 이상
- 번역 용어 500건 이상
- 변경·취소 공지를 누락 없이 처리할 수 있는 운영 흐름 확보
- DB와 스토리지 용량 및 비용을 월 단위로 추적

## 11.3 구현 체크리스트

### 기획

- [x] 전체 플랫폼 및 서비스 명칭 확정: SCLS / Subculture Onstage / Subculture Backstage / SCLS API
- [x] 행사와 일정 분리
- [x] 수집·분석·검수 계층 구분
- [x] 다국어 번역 구조 정의
- [x] 번역 수정 요청 및 용어집 제안 방향 정의
- [x] PostgreSQL + Object Storage 방향 확정
- [x] 프로젝트명 확정: Subculture Link Stage (SCLS)
- [x] 계획 문서를 카테고리별 파일로 분리 ([docs/plan/](README.md))
- [x] OpenAPI 공개 시점 확정 (Phase 2 개발 착수 / Phase 3 전체 공개)
- [x] 운영 형태 확정 (무료 + 부분 유료화, 유료화 전에는 후원 기반)
- [x] 공개 범위 확정 (프로젝트·개발/설계·ERD·참고 DDL·Roadmap·Legacy 문서 공개, 향후 OpenAPI/API 문서·Onstage 소스 공개, API/Backstage/Worker/Scheduler 및 내부 운영 구현 비공개)
- [x] 개발·운영 참여 방식 확정 (메인 개발자 문의 기반)
- [ ] 초기 데이터 분류 코드 잔여 항목 확정 (기본 schedule/translation/tag 코드는 §11.1 Phase 0에서 정리, 티켓 방식 등 세부 분류는 구현과 병행)
- [x] 관리자 인증 방식 확정 (루트 관리자 / 행사 관리자 대표 / 행사 관리자 하위 계정 3단계 구조 — [07-admin-dashboard.md §7.6](07-admin-dashboard.md#76-인증-및-권한-구조))
- [x] Repository 구조 확정 (2-Repo: 현재 `Subculture_Link_Stage` 공식 공개 Repository에 문서와 향후 Onstage를 함께 관리 + `scls-platform` 비공개 Monorepo — [03-architecture-and-domain.md §3.2.1](03-architecture-and-domain.md#321-repository-구조-확정))
- [x] ERD 확정 (도메인별 6개 다이어그램 + 전체 DDL — [database/erd.md](database/erd.md), [database/schema.sql](database/schema.sql))
- [x] DB 제공자 확정 (Supabase, Neon은 상시 커넥션 시 과금 급증 리스크로 제외 — [10-infra-ops-security.md §10.1.1](10-infra-ops-security.md#1011-권장-기술-스택))
- [x] 행사 관리자 권한 부여 세부 절차 확정 (신원 확인은 행사 공식 SNS 계정 DM, 대표는 최초 신원 확인된 요청자로 고정 — [07-admin-dashboard.md §7.6.3](07-admin-dashboard.md#763-권한-부여-절차))
- [x] 행사 관리자 계정 도입 Phase 배치 (Change Proposal 파이프라인이 구축되는 Phase 2로 확정 — [02-users-and-scope.md §2.1.3](02-users-and-scope.md#213-행사-측-담당자-행사-관리자) 참고)
- [x] Backstage 관리자 UI 다국어 지원 범위 확정 (ko/en/ja 3개 언어, `i18next` 기반 — 행사 콘텐츠 다국어(`entity_localizations`)와는 별개 개념. 결정 및 구현 완료 — [07-admin-dashboard.md §7.7](07-admin-dashboard.md#77-관리자-ui-다국어-지원))
- [ ] 비용 상한 및 트리거 확정

### 구현

- [x] Phase 1: Core MVP 개발 착수
- [ ] Phase 1: Core MVP — 진행 중 (§11.1 세부 항목 기준)
- [ ] Phase 2: 수집 및 검수
- [ ] Phase 3: 다국어 번역
- [ ] Phase 4: 커뮤니티 기여
- [ ] Phase 5: 외부 연동 및 자동화
- [ ] Phase 6: 운영 확장

### 초기 데이터

- [ ] Event Series 10개 이상 (현재 9개 — §2.3.3 확정 시리즈 전부 등록, 10개째는 반복 투어형 시리즈 추가 검토와 함께 이후 확대)
- [x] Event 20개 이상 (22개 등록)
- [ ] Event Schedule 50개 이상 (현재 27개)
- [ ] Venue 10개 이상 (현재 7개)
- [ ] Tag 30개 이상 (현재 16개 — [04-database-design.md §4.4](04-database-design.md#44-태그-구조) 트리 전체 등록, 세부 확장은 이후 검토)
- [ ] 공식 용어집 100개 이상
- [ ] 수집 출처 3개 이상

---

[← 목차](README.md) · 이전: [10. 인프라, 데이터 보관, 보안, 운영](10-infra-ops-security.md)
