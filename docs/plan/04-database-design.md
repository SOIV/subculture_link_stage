[← 목차](README.md)

# 04. 데이터베이스 설계

## 4.1 DB 선택

기본 DB는 PostgreSQL을 사용한다.

선택 이유:

- 행사, 일정, 태그, 작품, 인물, 장소 간 다대다 관계 처리
- 외래키와 트랜잭션을 통한 데이터 무결성
- JSONB를 통한 비정형 원본 메타데이터 저장
- 전문 검색 및 pgvector 확장 가능
- 변경 이력과 검수 워크플로우 구현에 적합

## 4.2 주요 테이블 그룹

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

#### 인증 및 권한

Backstage 3단계 인증 구조([07-admin-dashboard.md §7.6](07-admin-dashboard.md#76-인증-및-권한-구조), [10-infra-ops-security.md §10.3.1](10-infra-ops-security.md#1031-역할))에 대응한다. 내부 운영자(전역 역할)와 행사 측 담당자(event_id 스코프 권한)는 신뢰 수준이 달라 계정 테이블을 분리한다.

```text
staff_accounts
staff_sessions
event_organizer_accounts
event_organizer_permissions
event_organizer_invites
```

#### 사용자 및 알림

```text
users
user_subscriptions
notification_templates
notification_jobs
notification_deliveries
```

`users`는 Onstage 소셜 로그인 사용자 전용이며, 위 `staff_accounts`/`event_organizer_accounts`와는 별개 계정 체계다.

#### 파일 및 스토리지

```text
storage_objects
storage_links
```

## 4.3 핵심 테이블 예시

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

#### event_organizer_accounts

```sql
CREATE TABLE event_organizer_accounts (
  id UUID PRIMARY KEY,
  login_method TEXT NOT NULL,
  login_identifier TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(login_method, login_identifier)
);
```

`login_method`는 자유(구글 등 소셜, 이메일/비밀번호 등)다. 보안 경계는 로그인 방식이 아니라 아래 `event_organizer_permissions`의 부여 절차에 있다.

#### event_organizer_permissions

```sql
CREATE TABLE event_organizer_permissions (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES event_organizer_accounts(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- EVENT_ORGANIZER_REP | EVENT_ORGANIZER
  granted_by UUID NOT NULL REFERENCES staff_accounts(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  UNIQUE(account_id, event_id)
);
```

`granted_by`는 항상 `staff_accounts`(루트 관리자)를 가리킨다 — 대표(`EVENT_ORGANIZER_REP`)는 하위 계정을 조회·해지(`revoked_at` 갱신)할 수는 있지만 신규 행을 등록할 수는 없으므로, 등록 시점의 `granted_by`는 대표가 아니라 항상 루트 관리자다.

#### event_organizer_invites

```sql
CREATE TABLE event_organizer_invites (
  id UUID PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  intended_role TEXT NOT NULL, -- EVENT_ORGANIZER_REP | EVENT_ORGANIZER
  created_by UUID NOT NULL REFERENCES staff_accounts(id),
  used_by_account_id UUID REFERENCES event_organizer_accounts(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 4.4 태그 구조

태그는 평면 배열이 아니라 그룹과 계층을 가진다.

```text
행사 형식
├─ 공연
│  ├─ 단독 라이브
│  ├─ 합동 라이브
│  └─ 팬미팅
├─ 전시
│  ├─ 산업 전시 (기업 부스 중심 — 게임·애니메이션 업계 전시/쇼케이스)
│  └─ 동인·창작 마켓 (개인·서클 부스 중심)
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

태그 표시명은 `entity_localizations`(entity_type='TAG')로 다국어 제공한다 — 전용 `tag_localizations` 신설 여부는 ERD 작업([§4.5](#45-erd))에서 확정했다.

### 4.4.1 초기 시드 매핑 (확정 9개 행사 기준)

[02-users-and-scope.md §2.3.3](02-users-and-scope.md#233-초기-대상-행사-시리즈-확정)에서 확정한 9개 행사 시리즈에 위 트리를 적용한 초기 태그 매핑이다. 행사 하나에 여러 태그가 붙을 수 있다(다대다). 참가 방식은 9개 모두 현재까지 확인된 바로는 오프라인 기반이라 별도 표기 없이 전부 오프라인이다.

| 행사 시리즈 | 행사 형식 태그 | 티켓 방식 |
|---|---|---|
| AGF | 전시 > 산업 전시, 공연 > 합동 라이브 | 유료 (선착순 — 킨텍스 수용 인원만큼 전체 입장권 수량 한정) |
| 코믹월드 (서코, 부코 등) | 전시 > 동인·창작 마켓 | 유료 |
| 지스타 (G-STAR) | 전시 > 산업 전시 | 유료 |
| 플레이엑스포 (PlayX4) | 전시 > 산업 전시 | 유료 |
| 일러스타 페스 | 전시 > 동인·창작 마켓 | 유료 (선착순 — 킨텍스 수용 인원만큼 전체 입장권 수량 한정) |
| TGS (Tokyo Game Show) | 전시 > 산업 전시 | 유료 |
| COMIC MARKET (코미케) | 전시 > 동인·창작 마켓 | 유료 |
| AnimeJapan | 전시 > 산업 전시, 공연 > 합동 라이브 | 유료 |
| WONDERLIVET | 공연 > 합동 라이브 | 유료 (일자별 티켓 — 1일권/2일권/3일권, 별도 선착순 없음) |

> **미확정 메모**: 티켓 방식 중 "선착순"/"추첨" 세부 구분은 행사마다, 회차마다 다르므로 이 표에서는 무료/유료 대분류만 확정하고 세부값은 실제 일정(Event Schedule) 등록 시점에 개별 확인한다. 확인된 것: AGF·일러스타 페스는 둘 다 일산 킨텍스 개최로 수용 인원만큼 전체 입장권 수량이 한정된 선착순 구조(추첨 아님), WONDERLIVET은 선착순·추첨 없이 일자별(1일권/2일권/3일권) 고정가 판매 구조. 지스타는 서울이 아닌 부산 벡스코 개최라 AGF·일러스타 페스와는 규모가 달라 수량 제한이 없는 것으로 추정(미확인). TGS는 정보 없음(미확인). 일자별 티켓처럼 태그로 담기 어려운 세부 구조는 Event Schedule 단위 설계에서 반영한다.

## 4.5 ERD

전체 테이블 간 관계를 다이어그램으로 정리한 ERD는 [database/erd.md](database/erd.md)에 있다. 도메인별로 6개 다이어그램(행사/일정, 조직·장소·작품·인물·태그, 수집·분석, 검수·변경, 다국어·번역, 인증·사용자·알림·스토리지)으로 나누어 정리했으며, 본 파일 §4.2~4.4에서 "또는"으로 열려 있던 세부 사항(태그 현지화 방식, change_proposals 제출 주체 표현, 다형 참조 허용 범위 등)을 확정한 내용도 포함한다.

컬럼 단위 정의와 제약조건의 원본은 [database/schema.sql](database/schema.sql)이다. 실제 Migration 도구(Prisma/Drizzle) 선정 후에는 이 SQL을 그대로 옮기지 않고 해당 도구의 스키마 정의로 재작성하되, 테이블·컬럼·관계는 이 파일을 기준으로 삼는다.

---

[← 목차](README.md) · 이전: [03. 시스템 구조 및 도메인 모델](03-architecture-and-domain.md) · 다음: [05. 오브젝트 스토리지 및 수집 파이프라인](05-storage-and-collection.md)
