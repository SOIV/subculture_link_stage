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
[Discord Bot / 개인 앱]                 [Discord / Email 등]
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

**2-Repository 구조**를 사용한다.

```text
scls-onstage          (공개, 별도 저장소)
- Subculture Onstage 프론트엔드만 포함
- SCLS API를 공개 REST 계약으로만 소비 — 내부 DB 스키마·타입을 공유하지 않음

scls-platform          (비공개, 단일 Monorepo — pnpm workspaces 등)
├─ apps/api            (scls-api)
├─ apps/backstage       (scls-backstage)
├─ apps/worker          (scls-worker)
├─ apps/scheduler       (scls-scheduler)
└─ packages/
   ├─ db                (Prisma/Drizzle 스키마 — database/schema.sql 기준)
   ├─ domain            (Event/Schedule/Tag 등 공유 타입·enum)
   └─ config            (공통 설정)
```

**결정 이유**

- `scls-onstage`(공개 웹)만 오픈소스로 공개하고 나머지는 비공개로 유지한다는 원칙([01-overview-and-principles.md §1.6.3](01-overview-and-principles.md#163-소스-공개-및-참여-정책))에 따라, Onstage는 반드시 별도 저장소여야 한다. Onstage는 공개 REST API만 소비하는 순수 프론트엔드이므로 내부 스키마 공유가 필요 없어 분리 비용이 낮다.
- `api`/`backstage`/`worker`/`scheduler` 네 서비스는 `events`/`event_schedules`/`change_proposals`/`entity_localizations` 등 핵심 도메인 모델을 그대로 공유한다([§3.5](#35-데이터-계층), [04-database-design.md](04-database-design.md)). 이를 4개의 개별 저장소로 나누면 공유 타입을 사설 패키지로 배포·버전관리해야 하는데, 1인 + AI 페어 프로그래밍(Claude Code, Codex 등) 체제에서는 이 비용이 실이익보다 크다.
- AI 코딩 에이전트는 하나의 워킹 디렉터리 컨텍스트 안에서 여러 서비스에 걸친 변경(예: DB 스키마 변경 → api/worker/backstage 동시 반영)을 한 번에 처리할 때 가장 효율적이다. 4개로 쪼개진 저장소를 오가며 각각에서 세션을 새로 여는 구조는 이런 작업에서 불필요한 마찰을 만든다.
- 따라서 공개 범위 경계(Onstage vs 나머지)에서만 저장소를 나누고, 비공개 영역은 하나의 Monorepo로 묶어 공유 패키지(`packages/db`, `packages/domain`)를 통해 타입을 직접 공유한다.

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
