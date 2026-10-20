[← 목차](README.md)

# 11. 개발 단계, 성공 기준, 구현 체크리스트

> [!NOTE]
> 현재 Phase 1 Core MVP 진행 중이다. Private `scls-platform`에서 API·Backstage 기본 기능을, 이 공개 Repository의 `apps/onstage`에서 메인·행사 목록·상세를 구현해 임시 도메인으로 배포·테스트 중이다. 정식 도메인은 미정이다.
> 이 문서는 **현재 상태·남은 작업·성공 기준**을 관리한다. 상세 변경 내용과 구현 근거는 [작업 로그](../devlog/README.md)에 기록한다.
> `[x]`는 해당 기획·설계 또는 개별 구현 항목의 완료를 뜻하며, 세부 기능 완료만으로 Phase 전체 완료나 운영 배포를 뜻하지 않는다.

## 11.1 개발 단계

### Phase 0 — 기획 및 기반 설계

설계 확정 과정과 기획 체크리스트의 상세 기록은 [Phase 0 작업 로그](../devlog/phase-0-planning-and-design.md)에 보관한다.

- [x] 프로젝트명 확정: Subculture Link Stage (SCLS)
- [x] 공식 공개 Repository + 비공개 Monorepo 구조 확정 ([§3.2.1](03-architecture-and-domain.md#321-repository-구조-확정))
- [x] PostgreSQL ERD·참고 DDL 작성 ([ERD](database/erd.md), [DDL](database/schema.sql))
- [x] 일정 분류 코드 15종 정의 ([DDL §1](database/schema.sql))
- [x] 번역 출처·검수 상태 정의 ([§6.1.3](06-i18n-translation-glossary.md#613-번역-출처-및-상태))
- [x] 태그 트리·초기 시드 매핑 확정 — 티켓 방식 세부값은 Phase 1과 병행 ([§4.4](04-database-design.md#44-태그-구조))
- [x] 초기 대상 행사 시리즈 9개 선정 ([§2.3.3](02-users-and-scope.md#233-초기-대상-행사-시리즈-확정))
- [ ] 초기 수집 출처·이용 조건 확인 — SNS API 접근 포함, Phase 2 착수 전 확인

### Phase 1 — Core MVP

상세 변경 내용과 구현 파일 경로는 [초기 구현 기록](../devlog/phase-1-initial-implementation.md)을 참고한다.

- [x] PostgreSQL 및 Migration 구성 — Supabase 연결, Phase 1 Prisma 스키마·초기 migration 적용
- [x] Event Series, Event, Event Schedule CRUD API·관리자 UI
- [x] Venue, Organizer, Tag CRUD API·관리자 UI
- [x] Localizations CRUD API·관리자 UI — 행사·시리즈·일정·장소·주최·태그 대상
- [x] 루트 관리자 로그인 — DB 저장 세션 + HttpOnly 쿠키 ([§7.6.3](07-admin-dashboard.md#763-권한-부여-절차))
- [x] 행사 수동 등록·수정 UI — 태그·주최/후원·행사 링크 연결 관리 포함
- [x] 공개 GET API — `/v1` 기본 조회·검색·행사 필터 구현, `category`/`franchise` 필터 보류 ([§8.2](08-api-and-ics.md#82-공개-api-예시))
- [x] 공개 API 보호·핵심 로직 테스트 — IP당 분당 600회 요청 제한, JSON·ICS 캐시 헤더, ICS·캘린더 일정 변환·행사 필터·요청 제한·캐시 검증
- [x] ICS 전체·온라인·국가별·필터 피드 — 한국·일본 타임존, 티켓 알림·장소·일정 제목 반영 ([§8.6](08-api-and-ics.md#86-ics-및-캘린더-설계))
- [x] Backstage·API 초기 배포 — Cloudflare Workers / Fly.io 도쿄, 자동 배포 연결, 임시 도메인 테스트 중
- [ ] 정식 도메인 구매·연결 — 정식 공개 시점에 Onstage·Backstage·API 호스트 연결, 그전까지 임시 도메인으로 개발·테스트 ([§10.1.2](10-infra-ops-security.md#1012-배포-구조-예시))
- [ ] 정식 공개 시 Fly API 머신 2대로 전환 — 도쿄 리전, 무중단 배포·장애 대비; 수집 Worker는 별도 프로세스 그룹 ([§10.1.2](10-infra-ops-security.md#1012-배포-구조-예시))
- [x] 테스트 행사 20개 이상 등록 — 9개 시리즈·22개 행사, 공식 확인 13건·간접 확인 9건; 기계번역 콘텐츠 검수 필요
- [ ] Subculture Onstage 행사 상세 웹페이지 — 기본 기능 구현·임시 배포 후 보완 중. Phase 1 범위는 [§2.2.1](02-users-and-scope.md#221-core-mvp-기능-phase-1) 참고
  - [x] 메인 페이지·행사 목록 분리, 검색·필터, 상세·ICS 구독 링크
  - [x] ko/ja/en, 언어·화면 모드 설정, 행사 요약·다음 일정 카드
  - [x] 국기 SVG·선 아이콘, 타임존 표기, 장소·주최·주소 현지화
  - [x] 태그 그룹별 필터 — 그룹 안은 OR, 그룹 사이는 AND, 하위 태그 포함; API·ICS에 동일 적용
  - [x] 검색엔진·링크 미리보기 기반 — 제목·설명·Open Graph·행사 JSON-LD·sitemap·robots, 검색·필터 목록은 `noindex`
  - [ ] 링크 미리보기 이미지(`og:image`) — 디자인 확정 후 추가
  - [ ] 사용 중 발견되는 UI·UX 보완 — 1차 정리 완료, 후속 수정 계속
  - [ ] 티켓 판매 구조 점검·확장 — DB·공개 API·상세 표시·초기 데이터·Backstage 입력 UI 구현 완료. Onstage 리디자인 뒤 필수·선택·불필요 정보를 구분하여 API·수집·보관 방식과 구조 재검토 ([DB 설계](04-database-design.md))
  - [ ] 행사장 부스 찾기 연결 — 해시태그·공식 배치도·서클 목록·외부 지도 링크 검토 중, 착수 시점 미정 ([§2.2.4](02-users-and-scope.md#224-후기-확장-기능))

### Phase 2 — 수집 및 검수

- [ ] 행사 관리자 로그인·인증 설계 — SSO·소셜 연동·증명 자료 심사와 권한 범위 확정 ([§7.6.3](07-admin-dashboard.md#763-권한-부여-절차))
- [ ] 행사 관리자 계정 도입 — 대표·하위 권한 부여와 Change Proposal 제안 제출 ([§7.6.3](07-admin-dashboard.md#763-권한-부여-절차))
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

- [ ] API Key·개발자 콘솔 — 상향 Rate Limit·Webhook 등 심화 기능 ([§8.5](08-api-and-ics.md#85-openapi-공개-전략))
- [ ] 개인 구독·개인 ICS — 표시 방식·대상·알림을 계정별 저장, 구독 주소 유지 ([§8.6.5](08-api-and-ics.md#865-피드-품질))
- [ ] 내 행사 기록·연간 리캡 — 등록 행사·사용량 확인 후 착수 ([§2.2.4](02-users-and-scope.md#224-후기-확장-기능))
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

결정 과정과 구현 근거는 [Phase 0 작업 로그](../devlog/phase-0-planning-and-design.md)를 참고한다.

- [x] 플랫폼·서비스 명칭 확정: SCLS / Onstage / Backstage / SCLS API
- [x] 행사와 일정 분리
- [x] 수집·분석·검수 계층 구분
- [x] 다국어 번역 구조 정의
- [x] 번역 수정 요청·용어집 제안 방향 정의
- [x] PostgreSQL + Object Storage 방향 확정
- [x] 프로젝트명 확정: Subculture Link Stage (SCLS)
- [x] 계획 문서 주제별 분리 ([목차](README.md))
- [x] OpenAPI 공개 단계 확정 — Phase 2 착수 / Phase 3 공개 ([§8.5](08-api-and-ics.md#85-openapi-공개-전략))
- [x] 운영 형태 방향 정리 — 무료·후원 기본, 유료화·광고는 검토 중 ([§1.6.2](01-overview-and-principles.md#162-운영-형태))
- [x] 프로젝트·설계·Onstage 공개 및 내부 구현 비공개 범위 확정 ([§1.6.3](01-overview-and-principles.md#163-소스-공개-및-참여-정책))
- [x] 개발·운영 참여 방식 확정 — 메인 개발자 문의
- [ ] 초기 분류 코드 잔여 항목 확정 — 티켓 방식 등 세부 분류
- [x] 관리자 인증 3단계 구조 확정 ([§7.6](07-admin-dashboard.md#76-인증-및-권한-구조))
- [x] 공개 Repository + 비공개 Monorepo 구조 확정 ([§3.2.1](03-architecture-and-domain.md#321-repository-구조-확정))
- [x] 도메인별 ERD·전체 참고 DDL 확정 ([ERD](database/erd.md), [DDL](database/schema.sql))
- [x] 초기 DB 제공자 Supabase 확정 ([§10.1.1](10-infra-ops-security.md#1011-권장-기술-스택))
- [x] 행사 관리자 권한 부여 기본 절차 확정 ([§7.6.3](07-admin-dashboard.md#763-권한-부여-절차))
- [x] 행사 관리자 계정 도입을 Phase 2에 배치 ([§2.1.3](02-users-and-scope.md#213-행사-측-담당자-행사-관리자))
- [x] Backstage UI ko/en/ja 지원 — 행사 콘텐츠 번역과 별도 ([§7.7](07-admin-dashboard.md#77-관리자-ui-다국어-지원))
- [ ] 비용 상한·트리거 확정

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
