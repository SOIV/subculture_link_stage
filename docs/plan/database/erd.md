[← 목차](../README.md) · [04. 데이터베이스 설계](../04-database-design.md)

# SCLS ERD

[04-database-design.md §4.5](../04-database-design.md#45-erd)에서 미결로 남아 있던 ERD를 확정한 문서다. 테이블 그룹 구성은 [§4.2](../04-database-design.md#42-주요-테이블-그룹)를 그대로 따르며, 컬럼 단위 정의와 제약조건의 원본은 [schema.sql](schema.sql)이다 — 이 문서의 다이어그램은 관계 파악용으로 PK/FK와 핵심 컬럼만 표시한다.

전체 테이블을 하나의 다이어그램에 넣으면 가독성이 떨어지므로, §4.2의 9개 그룹을 6개 다이어그램으로 묶어 정리한다(태그·인증 등 소규모 그룹은 인접 그룹과 합침).

## 1. 행사 및 일정

```mermaid
erDiagram
    EVENT_SERIES ||--o{ EVENTS : "belongs to"
    EVENTS ||--o{ EVENT_SCHEDULES : has
    EVENTS ||--o{ EVENT_STATUS_HISTORY : has
    EVENTS ||--o{ EVENT_URLS : has
    EVENT_SCHEDULES ||--o{ EVENT_SCHEDULE_URLS : has
    EVENTS }o--|| VENUES : "held at"

    EVENT_SERIES {
        uuid id PK
        text canonical_slug
        text status
    }
    EVENTS {
        uuid id PK
        uuid event_series_id FK
        uuid venue_id FK
        text canonical_slug
        text status
        timestamptz starts_at
        timestamptz ends_at
    }
    EVENT_SCHEDULES {
        uuid id PK
        uuid event_id FK
        uuid source_document_id FK
        text schedule_type
        text status
    }
    EVENT_STATUS_HISTORY {
        uuid id PK
        uuid event_id FK
        uuid change_proposal_id FK
        text to_status
    }
    EVENT_URLS {
        uuid id PK
        uuid event_id FK
        text url_type
    }
    EVENT_SCHEDULE_URLS {
        uuid id PK
        uuid event_schedule_id FK
        text url_type
    }
```

## 2. 조직·장소·작품·인물 및 태그

```mermaid
erDiagram
    EVENTS ||--o{ EVENT_ORGANIZERS : has
    ORGANIZERS ||--o{ EVENT_ORGANIZERS : has
    EVENTS ||--o{ EVENT_FRANCHISES : has
    FRANCHISES ||--o{ EVENT_FRANCHISES : has
    EVENTS ||--o{ EVENT_PARTICIPANTS : has
    PARTICIPANTS ||--o{ EVENT_PARTICIPANTS : has

    TAG_GROUPS ||--o{ TAGS : has
    TAGS ||--o{ TAGS : "parent of"
    EVENTS ||--o{ EVENT_TAGS : has
    TAGS ||--o{ EVENT_TAGS : has
    EVENT_SCHEDULES ||--o{ EVENT_SCHEDULE_TAGS : has
    TAGS ||--o{ EVENT_SCHEDULE_TAGS : has
    EVENT_SERIES ||--o{ EVENT_SERIES_TAGS : has
    TAGS ||--o{ EVENT_SERIES_TAGS : has
    FRANCHISES ||--o{ FRANCHISE_TAGS : has
    TAGS ||--o{ FRANCHISE_TAGS : has
    PARTICIPANTS ||--o{ PARTICIPANT_TAGS : has
    TAGS ||--o{ PARTICIPANT_TAGS : has
    VENUES ||--o{ VENUE_TAGS : has
    TAGS ||--o{ VENUE_TAGS : has

    ORGANIZERS {
        uuid id PK
        text canonical_name
        text organizer_type
    }
    VENUES {
        uuid id PK
        text canonical_name
        char country_code
    }
    FRANCHISES {
        uuid id PK
        text canonical_name
        text franchise_type
    }
    PARTICIPANTS {
        uuid id PK
        text canonical_name
        text participant_type
    }
    EVENT_ORGANIZERS {
        uuid id PK
        uuid event_id FK
        uuid organizer_id FK
        text role
    }
    EVENT_FRANCHISES {
        uuid id PK
        uuid event_id FK
        uuid franchise_id FK
    }
    EVENT_PARTICIPANTS {
        uuid id PK
        uuid event_id FK
        uuid participant_id FK
        text role
    }
    TAG_GROUPS {
        uuid id PK
        text canonical_name
    }
    TAGS {
        uuid id PK
        uuid group_id FK
        uuid parent_tag_id FK
        text slug
    }
    EVENT_TAGS { uuid event_id FK
                 uuid tag_id FK }
    EVENT_SCHEDULE_TAGS { uuid event_schedule_id FK
                          uuid tag_id FK }
    EVENT_SERIES_TAGS { uuid event_series_id FK
                        uuid tag_id FK }
    FRANCHISE_TAGS { uuid franchise_id FK
                     uuid tag_id FK }
    PARTICIPANT_TAGS { uuid participant_id FK
                       uuid tag_id FK }
    VENUE_TAGS { uuid venue_id FK
                uuid tag_id FK }
```

## 3. 수집 및 분석

```mermaid
erDiagram
    SOURCES ||--o{ SOURCE_RULES : has
    SOURCES ||--o{ COLLECTION_JOBS : has
    SOURCES ||--o{ COLLECTED_DOCUMENTS : produces
    SOURCES ||--o{ SOURCE_SNAPSHOTS : has
    COLLECTED_DOCUMENTS ||--o| SOURCE_SNAPSHOTS : "captured as"
    COLLECTED_DOCUMENTS ||--o{ DOCUMENT_ANALYSES : has
    DOCUMENT_ANALYSES ||--o{ EXTRACTED_ENTITIES : has
    DOCUMENT_ANALYSES ||--o{ CLASSIFICATION_RESULTS : has
    DOCUMENT_ANALYSES ||--o{ EVENT_MATCHES : has
    DOCUMENT_ANALYSES }o--o| EVENTS : "matched to"
    STORAGE_OBJECTS ||--o{ COLLECTED_DOCUMENTS : "stores raw of"
    STORAGE_OBJECTS ||--o{ SOURCE_SNAPSHOTS : stores
    EVENT_SERIES ||--o{ SOURCES : "tracked by"

    SOURCES {
        uuid id PK
        uuid event_series_id FK
        text source_type
        boolean is_active
    }
    SOURCE_RULES {
        uuid id PK
        uuid source_id FK
        text rule_type
    }
    COLLECTION_JOBS {
        uuid id PK
        uuid source_id FK
        text status
    }
    COLLECTED_DOCUMENTS {
        uuid id PK
        uuid source_id FK
        uuid storage_object_id FK
        text content_hash
        integer revision
        text status
    }
    SOURCE_SNAPSHOTS {
        uuid id PK
        uuid source_id FK
        uuid collected_document_id FK
        uuid storage_object_id FK
    }
    DOCUMENT_ANALYSES {
        uuid id PK
        uuid collected_document_id FK
        uuid matched_event_id FK
        text predicted_action
        double confidence
    }
    EXTRACTED_ENTITIES {
        uuid id PK
        uuid document_analysis_id FK
        text entity_type
    }
    CLASSIFICATION_RESULTS {
        uuid id PK
        uuid document_analysis_id FK
        text label
    }
    EVENT_MATCHES {
        uuid id PK
        uuid document_analysis_id FK
        uuid event_id FK
        text match_type
    }
```

## 4. 검수 및 변경

```mermaid
erDiagram
    DOCUMENT_ANALYSES ||--o| CHANGE_PROPOSALS : "generates"
    CHANGE_PROPOSALS ||--o{ CHANGE_PROPOSAL_FIELDS : has
    CHANGE_PROPOSALS ||--o| REVIEW_TASKS : has
    REVIEW_TASKS ||--o{ REVIEW_DECISIONS : has
    CHANGE_PROPOSALS }o--o| EVENTS : targets
    CHANGE_PROPOSALS }o--o| EVENT_SCHEDULES : targets
    STAFF_ACCOUNTS ||--o{ REVIEW_TASKS : "assigned to"
    STAFF_ACCOUNTS ||--o{ REVIEW_DECISIONS : decides
    STAFF_ACCOUNTS ||--o{ CHANGE_PROPOSALS : submits
    EVENT_ORGANIZER_ACCOUNTS ||--o{ CHANGE_PROPOSALS : submits

    CHANGE_PROPOSALS {
        uuid id PK
        uuid source_document_analysis_id FK
        uuid submitted_by_staff_id FK
        uuid submitted_by_organizer_account_id FK
        uuid target_event_id FK
        uuid target_event_schedule_id FK
        text proposal_type
        text status
    }
    CHANGE_PROPOSAL_FIELDS {
        uuid id PK
        uuid change_proposal_id FK
        text field_name
    }
    REVIEW_TASKS {
        uuid id PK
        uuid change_proposal_id FK
        uuid assigned_to FK
        text status
    }
    REVIEW_DECISIONS {
        uuid id PK
        uuid review_task_id FK
        uuid decided_by FK
        text decision
    }
```

## 5. 다국어 및 번역

```mermaid
erDiagram
    ENTITY_LOCALIZATIONS ||--o{ TRANSLATION_REVISIONS : has
    ENTITY_LOCALIZATIONS ||--o{ TRANSLATION_CORRECTION_REQUESTS : has
    COLLECTED_DOCUMENTS ||--o{ DOCUMENT_TRANSLATIONS : has
    COLLECTED_DOCUMENTS ||--o{ TRANSLATION_JOBS : has
    GLOSSARY_TERMS ||--o{ GLOSSARY_TRANSLATIONS : has
    GLOSSARY_SUGGESTIONS }o--o| GLOSSARY_TERMS : "merged into"
    STAFF_ACCOUNTS ||--o{ TRANSLATION_REVISIONS : creates
    STAFF_ACCOUNTS ||--o{ TRANSLATION_CORRECTION_REQUESTS : reviews
    STAFF_ACCOUNTS ||--o{ GLOSSARY_SUGGESTIONS : reviews
    USERS ||--o{ TRANSLATION_CORRECTION_REQUESTS : requests
    USERS ||--o{ GLOSSARY_SUGGESTIONS : suggests

    ENTITY_LOCALIZATIONS {
        uuid id PK
        text entity_type
        uuid entity_id "polymorphic"
        text locale
        text translation_source
        text translation_status
    }
    DOCUMENT_TRANSLATIONS {
        uuid id PK
        uuid collected_document_id FK
        text target_locale
        integer source_revision
    }
    TRANSLATION_JOBS {
        uuid id PK
        uuid collected_document_id FK
        text job_type
        text status
    }
    TRANSLATION_REVISIONS {
        uuid id PK
        uuid entity_localization_id FK
        uuid created_by FK
        integer revision_number
    }
    TRANSLATION_CORRECTION_REQUESTS {
        uuid id PK
        uuid requester_id FK
        uuid localization_id FK
        uuid reviewer_id FK
        text error_type
        text status
    }
    GLOSSARY_TERMS {
        uuid id PK
        text source_text
        text term_type
        text scope_type
        uuid scope_id "polymorphic"
    }
    GLOSSARY_TRANSLATIONS {
        uuid id PK
        uuid glossary_term_id FK
        text target_locale
    }
    GLOSSARY_SUGGESTIONS {
        uuid id PK
        uuid suggested_by FK
        uuid reviewer_id FK
        uuid merged_into_term_id FK
        text status
    }
```

## 6. 인증·사용자·알림·스토리지

```mermaid
erDiagram
    STAFF_ACCOUNTS ||--o{ STAFF_SESSIONS : has
    STAFF_ACCOUNTS ||--o{ EVENT_ORGANIZER_PERMISSIONS : grants
    STAFF_ACCOUNTS ||--o{ EVENT_ORGANIZER_INVITES : creates
    EVENT_ORGANIZER_ACCOUNTS ||--o{ EVENT_ORGANIZER_PERMISSIONS : has
    EVENT_ORGANIZER_ACCOUNTS ||--o| EVENT_ORGANIZER_INVITES : redeems
    EVENTS ||--o{ EVENT_ORGANIZER_PERMISSIONS : "scopes"
    EVENTS ||--o{ EVENT_ORGANIZER_INVITES : "scopes"

    USERS ||--o{ USER_SUBSCRIPTIONS : has
    USERS ||--o{ WEB_PUSH_SUBSCRIPTIONS : has
    USER_SUBSCRIPTIONS ||--o{ NOTIFICATION_DELIVERIES : receives
    NOTIFICATION_JOBS ||--o{ NOTIFICATION_DELIVERIES : has
    EVENTS ||--o{ NOTIFICATION_JOBS : triggers
    CHANGE_PROPOSALS ||--o{ NOTIFICATION_JOBS : triggers

    STORAGE_OBJECTS ||--o{ STORAGE_LINKS : has
    EVENTS ||--o{ STORAGE_LINKS : has
    VENUES ||--o{ STORAGE_LINKS : has

    STAFF_ACCOUNTS {
        uuid id PK
        text login_id
        text role
    }
    STAFF_SESSIONS {
        uuid id PK
        uuid staff_account_id FK
        text token_hash
        timestamptz expires_at
    }
    EVENT_ORGANIZER_ACCOUNTS {
        uuid id PK
        text login_method
        text login_identifier
    }
    EVENT_ORGANIZER_PERMISSIONS {
        uuid id PK
        uuid account_id FK
        uuid event_id FK
        uuid granted_by FK
        text role
    }
    EVENT_ORGANIZER_INVITES {
        uuid id PK
        uuid event_id FK
        uuid created_by FK
        uuid used_by_account_id FK
        text code
    }
    USERS {
        uuid id PK
        text login_provider
        text trust_level
    }
    USER_SUBSCRIPTIONS {
        uuid id PK
        uuid user_id FK
        text subscription_type
        uuid target_id "polymorphic"
    }
    WEB_PUSH_SUBSCRIPTIONS {
        uuid id PK
        uuid user_id FK
        text endpoint
    }
    NOTIFICATION_JOBS {
        uuid id PK
        uuid event_id FK
        uuid change_proposal_id FK
        text notification_type
        text status
    }
    NOTIFICATION_DELIVERIES {
        uuid id PK
        uuid notification_job_id FK
        uuid user_subscription_id FK
        text status
    }
    STORAGE_OBJECTS {
        uuid id PK
        text provider
        text retention_policy
    }
    STORAGE_LINKS {
        uuid id PK
        uuid storage_object_id FK
        uuid event_id FK
        text link_type
    }
```

## 확정하며 정리한 사항

기존 §4.2/§4.4에 "또는"으로 열려 있던 항목을 다이어그램화 과정에서 다음과 같이 확정했다.

- **태그 표시명**: 전용 `tag_localizations`를 새로 만들지 않고 `entity_localizations`(entity_type='TAG')로 통일한다.
- **change_proposals 제출 주체**: `staff_accounts`와 `event_organizer_accounts`를 가리키는 두 개의 nullable FK(`submitted_by_staff_id`, `submitted_by_organizer_account_id`)로 표현한다. 신뢰 수준이 다른 두 계정 체계를 하나의 다형 FK로 묶지 않기 위함이며, 둘 다 NULL이면 시스템(자동 파이프라인) 제출로 간주한다.
- **다형 참조 허용 범위**: `entity_id`/`target_id`/`scope_id` 형태의 다형 컬럼은 `entity_localizations`, `user_subscriptions`, `glossary_terms`/`glossary_suggestions` 세 곳에만 남기고, 나머지 핵심 관계(행사·태그·조직·스토리지 등)는 전부 대상별 전용 FK로 분리했다 — §4.2 원칙("target_type+target_id 범용 연결 테이블은 사용하지 않는다")과의 정합성을 유지하기 위함이다.
- **event/event_schedule status 값**: 문서에 명시되지 않았던 `events.status`(DRAFT/CONFIRMED/CANCELLED/POSTPONED/ENDED/ARCHIVED), `event_schedules.status`(SCHEDULED/CONFIRMED/CANCELLED/POSTPONED/COMPLETED) 등 세부 상태값을 이번에 확정했다. 구현 중 부족하면 CHECK 제약을 조정한다.
- **staff_sessions 추가**: 최초 ERD 확정 시에는 없던 테이블이다. Phase 1 구현 중 루트 관리자 로그인을 세션+쿠키 방식으로 확정하면서([07-admin-dashboard.md §7.6.3](../07-admin-dashboard.md#763-권한-부여-절차-초안)) 추가했다.

## 다음 단계

- 실제 Migration 도구(Prisma/Drizzle) 선정 후 [schema.sql](schema.sql)을 해당 도구의 스키마 정의로 옮긴다.
- [11-roadmap-and-success.md](../11-roadmap-and-success.md) Phase 1 착수 시 이 스키마를 기준으로 초기 Migration을 생성한다.
