[← 목차](README.md)

# 03. 전체 시스템 구조 및 핵심 도메인 모델

## 3.1 전체 시스템 구조

```text
[공식 웹 / 공식 SNS / 예매처 / RSS / 수동 제보]
                         ↓
                  [Collector Workers]
                         ↓
              [원본 문서 및 스냅샷 저장]
             PostgreSQL + Object Storage
                         ↓
                [Analysis Pipeline]
       언어 감지 / 중복 검사 / 엔티티 추출
       기존 행사 매칭 / 분류 / 변경점 비교
                         ↓
                  [Change Proposal]
                         ↓
                 [관리자 검수]
                         ↓
                    [공개 DB]
       행사 / 일정 / 태그 / 장소 / 작품 / 번역
                         ↓
        ┌────────────┬────────────┬────────────┐
      [REST API]    [ICS Feed]   [Web App]   [Notification]
        ↓                                         ↓
[Discord Bot / 개인 앱]                 [Discord / Webhook / Web Push 등]
```

## 3.2 서비스 컴포넌트

```text
scls-api
- 공개 API
- 관리자 API
- 인증 및 권한
- ICS 생성

scls-onstage
- Subculture Onstage 공개 웹
- 행사 검색 및 상세
- 사용자 제보·수정 요청

scls-backstage
- Subculture Backstage 관리자 웹
- 수집 후보 검수
- 행사·일정·번역·용어집·소스 관리
- 운영 상태 및 작업 로그 확인

scls-worker
- 웹/SNS 수집
- 문서 분석
- 번역
- 알림 생성
- 파일 처리

scls-scheduler
- 정기 수집 스케줄
- 링크 상태 검사
- 오래된 번역 검사
- 보관 정책 실행
```

배포 단위는 API, Web, Worker를 분리한다.

### 3.2.1 Repository 구조 (확정)

**공식 공개 Repository + 비공개 Monorepo의 2-Repository 구조**를 사용한다. 아래는 저장소별 관리 범위이며, 예정 항목이 모두 구현되었다는 의미는 아니다.

```text
Subculture_Link_Stage   (공식 공개 Repository — 현재 이 저장소)
├─ docs/               (프로젝트·개발/설계 문서, ERD·참고 DDL, Roadmap, Legacy)
├─ apps/onstage         (Subculture Onstage — SvelteKit, 착수, 임시 도메인으로 초기 배포)
└─ [예정] OpenAPI/API 개발자 문서 (경로·배포 방식 미정)

scls-platform          (비공개, 단일 Monorepo — pnpm workspaces 등)
├─ apps/api            (scls-api)
├─ apps/backstage       (scls-backstage)
├─ apps/worker          (scls-worker)
├─ apps/scheduler       (scls-scheduler)
└─ packages/
   ├─ db                (실제 Prisma ORM schema 및 migration — 공개 DDL은 설계 참고용)
   ├─ domain            (Event/Schedule/Tag 등 공유 타입·enum)
   └─ config            (공통 설정)
```

**구현 기준**

- Onstage는 공개 REST API만 소비하고 Private DB 스키마·패키지에 직접 결합하지 않는다. `scls-onstage`는 서비스 식별자이며 별도 공개 Repository 이름이 아니다.
- 비공개 API·Backstage·Worker·Scheduler는 `packages/db`·`packages/domain`으로 스키마·도메인 타입을 공유한다.
- Backstage는 React + Vite + TanStack Router/Query + Tailwind v4를 사용하는 SPA다. 개발에서는 Vite가 `/admin`을 API로 프록시하고, 프로덕션도 Backstage 호스트의 `/admin/*` 프록시를 쓴다 ([§10.1.2](10-infra-ops-security.md#1012-배포-구조-예시)).
- Onstage는 이 공개 Repository의 `apps/onstage`에서 Svelte/SvelteKit으로 개발한다.

저장소 분리 이유와 2026-09-03 프레임워크 선택 과정은 [설계 기록](../devlog/phase-0-planning-and-design.md)에 보관한다.

## 3.3 Event Series와 Event 구분

`Event Series`는 반복되는 행사 브랜드 또는 시리즈다.

- Tokyo Game Show
- AnimeJapan
- Comic Market
- AGF Korea
- BanG Dream! LIVE

`Event`는 실제 특정 회차다.

- Tokyo Game Show 2026
- Comic Market 108
- BanG Dream! 13th☆LIVE

## 3.4 Event와 Event Schedule 구분

행사 하나에는 여러 개의 일정이 존재할 수 있다.

```text
행사 본편
- 공연 또는 행사 개최 기간

관련 일정
- 선행 추첨 접수 시작
- 선행 추첨 접수 마감
- 당첨 발표
- 일반 판매 시작
- 스트리밍 티켓 판매
- 온라인 방송 시작
- 아카이브 시청 종료
- 굿즈 사전 판매
```

`schedule_type` 예시:

```text
EVENT_START
EVENT_END
TICKET_OPEN
TICKET_CLOSE
LOTTERY_OPEN
LOTTERY_CLOSE
LOTTERY_RESULT
REGISTRATION_OPEN
REGISTRATION_CLOSE
STREAM_START
STREAM_END
ARCHIVE_END
MERCH_OPEN
MERCH_CLOSE
ANNOUNCEMENT
```

## 3.5 데이터 계층

```text
수집 계층
- sources
- collected_documents
- source_snapshots
- storage_objects

분석 계층
- document_analyses
- extracted_entities
- event_matches
- classification_results

검수 계층
- review_tasks
- review_decisions
- change_proposals

서비스 계층
- event_series
- events
- event_schedules
- venues
- organizers
- franchises
- participants
- tags
- localizations
```

분석 결과는 공개 DB에 직접 반영하지 않고 `change_proposals`를 거쳐 승인 후 반영한다. 각 계층의 테이블 상세 스키마는 [04-database-design.md](04-database-design.md) 참고.

---

[← 목차](README.md) · 이전: [02. 목표 사용자 및 기능 범위](02-users-and-scope.md) · 다음: [04. 데이터베이스 설계](04-database-design.md)
