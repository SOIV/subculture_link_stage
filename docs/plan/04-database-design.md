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

## 4.4 태그 구조

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

## 4.5 ERD 확정 (미결)

전체 테이블 간 관계를 다이어그램으로 정리한 ERD는 아직 작성 전이다. [11-roadmap-and-success.md](11-roadmap-and-success.md)의 Phase 0 체크리스트 항목("ERD 확정")으로 남아 있으며, 본 파일의 테이블 그룹·핵심 테이블 예시를 기준으로 구현 착수 직전에 별도로 작성한다.

---

[← 목차](README.md) · 이전: [03. 시스템 구조 및 도메인 모델](03-architecture-and-domain.md) · 다음: [05. 오브젝트 스토리지 및 수집 파이프라인](05-storage-and-collection.md)
