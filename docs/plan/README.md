# Subculture Link Stage (SCLS) — 개발 계획 문서

> 서브컬처 및 게임 관련 공식 행사 정보를 수집·검수·번역하여 웹, API, ICS 및 외부 서비스에 제공하는 다국어 행사 정보 플랫폼 개발 계획서

이 폴더는 기존 단일 문서였던 `Subculture_Link_Stage_개발_계획서_v3.md`(현재 [docs/legacy/](../legacy/)에 보관)를 주제별로 분리하고, 이후 논의에서 나온 세부 사항을 보강한 버전이다.

> [!NOTE]
> 본 문서는 SCLS의 설계 및 개발 방향을 기록하며 구현 진행에 따라 갱신하는 living document입니다.
> 현재 Private `scls-platform`에서 Phase 1 Core MVP 구현을 진행 중이며, API·Backstage 일부 기능과 공개 GET API·ICS 피드가 구현되었고 Backstage·API는 임시 도메인으로 초기 배포해 테스트 중입니다. Subculture Onstage는 이 공개 Repository의 `apps/onstage`에서 착수해 메인 페이지·행사 목록·상세를 구현했고 Cloudflare Workers에 임시 도메인으로 초기 배포해 테스트 중입니다(정식 도메인은 미정).
> 일부 항목은 계획/참고 설계로, 실제 내부·운영 구현과 차이가 있을 수 있습니다. 현재 구현 범위는 [로드맵](11-roadmap-and-success.md)을 기준으로 확인합니다.
> [ERD](database/erd.md)와 [schema.sql](database/schema.sql)은 설계 및 참고용 DDL이며, Private Repository의 실제 ORM schema/migration과 항상 1:1로 동일함을 보장하지 않습니다.

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

상세 작업 내역은 [작업 로그](../devlog/README.md)에 별도로 기록한다. 로드맵은 현재 상태와 남은 작업을 관리하고, 작업 로그는 변경 내용·구현 근거·확인 결과를 보관한다.

## 문서 관리

| 문서 | 관리할 내용 |
|---|---|
| [기획 문서](#목차) | 현재 설계·기능 범위·운영 절차 |
| [로드맵](11-roadmap-and-success.md) | Phase별 현재 상태·남은 작업·성공 기준 |
| [작업 로그](../devlog/README.md) | 구현·설계 결정·검토 과정과 당시 확인 결과 |
| [Legacy](../legacy/) | v1~v3 단일 계획서 원본 |

문서 분리·설계 보강 과정은 [Phase 0 기록](../devlog/phase-0-planning-and-design.md)에 보관한다. 새 작업 기록은 작업 로그의 월별 작성 방식을 따른다.

## 진행 방식 메모

초반에는 1인 개발로 진행하며, 이후 데이터 라벨링 등 일부 실습성 작업에 관심 있는 사람을 참여시킬 계획이다. ERD·Repository 구조·관리자 인증 방식과 행사 관리자 권한 부여 절차는 확정되었다. Private `scls-platform`에서 초기 구현을 진행하며, 남은 세부 사항(초기 데이터 분류, 비용 상한 등)은 구현과 병행하거나 실제 운영 데이터가 쌓인 뒤 순차적으로 채워 넣는다.
