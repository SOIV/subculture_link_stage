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

배포 단위는 API, Web, Worker를 분리한다. 저장소 구성은 소스 공개 범위에 따라 결정된다: `scls-onstage`(공개 웹)만 오픈소스로 공개하고 `scls-api`·`scls-backstage`·`scls-worker`·`scls-scheduler`는 비공개로 유지하므로, 하나의 Monorepo로 묶기보다 `scls-onstage`를 별도 공개 저장소로 분리하는 쪽이 공개 범위를 관리하기 쉽다. 자세한 배경은 [01-overview-and-principles.md §1.6.3](01-overview-and-principles.md#163-소스-공개-및-참여-정책) 참고.

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
