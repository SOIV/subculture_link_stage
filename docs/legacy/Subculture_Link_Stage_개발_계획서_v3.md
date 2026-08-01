# Subculture Link Stage (SCLS)

> 서브컬처 및 게임 관련 공식 행사 정보를 수집·검수·번역하여 웹, API, ICS 및 외부 서비스에 제공하는 다국어 행사 정보 플랫폼 개발 계획서

---

## 0. 문서 정보

- 문서 버전: `3.0`
- 기준일: `2026-08-02`
- 이전 문서: `Subculture / Game Event Calendar API v2.0`
- 프로젝트 상태: 기획 개편 / 구현 전
- 기준 문서: v2의 목적·핵심 원칙·API/ICS 구조를 유지하고, 이후 논의된 확장 기능을 반영

### 0.1 프로젝트 명칭

| 구분 | 공식 명칭 | 용도 |
|---|---|---|
| 전체 프로젝트·플랫폼 | **Subculture Link Stage** | 플랫폼 전체를 지칭하는 공식 명칭 |
| 프로젝트 약칭 | **SCLS** | 저장소, API, 기술 문서 및 내부 식별자에 사용하는 약칭 |
| 사용자 공개 서비스 | **Subculture Onstage** | 행사 검색, 상세 정보, 캘린더, 알림 및 사용자 제안 기능 |
| 관리자·운영 서비스 | **Subculture Backstage** | 수집 후보 검수, 행사·번역·용어집·소스 및 운영 상태 관리 |
| API | **SCLS API** | Onstage, ICS, 디스코드 봇, 개인 앱 및 기타 외부 서비스에 데이터 제공 |

명칭 사용 원칙:

- 문서에서 전체 플랫폼을 처음 언급할 때는 `Subculture Link Stage (SCLS)`로 표기하고, 이후에는 `SCLS`를 사용할 수 있다.
- 사용자에게 공개되는 웹 서비스는 `Subculture Onstage`로 표기한다.
- 관리자 및 운영자 전용 서비스는 `Subculture Backstage`로 표기한다.
- 공개·관리 API를 통칭할 때는 `SCLS API`로 표기한다.
- 디스코드 봇은 SCLS API를 활용할 수 있는 외부 소비 채널 중 하나이며, SCLS에 소속된 필수 구성요소로 간주하지 않는다.

### 0.2 v2에서 변경된 핵심 사항

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

---

## 1. 프로젝트 개요

### 1.1 목적

- 한국·일본 및 온라인에서 진행되는 서브컬처·게임 관련 **공식 행사와 관련 일정**을 한곳에서 관리
- 공식 웹사이트, 공식 SNS, 주최사 공지, 예매처 등 분산된 정보를 지속적으로 수집
- 수집 자료를 분석하여 신규 행사, 일정 변경, 예매 시작, 스트리밍, 취소·연기 등의 후보 데이터 생성
- 관리자 검수 후 신뢰 가능한 기준 데이터로 확정
- 공식 제공 언어가 부족한 경우 한국어·일본어·영어로 번역하여 제공
- Google Calendar, Apple Calendar, Outlook 등에서 사용할 수 있는 ICS 피드 제공
- 웹사이트, Discord Bot, 개인 프로젝트, 외부 서비스에서 재사용 가능한 API 제공
- 장기적으로 서브컬처 행사 정보의 **공통 데이터 소스** 역할 수행

### 1.2 서비스 성격

Subculture Link Stage(SCLS)는 v2에서 정의한 공식 행사 일정 기준 데이터 소스를 확장한 독립형 행사 정보 서비스다. 특정 봇이나 다른 프로젝트에 소속되지 않으며, API와 ICS를 통해 여러 외부 서비스에서 재사용할 수 있도록 설계한다.

```text
[Subculture Link Stage (SCLS)]
├─ 행사 데이터베이스
├─ 수집 및 분석 Worker
├─ 번역 및 용어집 Worker
├─ Subculture Backstage
├─ 사용자 제보·수정 요청
├─ SCLS API
├─ Subculture Onstage
└─ ICS 피드
          ↓
[웹사이트 / 디스코드 봇 / 개인 앱 / 기타 외부 서비스]
```

디스코드 봇은 본 서비스가 제공하는 API를 활용할 수 있는 여러 소비 채널 중 하나다. 크롤링, 원문 저장, 번역, 분류, 유사도 검색과 행사 기준 데이터 관리는 본 서비스 내부에서 수행한다.

### 1.3 핵심 원칙

- 공식 출처 또는 공식 출처로 확인 가능한 정보만 공개 데이터로 등록
- 수집 원본과 사용자 공개 데이터를 분리
- 자동화는 단계적으로 확대하고 초기에는 관리자 검수를 필수로 적용
- 원문은 번역문으로 덮어쓰지 않음
- 공식 번역과 서비스 자체 번역을 구분
- 날짜, 시간, 가격, URL 등 구조화 데이터는 언어별로 중복 저장하지 않음
- 행사 변경·취소 기록을 삭제하지 않고 이력으로 보존
- 외부 서비스는 공개 API를 통해 느슨하게 결합
- 파일과 대용량 원본은 DB에 직접 저장하지 않고 오브젝트 스토리지 사용
- 초기 비용은 최소화하되 완전 무료 운영을 절대 조건으로 두지 않음

---

## 2. 목표 사용자 및 사용 사례

### 2.1 일반 사용자

- 관심 있는 행사 검색
- 국가, 작품, 행사 유형, 온라인 여부 등으로 필터링
- 한국어·일본어·영어 중 원하는 언어로 행사 정보 확인
- Google Calendar 또는 ICS 캘린더 구독
- 예매 시작, 추첨 마감, 공연 시작, 스트리밍 종료 알림 수신
- 잘못된 번역 또는 행사 정보 수정 요청
- 작품명·인명·티켓 용어 등 용어집 등록 제안

### 2.2 관리자 및 검수자

- 자동 수집 후보 검토
- 신규 행사 및 일정 승인
- 기존 행사 변경 제안 비교
- 취소·연기·출연자 변경 등 긴급 변경 처리
- 자동 번역 검수
- 사용자 번역 수정 요청 처리
- 용어집 제안 승인·병합·거절
- 수집 소스 및 행사 시리즈 관리

### 2.3 외부 서비스 개발자

- REST API 또는 향후 GraphQL API를 통한 행사 검색
- ICS 피드 사용
- Discord Bot, 웹 위젯, 개인 앱 등에서 행사 데이터 활용
- 변경 이벤트 또는 알림용 Webhook/Feed 연동(후기 단계)

---

## 3. 기능 범위 정의

### 3.1 Core MVP 기능 (Phase 1)

행사 데이터를 수동으로 등록·관리하고 API/ICS로 외부에 제공하는 최소 단위. 수집·번역 자동화는 포함하지 않는다.

- 관리자 로그인
- 행사 시리즈 등록·관리
- 행사·일정 수동 등록·수정
- 장소, 주최사, 태그 관리
- 행사, 일정, 장소, 태그 관계형 DB 구축
- 한국어·일본어·영어 현지화 테이블(수동 입력 기준, 자동 번역 제외)
- 공개 읽기 API
- 전체 ICS 피드
- 행사 상세 웹페이지

### 3.2 수집 및 번역 확장 기능 (Phase 2~3)

Core MVP가 실제로 사용된 이후 순차적으로 확장하는 자동화 범위.

- 수집 소스 및 수집 규칙 등록
- 공식 웹사이트 1~2개 자동 수집
- 수집 문서 원본 저장 및 해시 중복 검사
- 신규 후보 및 변경 후보 생성(Change Proposal)
- 관리자 승인·거절·보정
- 원문 스냅샷 및 변경 비교
- 자동 번역 생성 및 자동 번역 표시
- 번역 출처·상태 구분, 원문 리비전 기반 OUTDATED 처리
- 기본 용어집 적용
- 국가·카테고리별 ICS 피드

### 3.3 초기 확장 기능 (Phase 4~5)

- 공식 SNS API 또는 허용 가능한 피드 연동
- 예매처·스트리밍 플랫폼 수집
- 사용자 행사 제보
- 사용자 번역 수정 요청
- 사용자 용어집 제안
- Discord Bot API 연동
- 태그 및 작품/IP 검색
- 수집·분석·번역 작업 큐
- 오브젝트 스토리지에 HTML, JSON, 포스터 보관
- 관리자 검수 통계 및 오류 유형 집계

### 3.4 후기 확장 기능

- 사용자 계정 및 개인 구독
- 관심 작품·행사 시리즈·출연자별 알림
- 사용자별 ICS 피드
- 고신뢰 출처 자동 승인
- 다국어 전문 검색
- 임베딩 기반 유사 문서 검색
- 변경 Webhook 또는 SSE 제공
- API Key 및 외부 개발자 콘솔
- 신뢰 기여자·번역 검수자 권한
- 공개 기여 이력 및 기여자 프로필

### 3.5 초기 제외 또는 제한 기능

- SNS 전체 이미지·영상 무제한 보관
- 비공식 루머 및 출처 불명 행사 등록
- 사용자 수정 내용의 즉시 공개 반영
- 투표만으로 번역 또는 공식 데이터를 확정하는 기능
- 초기부터 모든 행사·지역·플랫폼을 포괄하는 대규모 수집
- 처음부터 자체 번역 모델을 학습하는 작업

---

## 4. 전체 시스템 구조

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

### 4.1 서비스 컴포넌트

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

저장소는 Monorepo 또는 분리 Repository 모두 가능하나, 배포 단위는 API, Web, Worker를 분리한다.

---

## 5. 핵심 도메인 모델

### 5.1 Event Series와 Event 구분

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

### 5.2 Event와 Event Schedule 구분

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

### 5.3 데이터 계층

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

분석 결과는 공개 DB에 직접 반영하지 않고 `change_proposals`를 거쳐 승인 후 반영한다.

---

## 6. 데이터베이스 설계

### 6.1 DB 선택

기본 DB는 PostgreSQL을 사용한다.

선택 이유:

- 행사, 일정, 태그, 작품, 인물, 장소 간 다대다 관계 처리
- 외래키와 트랜잭션을 통한 데이터 무결성
- JSONB를 통한 비정형 원본 메타데이터 저장
- 전문 검색 및 pgvector 확장 가능
- 변경 이력과 검수 워크플로우 구현에 적합

### 6.2 주요 테이블 그룹

#### 행사 및 일정

```text
event_series
events
event_schedules
event_status_history
event_urls
event_schedule_urls
```

#### 조직, 장소, 작품, 인물

```text
organizers
venues
franchises
participants
event_organizers
event_franchises
event_participants
```

#### 태그 및 분류

```text
tag_groups
tags
event_tags
event_schedule_tags
event_series_tags
franchise_tags
participant_tags
venue_tags
```

대상별 연결 테이블을 사용한다. `target_type + target_id` 형태의 범용 연결 테이블은 외래키 무결성 문제 때문에 기본안으로 사용하지 않는다.

#### 수집 및 분석

```text
sources
source_rules
collection_jobs
collected_documents
source_snapshots
document_analyses
extracted_entities
classification_results
event_matches
```

#### 검수 및 변경

```text
review_tasks
review_decisions
change_proposals
change_proposal_fields
```

#### 다국어 및 번역

```text
entity_localizations
document_translations
translation_jobs
translation_revisions
translation_correction_requests
glossary_terms
glossary_translations
glossary_suggestions
```

#### 사용자 및 알림

```text
users
user_subscriptions
notification_templates
notification_jobs
notification_deliveries
```

#### 파일 및 스토리지

```text
storage_objects
storage_links
```

### 6.3 핵심 테이블 예시

#### events

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  event_series_id UUID REFERENCES event_series(id),
  canonical_slug TEXT UNIQUE NOT NULL,
  primary_locale TEXT NOT NULL,
  status TEXT NOT NULL,
  country_code CHAR(2),
  venue_id UUID REFERENCES venues(id),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_all_day BOOLEAN DEFAULT FALSE,
  official_url TEXT NOT NULL,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### event_schedules

```sql
CREATE TABLE event_schedules (
  id UUID PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  timezone TEXT NOT NULL,
  is_all_day BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL,
  source_document_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### entity_localizations

```sql
CREATE TABLE entity_localizations (
  id UUID PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  locale TEXT NOT NULL,
  title TEXT,
  summary TEXT,
  description TEXT,
  translation_source TEXT NOT NULL,
  translation_status TEXT NOT NULL,
  source_locale TEXT,
  source_revision INTEGER,
  translated_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  UNIQUE(entity_type, entity_id, locale)
);
```

`entity_type + entity_id` 구조는 현지화처럼 여러 도메인에 동일 형식으로 붙는 데이터에 제한적으로 사용한다. 핵심 관계 데이터에는 대상별 연결 테이블을 사용한다.

#### collected_documents

```sql
CREATE TABLE collected_documents (
  id UUID PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES sources(id),
  original_url TEXT NOT NULL,
  external_id TEXT,
  title TEXT,
  raw_text TEXT,
  detected_locale TEXT,
  published_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content_hash TEXT NOT NULL,
  storage_object_id UUID,
  status TEXT NOT NULL,
  UNIQUE(source_id, content_hash)
);
```

### 6.4 태그 구조

태그는 평면 배열이 아니라 그룹과 계층을 가진다.

```text
행사 형식
├─ 공연
│  ├─ 단독 라이브
│  ├─ 합동 라이브
│  └─ 팬미팅
├─ 전시
├─ 팝업스토어
└─ 온라인 방송

참가 방식
├─ 오프라인
├─ 온라인
└─ 하이브리드

티켓 방식
├─ 무료
├─ 유료
├─ 선착순
└─ 추첨
```

`tags` 주요 필드:

```text
id
group_id
parent_tag_id
canonical_name
slug
description
is_active
```

태그 표시명은 `entity_localizations` 또는 전용 `tag_localizations`로 다국어 제공한다.

---

## 7. 오브젝트 스토리지 설계

### 7.1 저장 대상

- 공식 웹페이지 HTML 스냅샷
- SNS API 또는 RSS 원본 JSON/XML
- 공식 포스터 및 썸네일
- 일정표·행사장 지도 등 검수에 필요한 이미지
- 파싱 실패 원본
- 장기 보관용 압축 자료

영상 원본과 행사와 무관한 SNS 첨부파일은 기본적으로 저장하지 않는다.

### 7.2 DB와 스토리지 역할 분리

```text
PostgreSQL
- 관계
- 상태
- 검색용 텍스트
- 파일 메타데이터
- 검수 및 변경 이력

Object Storage
- HTML
- JSON/XML 원본
- 이미지
- 스냅샷
- 대용량 첨부파일
```

`storage_objects` 예시:

```text
id
provider
bucket
object_key
content_type
size_bytes
checksum
retention_policy
created_at
expires_at
```

### 7.3 스토리지 후보

- Cloudflare R2
- AWS S3
- Supabase Storage
- MinIO

초기에는 Cloudflare 사용 환경과 S3 호환성을 고려하여 R2를 우선 후보로 둔다.

---

## 8. 수집 소스 및 행사 프로필

### 8.1 행사별 수집 프로필

행사 또는 시리즈별로 공식 출처와 수집 규칙을 등록한다.

```text
AGF Korea
- 공식 홈페이지
- 공식 X
- 공식 Instagram
- 예매처
- 주최사 공지
- 과거 행사 페이지
```

`sources` 주요 필드:

```text
id
event_series_id
source_type
source_url
account_identifier
collection_method
check_interval
priority
is_active
terms_note
```

`source_type` 예시:

```text
OFFICIAL_SITE
OFFICIAL_NEWS
X_ACCOUNT
INSTAGRAM_ACCOUNT
YOUTUBE_CHANNEL
RSS
TICKET_PLATFORM
STREAMING_PLATFORM
MANUAL
```

### 8.2 수집 규칙

`source_rules`에는 출처별 포함·제외 규칙을 저장한다.

```text
포함 가능성이 높은 표현
- 개최 결정
- 출연자 발표
- 티켓 선행
- 일반 판매
- 온라인 스트리밍
- 아카이브 기간
- 일정 변경
- 개최 중지

제외 가능성이 높은 표현
- 단순 굿즈 배송 안내
- 일상 게시물
- 과거 행사 후기
- 리포스트 이벤트
- 관련 없는 상품 홍보
```

규칙 유형 예시:

```text
INCLUDE_KEYWORD
EXCLUDE_KEYWORD
CSS_SELECTOR
XPATH
JSON_PATH
DATE_PATTERN
URL_PATTERN
ACCOUNT_FILTER
CONTENT_TYPE_FILTER
```

### 8.3 과거 데이터 활용

과거 행사에서 승인된 공지와 거절된 공지를 보존한다.

신규 수집 문서는 다음 기준으로 비교한다.

- 승인 데이터와의 의미 유사도
- 거절 데이터와의 의미 유사도
- 행사명·장소·출연자·날짜 매칭
- 출처 신뢰도
- 과거 행사 공지 순서와 패턴
- 포함·제외 키워드

초기에는 규칙 기반 분류와 임베딩 검색을 사용하고, 충분한 정답 데이터가 쌓인 후 별도 분류 모델 학습을 검토한다.

---

## 9. 수집 및 분석 파이프라인

### 9.1 기본 흐름

```text
1. 출처 확인
2. 신규 문서 수집
3. URL·외부 ID·해시 중복 검사
4. 원문 언어 감지
5. 행사 관련성 1차 분류
6. 관련 없는 문서 제외
7. 날짜·장소·작품·출연자·티켓 정보 추출
8. 기존 행사 또는 행사 시리즈 매칭
9. 신규/수정/긴급 알림 후보 분류
10. 변경 제안 생성
11. 관리자 검수
12. 공개 DB 반영
13. 필요한 언어 번역 생성
14. API·ICS·알림 갱신
```

### 9.2 후보 처리 유형

```text
CREATE_EVENT
ADD_SCHEDULE
UPDATE_EVENT
UPDATE_SCHEDULE
CANCEL_EVENT
POSTPONE_EVENT
PARTICIPANT_CHANGE
VENUE_CHANGE
CREATE_ALERT_ONLY
REFERENCE_ONLY
REJECT
```

### 9.3 자동화 단계

#### 1단계

- 자동 수집
- 자동 후보 분류
- 모든 등록·수정은 관리자 승인

#### 2단계

- 높은 신뢰도 후보 자동 완성
- 관리자는 비교 후 승인

#### 3단계

- 정형화된 공식 API·RSS·구조화 데이터는 자동 등록 가능
- 등록 후 관리자 알림

#### 4단계

- 충분히 검증된 출처에 한해 제한적 완전 자동화

SNS 게시물처럼 문맥 해석이 필요한 데이터는 장기간 검수 대상으로 유지한다.

### 9.4 신뢰도 예시

```json
{
  "predictedAction": "ADD_SCHEDULE",
  "predictedType": "TICKET_OPEN",
  "confidence": 0.91,
  "matchedEventId": "uuid",
  "similarApprovedItems": 8,
  "similarRejectedItems": 1,
  "requiresReview": true
}
```

신뢰도는 자동 승인 여부의 유일한 기준으로 사용하지 않는다.

---

## 10. 다국어 및 번역 설계

### 10.1 지원 언어

초기 기본 지원 언어:

- `ko-KR`
- `ja-JP`
- `en-US` 또는 공통 `en`

### 10.2 번역 대상

번역 대상:

- 행사명
- 행사 요약
- 상세 설명
- 티켓 안내
- 참가 조건
- 장소 안내
- 주의사항
- 알림 요약
- 태그 표시명

언어별로 중복 저장하지 않는 항목:

- 날짜 및 시간
- 타임존
- 국가 코드
- 좌표
- 가격과 통화
- URL
- 행사 상태
- 연결된 엔티티 ID

### 10.3 번역 출처 및 상태

`translation_source`:

```text
OFFICIAL
MACHINE
MACHINE_REVIEWED
HUMAN
COMMUNITY
```

`translation_status`:

```text
PENDING
GENERATED
REVIEW_REQUIRED
VERIFIED
OUTDATED
FAILED
```

사용자 화면에서 공식 제공 번역과 서비스 자동 번역을 구분해 표시한다.

### 10.4 번역 처리 흐름

```text
원문 언어 감지
    ↓
행사 관련성 1차 분석
    ↓
관련 자료만 분석용 번역
    ↓
행사 데이터 확정
    ↓
서비스용 한국어·일본어·영어 번역 생성
    ↓
용어집 및 고유명사 검증
    ↓
자동 검증
    ↓
공개 또는 관리자 검수
```

모든 수집 문서를 무조건 3개 언어로 번역하지 않는다. 제외될 문서는 번역하지 않고, 승인 후보 및 공개 데이터 중심으로 번역한다.

### 10.5 원문 수정과 번역 리비전

원문에는 콘텐츠 해시와 리비전을 부여한다.

번역은 생성 당시의 원문 리비전을 참조한다.

```text
원문 revision 4 → 번역 source_revision 4
원문 revision 5 생성 → 기존 번역 OUTDATED 처리
```

변경 부분만 재번역할 수 있도록 필드 또는 문단 단위 해시를 장기적으로 검토한다.

### 10.6 예상 데이터 증가

행사 텍스트가 세 언어로 확장되면 텍스트 레코드와 검색 인덱스가 크게 증가한다.

- 원문 및 공개 번역문: 약 2~3배
- 번역 상태·리비전·검수 이력: 추가 증가
- 언어별 전문 검색 인덱스: 추가 증가
- 언어별 임베딩 생성 시 추가 증가

텍스트 관련 저장 공간은 원문 단일 언어 대비 약 2.5~4배까지 증가할 수 있다. 다만 서비스 전체 스토리지에서 이미지와 원본 스냅샷 비중이 높으면 전체 용량이 동일 비율로 증가하는 것은 아니다.

---

## 11. 용어집 및 고유명사 관리

### 11.1 필요성

일반 번역 모델은 다음 항목을 일관되게 처리하기 어렵다.

- 작품의 국내 정식 명칭
- 일본 인명 독음
- 캐릭터 및 성우 이름
- 밴드·유닛명
- 공연장 공식 영문명
- 일본 티켓 및 좌석 용어
- 번역하지 않아야 하는 브랜드명

### 11.2 용어집 구조

`glossary_terms`:

```text
id
source_locale
source_text
term_type
scope_type
scope_id
do_not_translate
case_sensitive
status
created_at
```

`glossary_translations`:

```text
glossary_term_id
target_locale
preferred_text
alternative_text
is_official
source_url
```

`term_type`:

```text
FRANCHISE
CHARACTER
PERSON
GROUP
VENUE
EVENT
TICKET
STREAMING
GENERAL
```

### 11.3 적용 범위

```text
GLOBAL
COUNTRY
FRANCHISE
EVENT_SERIES
ORGANIZER
SOURCE
```

적용 우선순위:

```text
특정 출처
> 특정 행사 시리즈
> 특정 작품/IP
> 특정 국가
> 전역 용어
> 일반 번역 모델
```

### 11.4 예시

```text
バンドリ！
- ko-KR: 뱅드림!
- en: BanG Dream!

先行抽選
- ko-KR: 선행 추첨
- en: Advance lottery

MyGO!!!!!
- 번역 금지
```

---

## 12. 사용자 번역 수정 요청 및 용어 제안

### 12.1 초기 운영 방식

초기에는 사용자가 공개 번역문을 직접 수정하지 못한다.

사용자는 다음 기능을 사용할 수 있다.

- 특정 번역 문장 수정 요청
- 누락·오역 신고
- 공식 명칭 근거 제출
- 새로운 용어집 항목 제안
- 기존 제안에 동의 또는 추가 근거 작성

### 12.2 번역 수정 요청 흐름

```text
사용자 오류 발견
    ↓
현재 번역·제안 번역·수정 사유 제출
    ↓
중복 요청 확인
    ↓
관리자 또는 번역 검수자 검토
    ├─ 승인
    ├─ 일부 승인 후 보정
    ├─ 용어집 동시 반영
    └─ 거절
    ↓
새 번역 리비전 생성
```

`translation_correction_requests` 주요 필드:

```text
id
requester_id
localization_id
field_name
source_text_snapshot
current_translation_snapshot
suggested_translation
reason
evidence_url
error_type
status
reviewer_id
review_note
created_at
reviewed_at
```

`error_type`:

```text
PROPER_NOUN
CONTEXT_ERROR
TERM_INCONSISTENCY
OMISSION
OVER_TRANSLATION
DATE_OR_NUMBER
STYLE
OFFICIAL_NAME
OTHER
```

### 12.3 용어집 제안 흐름

```text
사용자 용어 제안
    ↓
기존 용어 및 중복 확인
    ↓
PENDING 저장
    ↓
관리자 검수
    ├─ APPROVED
    ├─ MERGED
    ├─ REJECTED
    └─ DEPRECATED
```

승인된 용어가 기존 번역에 영향을 주는 경우 즉시 덮어쓰지 않고 재번역 후보를 생성한다.

### 12.4 권한 단계

```text
일반 사용자
- 수정 요청 및 용어 제안

신뢰 기여자
- 다른 제안에 의견·근거 추가
- 중복 제안 정리 보조

번역 검수자
- 수정안 검수
- 용어집 승인 제안

관리자
- 최종 반영
- 전역 용어 및 정책 관리
```

사용자 투표 수는 검수 우선순위에만 활용하고 자동 확정 기준으로 사용하지 않는다.

---

## 13. 관리자 대시보드

### 13.1 수집 후보 관리

- 미검수 후보 목록
- 신뢰도순·출처순·행사순 정렬
- 원문과 자동 번역 동시 표시
- 과거 승인·거절 유사 문서 표시
- 기존 행사 데이터와 변경 제안 비교
- 원본 링크 및 저장 스냅샷 확인
- 승인·일부 승인·거절·참고 처리

### 13.2 행사 데이터 관리

- 행사 시리즈 CRUD
- 행사 및 개별 일정 CRUD
- 장소, 주최사, 작품/IP, 인물 연결
- 태그 그룹 및 태그 관리
- 공식 URL 및 출처 연결
- 상태 및 변경 이력 확인

### 13.3 수집 소스 관리

- 출처 URL 및 계정 등록
- 수집 방식 설정
- CSS Selector, XPath, JSON Path 등록
- 포함·제외 규칙 등록
- 수집 주기 및 우선순위 설정
- 마지막 성공·실패 시각 확인
- 일시중지 및 재활성화

### 13.4 번역 관리

- 언어별 번역 상태 확인
- 원문과 번역 비교
- 용어집 적용 결과 확인
- OUTDATED 번역 목록
- 번역 수정 요청 처리
- 용어집 제안 처리
- 특정 용어 변경 영향 범위 확인

### 13.5 운영 관리

- Worker Queue 상태
- 수집·분석·번역 실패 작업 재시도
- 스토리지 사용량
- API 요청량
- 알림 발송 성공·실패
- 최근 데이터 변경 감사 로그

---

## 14. SCLS API 설계

### 14.1 SCLS API 원칙

- 공개 읽기 API와 내부 관리자 API 분리
- API 버전 명시: `/v1`
- locale 파라미터 지원
- UTC 또는 ISO 8601 기준 응답
- 원문 및 번역 출처 표시
- 변경 가능한 문자열보다 안정적인 ID 제공
- 페이지네이션 및 Rate Limit 적용

### 14.2 공개 API 예시

```http
GET /v1/events
GET /v1/events/{eventId}
GET /v1/event-series
GET /v1/schedules
GET /v1/venues
GET /v1/franchises
GET /v1/tags
GET /v1/search
GET /v1/health
```

필터 예시:

```http
GET /v1/events
  ?country=JP
  &category=concert
  &tags=online,lottery
  &franchise=bang-dream
  &from=2026-09-01
  &to=2026-12-31
  &locale=ko-KR
```

### 14.3 응답 예시

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "slug": "bang-dream-13th-live",
    "status": "SCHEDULED",
    "locale": "ko-KR",
    "title": "BanG Dream! 13th☆LIVE",
    "summary": "서비스 자동 번역 요약",
    "translation": {
      "source": "MACHINE_REVIEWED",
      "status": "VERIFIED",
      "sourceLocale": "ja-JP"
    },
    "schedules": [
      {
        "type": "EVENT_START",
        "startsAt": "2026-10-10T09:00:00Z",
        "timezone": "Asia/Tokyo"
      },
      {
        "type": "ARCHIVE_END",
        "startsAt": "2026-10-17T14:59:00Z",
        "timezone": "Asia/Tokyo"
      }
    ],
    "tags": ["concert", "online-streaming"],
    "officialUrl": "https://example.com"
  }
}
```

### 14.4 디스코드 봇 연동 예시

디스코드 봇은 필요에 따라 다음 공개 API를 사용할 수 있다.

```http
GET /v1/events/upcoming
GET /v1/events/{id}
GET /v1/schedules?from=...&to=...
GET /v1/changes?since=...
```

서버별 구독 설정은 디스코드 봇 또는 별도 사용자 서비스에서 저장할 수 있으나, 행사 기준 데이터는 본 서비스에서 관리한다.

---

## 15. ICS 및 캘린더 설계

### 15.1 기본 피드

```text
/v1/calendars/all.ics
/v1/calendars/kr.ics
/v1/calendars/jp.ics
/v1/calendars/online.ics
/v1/calendars/game.ics
/v1/calendars/concert.ics
/v1/calendars/ticket.ics
```

### 15.2 필터 기반 피드

```text
/v1/calendars/custom.ics?country=JP&tags=concert&locale=ko-KR
```

개인화 피드는 사용자 인증 기능 도입 이후 제공한다.

### 15.3 일정 표현 원칙

- 행사 본편과 예매 일정을 별도 캘린더 이벤트로 생성 가능
- `schedule_type`을 제목 접두어 또는 카테고리로 표시
- 원래 타임존 보존
- 번역 언어 선택 지원
- 취소 또는 연기 시 UID 유지 및 상태 갱신
- 공식 출처 URL 포함
- 자동 번역 여부를 설명에 표시 가능

---

## 16. 검색 및 유사도 시스템

### 16.1 기본 검색

- PostgreSQL 전문 검색
- 행사명, 행사 시리즈, 작품, 인물, 장소, 태그 검색
- 한국어·일본어·영어 번역문 검색
- 이름 변형 및 별칭 검색

### 16.2 유사 문서 검색

pgvector 또는 별도 벡터 DB를 사용한다.

활용 목적:

- 신규 문서와 과거 승인 공지 비교
- 신규 문서와 과거 거절 공지 비교
- 중복 행사 탐지
- 기존 행사 자동 매칭
- 번역 수정 사례 검색

초기에는 임베딩을 모든 언어별 번역문에 생성하지 않고 원문 또는 기준 언어 중심으로 운영한다.

---

## 17. 알림 설계

### 17.1 알림 유형

```text
NEW_EVENT
TICKET_OPEN
TICKET_CLOSING
LOTTERY_OPEN
LOTTERY_CLOSING
LOTTERY_RESULT
EVENT_REMINDER
STREAM_START
ARCHIVE_CLOSING
EVENT_CANCELLED
EVENT_POSTPONED
VENUE_CHANGED
PARTICIPANT_CHANGED
```

### 17.2 알림 콘텐츠

행사 상세 번역문과 알림 문구를 완전히 중복 저장하지 않는다.

언어별 템플릿을 사용한다.

```text
[티켓 판매 시작]
{행사명}의 일반 티켓 판매가 시작되었습니다.
판매 기간: {시작일}~{종료일}
```

중요한 발송 이력은 보존하고, 일반 알림 본문은 템플릿과 행사 데이터를 통해 생성한다.

### 17.3 발송 구조

```text
공개 데이터 변경
    ↓
notification_job 생성
    ↓
구독자 및 외부 클라이언트 대상 계산
    ↓
Discord / Email / Webhook 발송
    ↓
notification_delivery 결과 저장
```

Discord Bot으로 직접 전송할지, Bot이 API를 폴링 또는 변경 Feed를 구독할지는 구현 단계에서 결정한다. 기본 방향은 Bot이 API를 소비하도록 한다.

---

## 18. 인프라 및 기술 스택

### 18.1 권장 기술 스택

| 영역 | 권장안 | 비고 |
|---|---|---|
| Backend | Node.js + TypeScript | Express, Fastify 또는 NestJS 검토 |
| Web | Next.js + React | 공개 웹과 관리자 UI 분리 가능 |
| DB | PostgreSQL | Supabase, Neon, 자체 호스팅 등 |
| ORM | Prisma 또는 Drizzle | Migration 관리 필수 |
| Queue | Redis + BullMQ | 수집·번역·알림 Worker |
| Storage | Cloudflare R2 / S3 | 원본 및 이미지 |
| Search | PostgreSQL FTS | 초기 |
| Vector | pgvector | 데이터 축적 후 도입 |
| ICS | ical-generator | Node.js 기준 |
| Monitoring | Sentry + Metrics | 초기 무료/저비용 플랜 |
| CDN/DNS | Cloudflare | 기존 환경 활용 |

### 18.2 배포 구조 예시

```text
Cloudflare
- DNS
- CDN
- R2
- WAF / Rate Limit

Web Hosting
- Cloudflare Pages 또는 Vercel

API / Worker
- Render, Railway, Fly.io, VPS 등

Database
- Supabase / Neon / Managed PostgreSQL

Queue
- Managed Redis 또는 소형 자체 Redis
```

### 18.3 무료 운영 원칙 수정

v2의 완전 무료 운영은 장기 목표와 맞지 않는다.

초기에는 무료 티어와 저비용 서비스를 활용하되 다음 비용을 고려한다.

- PostgreSQL 저장 용량
- R2/S3 저장 용량
- 수집 Worker 실행 시간
- 번역 API 또는 LLM 비용
- 임베딩 생성 비용
- Redis 및 Queue
- 외부 SNS API 비용

비용 절감을 위해 번역 전 필터링, 변경 부분만 재처리, 이미지 선별 보관, 데이터 압축 및 보관 정책을 적용한다.

---

## 19. 데이터 용량 및 보관 정책

### 19.1 용량 증가 요인

- 행사 및 개별 일정
- 관계형 태그와 연결 테이블
- 수집 문서 원문
- HTML/JSON 스냅샷
- 이미지 및 포스터
- 3개 언어 번역문
- 언어별 검색 인덱스
- 임베딩 벡터
- 분석 및 검수 이력
- 알림 발송 기록

### 19.2 보관 등급

#### 영구 보관

- 확정 행사 및 일정
- 공식 출처 URL
- 상태 및 변경 이력
- 관리자 검수 결과
- 공개 번역 리비전
- 용어집
- 원문 해시 및 핵심 메타데이터

#### 장기 보관

- 승인 근거가 된 공식 HTML/JSON 스냅샷
- 공식 포스터
- 취소·연기 공지

#### 기간제 보관

- 파싱 실패 원본
- 제외된 수집 문서 전체 원본
- 디버그 로그
- 실패한 번역 응답

#### 선별 또는 미보관

- SNS 일반 이미지 전체
- 영상 원본
- 행사와 무관한 첨부파일
- 반복된 동일 스냅샷

### 19.3 압축 및 중복 제거

- 콘텐츠 해시 기반 중복 제거
- HTML, JSON, XML 압축 저장
- 이미지 원본과 썸네일 분리
- 동일 포스터 재사용 시 Storage Object 참조 공유
- 변경 없는 페이지는 새 파일을 만들지 않고 확인 시각만 갱신

---

## 20. 보안 및 권한

### 20.1 역할

```text
ADMIN
DATA_REVIEWER
TRANSLATION_REVIEWER
TRUSTED_CONTRIBUTOR
USER
SERVICE_CLIENT
```

### 20.2 기본 정책

- 관리자 API 인증 필수
- 공개 API Rate Limit 적용
- 수집 Worker와 API의 DB 권한 분리
- 오브젝트 스토리지 비공개 Bucket 기본
- 공개 이미지에만 서명 URL 또는 CDN 경로 제공
- 모든 수정·승인 작업 감사 로그 기록
- 사용자 제안에 스팸 방지 및 신고 기능 적용

---

## 21. 개발 단계

### Phase 0 — 기획 및 기반 설계

- [x] 프로젝트명 확정: Subculture Link Stage (SCLS)
- [ ] Repository 구조 및 분리 방식 확정
- [ ] PostgreSQL ERD 작성
- [ ] 태그·행사·일정 분류 코드 정의
- [ ] 번역 상태 및 검수 상태 정의
- [ ] 초기 대상 행사 10개 선정
- [ ] 초기 수집 출처 및 이용 조건 확인

### Phase 1 — Core MVP

- [ ] PostgreSQL 및 Migration 구성
- [ ] Event Series, Event, Event Schedule 구현
- [ ] Venue, Organizer, Tag 구현
- [ ] Localizations 구현
- [ ] 관리자 로그인
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

### Phase 3 — 다국어 번역

- [ ] 언어 감지
- [ ] 한국어·일본어·영어 번역 Worker
- [ ] 번역 출처 및 상태 표시
- [ ] 원문 리비전과 OUTDATED 처리
- [ ] 용어집 기본 기능
- [ ] 공식 명칭 초기 용어 등록
- [ ] 관리자 번역 검수 UI

### Phase 4 — 커뮤니티 기여

- [ ] 사용자 로그인
- [ ] 행사 정보 수정 요청
- [ ] 번역 수정 요청
- [ ] 용어집 제안
- [ ] 중복 제안 병합
- [ ] 신뢰 기여자 및 번역 검수자 권한

### Phase 5 — 외부 연동 및 자동화

- [ ] 디스코드 봇 API 연동 예제 및 문서화
- [ ] 카테고리·작품별 ICS
- [ ] 알림 작업 생성
- [ ] Discord 알림 발송
- [ ] 임베딩 및 유사 문서 검색
- [ ] 고신뢰 출처 제한적 자동 승인

### Phase 6 — 운영 확장

- [ ] API Key 및 개발자 문서
- [ ] 사용자 개인 구독 및 개인 ICS
- [ ] Webhook 또는 변경 Feed
- [ ] 외부 수집 소스 확대
- [ ] 비용·용량 모니터링 자동화
- [ ] 백업 및 재해 복구 훈련

---

## 22. 초기 대상 범위

### 22.1 국가 및 형태

- 한국
- 일본
- 글로벌 온라인 스트리밍

### 22.2 초기 행사 유형

- 게임·애니메이션 종합 행사
- 성우·아티스트 라이브
- 팬미팅
- 온라인 유료 스트리밍
- 티켓 추첨·판매 일정

팝업스토어, 콜라보 카페, 굿즈 판매, 극장 상영은 데이터 구조가 안정된 이후 확대한다.

### 22.3 초기 행사 시리즈 후보

- Tokyo Game Show
- G-Star
- Comic Market
- AnimeJapan
- AGF Korea
- 일러스타 페스
- 서울 코믹월드
- BanG Dream! LIVE
- Project SEKAI 관련 라이브
- 주요 게임사 공식 쇼케이스

선정 기준은 수집 가능성, 공식 출처 안정성, 실제 사용 빈도다.

---

## 23. 운영 및 모니터링

### 23.1 필수 지표

- 출처별 수집 성공률
- 문서 중복률
- 후보 승인·거절 비율
- 잘못된 행사 매칭률
- 번역 실패율
- 번역 수정 요청 수
- 용어집 적용률
- API 응답 시간 및 오류율
- Worker Queue 대기량
- DB 및 스토리지 사용량
- 알림 발송 성공률

### 23.2 오류 처리

- 네트워크 오류: 지수 백오프 재시도
- 파싱 오류: 원본 보존 및 검수 작업 생성
- 번역 오류: FAILED 상태 및 재시도 가능
- 날짜 충돌: 자동 반영 금지 및 관리자 검수
- 행사 매칭 불확실: 신규 행사 후보와 기존 행사 후보를 함께 제시
- 공식 페이지 삭제: 기존 데이터 삭제 금지, 출처 상태만 변경

### 23.3 백업

- PostgreSQL 자동 백업
- 정기 복구 테스트
- 주요 스토리지 오브젝트 버전 또는 별도 백업 검토
- 용어집·검수 이력·행사 기준 데이터 우선 복구
- 단순 Worker 로그와 캐시는 복구 우선순위에서 제외

---

## 24. 성공 기준

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

---

## 25. 최종 목표

> 본 프로젝트는 v2에서 정의한 공식 행사 일정 기준 데이터 소스를 기반으로, 한국·일본·글로벌 서브컬처 및 게임 행사 정보를 공식 출처에서 수집하고 검수·번역하여 API·ICS·웹 등에서 재사용 가능한 형태로 제공하는 것을 목표로 한다.

### 핵심 가치

- 공식 출처 중심의 신뢰 가능한 행사 데이터
- 행사 본편뿐 아니라 예매·추첨·스트리밍·아카이브 일정까지 구조화
- 한국어·일본어·영어 다국어 제공
- 공식 번역과 자동 번역의 명확한 구분
- 사용자 수정 요청과 용어 제안을 통한 지속적인 번역 품질 향상
- API, ICS, 웹, Discord 등 다양한 소비 채널 지원
- 수집 원본·분석·검수·공개 데이터를 분리한 안정적인 구조
- DB와 오브젝트 스토리지를 함께 사용하는 확장 가능한 인프라

---

## 26. 구현 체크리스트

### 기획

- [x] 전체 플랫폼 및 서비스 명칭 확정: SCLS / Subculture Onstage / Subculture Backstage / SCLS API
- [x] 행사와 일정 분리
- [x] 수집·분석·검수 계층 구분
- [x] 다국어 번역 구조 정의
- [x] 번역 수정 요청 및 용어집 제안 방향 정의
- [x] PostgreSQL + Object Storage 방향 확정
- [x] 프로젝트명 확정: Subculture Link Stage (SCLS)
- [ ] ERD 확정
- [ ] 초기 데이터 분류 코드 확정

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

**마지막 수정**: 2026-08-02  
**버전**: 3.0
