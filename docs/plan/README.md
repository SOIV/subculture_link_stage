# Subculture Link Stage (SCLS) — 개발 계획 문서

> 서브컬처 및 게임 관련 공식 행사 정보를 수집·검수·번역하여 웹, API, ICS 및 외부 서비스에 제공하는 다국어 행사 정보 플랫폼 개발 계획서

이 폴더는 기존 단일 문서였던 `Subculture_Link_Stage_개발_계획서_v3.md`(현재 [docs/legacy/](../legacy/)에 보관)를 주제별로 분리하고, 이후 논의에서 나온 세부 사항을 보강한 버전이다.

## 목차

1. [개요 및 핵심 원칙](01-overview-and-principles.md) — 명칭, v2 대비 변경 사항, 목적, 서비스 성격, 핵심 원칙, 최종 목표
2. [목표 사용자 및 기능 범위](02-users-and-scope.md) — 사용자·사용 사례, Phase별 기능 범위, 초기 대상 범위
3. [시스템 구조 및 도메인 모델](03-architecture-and-domain.md) — 전체 아키텍처, 서비스 컴포넌트, Event/Series/Schedule 모델, 데이터 계층
4. [데이터베이스 설계](04-database-design.md) — DB 선택, 테이블 그룹, 핵심 테이블 스키마, 태그 구조, [ERD·전체 DDL](database/erd.md)
5. [오브젝트 스토리지 및 수집 파이프라인](05-storage-and-collection.md) — 스토리지 설계, 수집 소스·규칙, 분석 파이프라인
6. [다국어, 번역, 용어집](06-i18n-translation-glossary.md) — 번역 설계, 용어집 구조, 사용자 번역 수정/용어 제안
7. [관리자 대시보드](07-admin-dashboard.md) — Subculture Backstage 기능, 3단계 인증·권한 구조(루트 관리자 / 행사 관리자 대표 / 하위 계정)
8. [SCLS API 및 ICS 설계](08-api-and-ics.md) — 공개 API, OpenAPI 공개 전략, ICS/캘린더 설계
9. [검색 및 알림](09-search-and-notifications.md) — 전문 검색, 유사도 검색, 알림 설계
10. [인프라, 데이터 보관, 보안, 운영](10-infra-ops-security.md) — 기술 스택, 보관 정책, 보안·권한, 운영 모니터링
11. [개발 단계 및 성공 기준](11-roadmap-and-success.md) — Phase 0~6 로드맵, 성공 기준, 구현 체크리스트

## 문서 이력

| 버전 | 형태 | 비고 |
|---|---|---|
| v1~v2 | 단일 문서 (`subculture_event_calendar_api_개발_계획서*.md`) | 프로젝트 개명 전, [docs/legacy/](../legacy/) 보관 |
| v3 | 단일 문서 (`Subculture_Link_Stage_개발_계획서_v3.md`) | SCLS 명칭 확정 버전, [docs/legacy/](../legacy/) 보관 |
| v4 (현재) | 주제별 분리 문서 (본 폴더) | 파일 분리 + 세부 보강, 구현 착수 준비 단계 |

## 이번 분리 작업에서 추가/보강된 내용

- **운영 형태 및 공개 정책** ([01-overview-and-principles.md §1.6](01-overview-and-principles.md#16-운영-형태-및-공개-정책)) — 시장 차별점(해외 포함 통합 정보 + ICS 피드는 사실상 공백 상태), 무료+부분유료화(F2P·유료화 상품은 후반 설계, 그 전까지는 후원 기반), API·Worker 비공개 / Onstage 프론트엔드만 오픈소스 공개, 문의 채널(`biz@soiv-studio.xyz`)을 통한 개발·운영 참여 방식을 명시.
- **OpenAPI 공개 전략** ([08-api-and-ics.md](08-api-and-ics.md)) — 원래 후기 확장(Phase 6)이었던 공개 API 문서화를 Phase 2(개발 착수)/Phase 3(전체 공개)로 앞당김. 이미 개인 개발자들이 흩어져서 앱을 만들어 쓰고 있는 상황이라, 공개 API가 초기 사용자 확보 포인트가 될 수 있다는 판단에 따른 것. OpenAPI 스펙 공개는 소스코드 오픈소스화와는 다르다는 점도 함께 명시.
- **SNS 수집 ToS 리스크** ([05-storage-and-collection.md](05-storage-and-collection.md)) — X/Instagram 자동 수집의 API 접근성·약관 제약을 리스크로 명시.
- **관리자 인증 방식 미결 표시** ([07-admin-dashboard.md](07-admin-dashboard.md)) — 세션/JWT/외부 Auth 중 미정임을 명시. (→ 이후 별도 논의에서 3단계 인증·권한 구조로 확정, [07-admin-dashboard.md §7.6](07-admin-dashboard.md#76-인증-및-권한-구조) 참고)
- **비용 상한 미결 표시** ([10-infra-ops-security.md](10-infra-ops-security.md)) — 구체적 예산 트리거는 운영 데이터가 쌓인 뒤 정하기로 함.
- **ERD 미결 표시** ([04-database-design.md](04-database-design.md)) — 테이블 그룹/예시는 정리되었으나 다이어그램화는 구현 착수 직전 별도 작업으로 남김. (→ 이후 확정, [database/erd.md](database/erd.md)·[database/schema.sql](database/schema.sql) 참고)

## v4 분리 이후 추가로 확정된 사항

- **Repository 구조 확정** ([03-architecture-and-domain.md §3.2.1](03-architecture-and-domain.md#321-repository-구조-확정)) — 2-Repo 구조로 결정: `scls-onstage`(공개 웹)만 별도 공개 저장소로 분리하고, `scls-api`·`scls-backstage`·`scls-worker`·`scls-scheduler`는 `scls-platform` 비공개 Monorepo로 묶어 DB 스키마·도메인 타입을 공유 패키지로 직접 공유한다. AI 페어 프로그래밍(Claude Code/Codex) 환경에서 서비스 간 공유 타입을 사설 패키지로 나누어 관리하는 비용이 실이익보다 크다는 판단이 근거.
- **ERD 확정** ([database/erd.md](database/erd.md), [database/schema.sql](database/schema.sql)) — 약 50개 테이블의 관계를 도메인별 6개 다이어그램으로 정리하고, 전체 컬럼·제약조건을 담은 참고용 DDL을 작성. 기존 문서에 "또는"으로 열려 있던 태그 현지화 방식, `change_proposals` 제출 주체 표현, 다형 참조 허용 범위 등도 함께 확정.

## 진행 방식 메모

초반에는 1인 개발로 진행하며, 이후 데이터 라벨링 등 일부 실습성 작업에 관심 있는 사람을 참여시킬 계획이다. ERD·Repository 구조·관리자 인증 방식은 확정되었고, 남은 세부 사항(행사 관리자 권한 부여 절차, 비용 상한 등)은 메인 구현 작업 착수 전 또는 실제 운영 데이터가 쌓인 뒤 순차적으로 채워 넣는다.
