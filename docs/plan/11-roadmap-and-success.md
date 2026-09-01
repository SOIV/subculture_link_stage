[← 목차](README.md)

# 11. 개발 단계, 성공 기준, 구현 체크리스트

## 11.1 개발 단계

### Phase 0 — 기획 및 기반 설계

- [x] 프로젝트명 확정: Subculture Link Stage (SCLS)
- [x] Repository 구조 및 분리 방식 확정 ([03-architecture-and-domain.md §3.2.1](03-architecture-and-domain.md#321-repository-구조-확정))
- [x] PostgreSQL ERD 작성 ([database/erd.md](database/erd.md), [database/schema.sql](database/schema.sql))
- [x] 일정 분류 코드 정의 (`schedule_type` 15종 — [database/schema.sql](database/schema.sql) §1)
- [x] 번역 상태 및 검수 상태 정의 (`translation_source`/`translation_status` — [06-i18n-translation-glossary.md §6.1.3](06-i18n-translation-glossary.md#613-번역-출처-및-상태))
- [x] 태그 분류 코드 확정 (트리 구조는 [04-database-design.md §4.4](04-database-design.md#44-태그-구조), 확정 9개 행사 기준 초기 시드 매핑은 [§4.4.1](04-database-design.md#441-초기-시드-매핑-확정-9개-행사-기준) — 티켓 방식 세부 구분 등 잔여 항목은 Phase 1 구현과 병행)
- [x] 초기 대상 행사 10개 선정 ([02-users-and-scope.md §2.3.3](02-users-and-scope.md#233-초기-대상-행사-시리즈-확정) — 실제 DB 등록 콘텐츠 작업은 Phase 1 구현과 병행)
- [ ] 초기 수집 출처 및 이용 조건 확인 (X/Instagram 등 SNS API 접근 가능 여부 포함 — Phase 2에서 필요, Phase 1 착수를 막지 않음)

### Phase 1 — Core MVP

- [x] PostgreSQL 및 Migration 구성 (Supabase 프로젝트 연결, `scls-platform` 비공개 저장소의 `packages/db`에 Phase 1 범위 Prisma 스키마 및 초기 migration 적용 완료)
- [ ] Event Series, Event, Event Schedule 구현 (Prisma 스키마·테이블은 위 migration에 포함됨 — 여기서는 CRUD API/관리자 UI까지의 완성을 의미. `/admin` 프리픽스 CRUD API는 구현·인증 연결 완료(`scls-platform`의 `apps/api/src/routes/event-series.ts`, `events.ts`, `event-schedules.ts`), 관리자 UI는 아직 미착수)
- [ ] Venue, Organizer, Tag 구현 (스키마는 포함됨, CRUD API/UI 남음)
- [ ] Localizations 구현 (스키마는 포함됨, CRUD API/UI 남음)
- [x] 루트 관리자 로그인 구현 (DB 저장 세션 + 쿠키 방식 — [07-admin-dashboard.md §7.6.3](07-admin-dashboard.md#763-권한-부여-절차-초안) 결정 사항 참고. `scls-platform`의 `apps/api/src/routes/auth.ts`)
- [ ] 행사 수동 등록·수정 UI
- [ ] 공개 GET API
- [ ] ICS 전체 피드
- [ ] 테스트 행사 20개 이상 등록

### Phase 2 — 수집 및 검수

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
- [x] 소스 공개 범위 확정 (Onstage만 오픈소스, API/Worker/Backstage는 비공개)
- [x] 개발·운영 참여 방식 확정 (메인 개발자 문의 기반)
- [ ] 초기 데이터 분류 코드 확정
- [x] 관리자 인증 방식 확정 (루트 관리자 / 행사 관리자 대표 / 행사 관리자 하위 계정 3단계 구조 — [07-admin-dashboard.md §7.6](07-admin-dashboard.md#76-인증-및-권한-구조))
- [x] Repository 구조 확정 (2-Repo: `scls-onstage` 별도 공개 저장소 + `scls-platform` 비공개 Monorepo — [03-architecture-and-domain.md §3.2.1](03-architecture-and-domain.md#321-repository-구조-확정))
- [x] ERD 확정 (도메인별 6개 다이어그램 + 전체 DDL — [database/erd.md](database/erd.md), [database/schema.sql](database/schema.sql))
- [x] DB 제공자 확정 (Supabase, Neon은 상시 커넥션 시 과금 급증 리스크로 제외 — [10-infra-ops-security.md §10.1.1](10-infra-ops-security.md#1011-권장-기술-스택))
- [ ] 행사 관리자 권한 부여 세부 절차 확정 (신원 확인 기준, 대표 지정 기준 — 07-admin-dashboard.md §7.6.3 잔여 미결 항목. 루트 관리자 계정 세션 방식·복구 수단은 확정 및 구현 완료됨)
- [ ] 행사 관리자 계정 도입 Phase 배치 (현재 로드맵 미배치 — [02-users-and-scope.md §2.1.3](02-users-and-scope.md#213-행사-측-담당자-행사-관리자) 참고)
- [ ] 비용 상한 및 트리거 확정

### 구현

- [ ] Phase 1: Core MVP
- [ ] Phase 2: 수집 및 검수
- [ ] Phase 3: 다국어 번역
- [ ] Phase 4: 커뮤니티 기여
- [ ] Phase 5: 외부 연동 및 자동화
- [ ] Phase 6: 운영 확장

### 초기 데이터

- [ ] Event Series 10개 이상
- [ ] Event 20개 이상
- [ ] Event Schedule 50개 이상
- [ ] Venue 10개 이상
- [ ] Tag 30개 이상
- [ ] 공식 용어집 100개 이상
- [ ] 수집 출처 3개 이상

---

[← 목차](README.md) · 이전: [10. 인프라, 데이터 보관, 보안, 운영](10-infra-ops-security.md)
