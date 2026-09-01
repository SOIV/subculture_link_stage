-- Subculture Link Stage (SCLS) — Reference Schema
--
-- docs/plan/04-database-design.md §4.2(주요 테이블 그룹)·§4.3(핵심 테이블 예시)를 기준으로
-- 전체 테이블을 확정한 참고용 DDL이다. 실제 Migration(Prisma/Drizzle 등) 도구가 정해지면
-- 이 파일을 1:1로 옮기지 않고 해당 도구의 스키마 정의로 재작성하되, 테이블/컬럼/관계는
-- 이 문서를 기준으로 삼는다.
--
-- 표기 규칙
--   - PK는 전부 UUID (gen_random_uuid())
--   - *_TYPE, STATUS 등은 네이티브 ENUM 대신 TEXT + CHECK 사용 (값 추가 시 ENUM ALTER 불필요)
--   - 하위 상세 테이블(부모 삭제 시 함께 삭제되어야 하는 행)은 ON DELETE CASCADE
--   - 마스터/참조 데이터(venues, organizers, tags, staff_accounts 등)를 향한 FK는
--     기본적으로 ON DELETE 미지정(NO ACTION) — 참조 데이터는 소프트 삭제(is_active 등)로 관리
--   - "target_type + target_id" 형태의 범용 다형 FK는 사용하지 않는다(§4.2 원칙).
--     대상별 연결 테이블(event_tags, event_franchises 등)을 사용한다.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- =========================================================================
-- 1. 행사 및 일정 (event_series / events / event_schedules)
-- =========================================================================

CREATE TABLE event_series (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_slug  TEXT UNIQUE NOT NULL,
  primary_locale  TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE','INACTIVE','ARCHIVED')),
  founded_year    INTEGER,
  official_url    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_series_id   UUID REFERENCES event_series(id),
  canonical_slug    TEXT UNIQUE NOT NULL,
  primary_locale    TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'DRAFT'
                      CHECK (status IN ('DRAFT','CONFIRMED','CANCELLED','POSTPONED','ENDED','ARCHIVED')),
  country_code      CHAR(2),
  is_online         BOOLEAN NOT NULL DEFAULT FALSE,
  venue_id          UUID, -- FK는 §10에서 지연 부여 (venues가 뒤에 정의됨)
  starts_at         TIMESTAMPTZ,
  ends_at           TIMESTAMPTZ,
  is_all_day        BOOLEAN DEFAULT FALSE,
  official_url      TEXT NOT NULL,
  last_verified_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE event_schedules (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  schedule_type       TEXT NOT NULL CHECK (schedule_type IN (
                        'EVENT_START','EVENT_END','TICKET_OPEN','TICKET_CLOSE',
                        'LOTTERY_OPEN','LOTTERY_CLOSE','LOTTERY_RESULT',
                        'REGISTRATION_OPEN','REGISTRATION_CLOSE',
                        'STREAM_START','STREAM_END','ARCHIVE_END',
                        'MERCH_OPEN','MERCH_CLOSE','ANNOUNCEMENT'
                      )),
  starts_at           TIMESTAMPTZ,
  ends_at             TIMESTAMPTZ,
  timezone            TEXT NOT NULL,
  is_all_day          BOOLEAN DEFAULT FALSE,
  status              TEXT NOT NULL DEFAULT 'SCHEDULED'
                        CHECK (status IN ('SCHEDULED','CONFIRMED','CANCELLED','POSTPONED','COMPLETED')),
  source_document_id  UUID, -- FK는 §10에서 지연 부여
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE event_status_history (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  from_status         TEXT,
  to_status           TEXT NOT NULL,
  reason              TEXT,
  change_proposal_id  UUID, -- FK는 §10에서 지연 부여
  changed_by          UUID, -- FK는 §10에서 지연 부여
  changed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE event_urls (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  url_type    TEXT NOT NULL CHECK (url_type IN ('OFFICIAL_SITE','TICKET','STREAMING','SNS','PRESS','OTHER')),
  url         TEXT NOT NULL,
  label       TEXT,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE event_schedule_urls (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_schedule_id   UUID NOT NULL REFERENCES event_schedules(id) ON DELETE CASCADE,
  url_type            TEXT NOT NULL CHECK (url_type IN ('OFFICIAL_SITE','TICKET','STREAMING','SNS','PRESS','OTHER')),
  url                 TEXT NOT NULL,
  label               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 2. 조직, 장소, 작품, 인물
-- =========================================================================

CREATE TABLE organizers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name  TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  organizer_type  TEXT CHECK (organizer_type IN ('COMPANY','PUBLISHER','CIRCLE','GOVERNMENT','OTHER')),
  country_code    CHAR(2),
  official_url    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE venues (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name  TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  country_code    CHAR(2) NOT NULL,
  address         TEXT,
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  official_url    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE franchises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name  TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  franchise_type  TEXT CHECK (franchise_type IN ('GAME','ANIME','MANGA','MUSIC','MIXED','OTHER')),
  official_url    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE participants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name    TEXT NOT NULL,
  slug              TEXT UNIQUE NOT NULL,
  participant_type  TEXT CHECK (participant_type IN ('PERSON','GROUP','UNIT','VTUBER','OTHER')),
  official_url      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE event_organizers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organizer_id  UUID NOT NULL REFERENCES organizers(id),
  role          TEXT NOT NULL DEFAULT 'HOST' CHECK (role IN ('HOST','CO_HOST','SPONSOR','SUPERVISOR')),
  UNIQUE (event_id, organizer_id, role)
);

CREATE TABLE event_franchises (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  franchise_id  UUID NOT NULL REFERENCES franchises(id),
  UNIQUE (event_id, franchise_id)
);

CREATE TABLE event_participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  participant_id  UUID NOT NULL REFERENCES participants(id),
  role            TEXT NOT NULL DEFAULT 'PERFORMER' CHECK (role IN ('PERFORMER','GUEST','MC','DIRECTOR','OTHER')),
  UNIQUE (event_id, participant_id, role)
);

-- =========================================================================
-- 3. 태그 및 분류
--
-- 태그 표시명은 전용 tag_localizations를 따로 두지 않고 entity_localizations
-- (entity_type='TAG')로 통일한다 — §4.4에서 "또는"으로 열려 있던 부분을 확정.
-- =========================================================================

CREATE TABLE tag_groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name  TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  description     TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE tags (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id         UUID NOT NULL REFERENCES tag_groups(id),
  parent_tag_id    UUID REFERENCES tags(id),
  canonical_name   TEXT NOT NULL,
  slug             TEXT NOT NULL,
  description      TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (group_id, slug)
);

CREATE TABLE event_tags (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id  UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tag_id    UUID NOT NULL REFERENCES tags(id),
  UNIQUE (event_id, tag_id)
);

CREATE TABLE event_schedule_tags (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_schedule_id   UUID NOT NULL REFERENCES event_schedules(id) ON DELETE CASCADE,
  tag_id              UUID NOT NULL REFERENCES tags(id),
  UNIQUE (event_schedule_id, tag_id)
);

CREATE TABLE event_series_tags (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_series_id  UUID NOT NULL REFERENCES event_series(id) ON DELETE CASCADE,
  tag_id           UUID NOT NULL REFERENCES tags(id),
  UNIQUE (event_series_id, tag_id)
);

CREATE TABLE franchise_tags (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id  UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
  tag_id        UUID NOT NULL REFERENCES tags(id),
  UNIQUE (franchise_id, tag_id)
);

CREATE TABLE participant_tags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id  UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  tag_id          UUID NOT NULL REFERENCES tags(id),
  UNIQUE (participant_id, tag_id)
);

CREATE TABLE venue_tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id   UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES tags(id),
  UNIQUE (venue_id, tag_id)
);

-- =========================================================================
-- 4. 수집 및 분석
-- =========================================================================

CREATE TABLE sources (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_series_id       UUID REFERENCES event_series(id),
  source_type           TEXT NOT NULL CHECK (source_type IN (
                          'OFFICIAL_SITE','OFFICIAL_NEWS','X_ACCOUNT','INSTAGRAM_ACCOUNT',
                          'YOUTUBE_CHANNEL','RSS','TICKET_PLATFORM','STREAMING_PLATFORM','MANUAL'
                        )),
  source_url            TEXT NOT NULL,
  account_identifier     TEXT,
  collection_method      TEXT NOT NULL CHECK (collection_method IN ('HTML_SCRAPE','RSS','API','MANUAL')),
  check_interval_minutes INTEGER,
  priority               INTEGER NOT NULL DEFAULT 0,
  is_active              BOOLEAN NOT NULL DEFAULT TRUE,
  terms_note             TEXT,
  last_checked_at        TIMESTAMPTZ,
  last_success_at        TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE source_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id   UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  rule_type   TEXT NOT NULL CHECK (rule_type IN (
                'INCLUDE_KEYWORD','EXCLUDE_KEYWORD','CSS_SELECTOR','XPATH',
                'JSON_PATH','DATE_PATTERN','URL_PATTERN','ACCOUNT_FILTER','CONTENT_TYPE_FILTER'
              )),
  rule_value  TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE collection_jobs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id        UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED','RUNNING','SUCCEEDED','FAILED')),
  started_at       TIMESTAMPTZ,
  finished_at      TIMESTAMPTZ,
  documents_found  INTEGER NOT NULL DEFAULT 0,
  documents_new    INTEGER NOT NULL DEFAULT 0,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE collected_documents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id           UUID NOT NULL REFERENCES sources(id),
  original_url        TEXT NOT NULL,
  external_id         TEXT,
  title               TEXT,
  raw_text            TEXT,
  detected_locale     TEXT,
  published_at        TIMESTAMPTZ,
  collected_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content_hash        TEXT NOT NULL,
  revision            INTEGER NOT NULL DEFAULT 1,
  storage_object_id   UUID, -- FK는 §10에서 지연 부여
  status              TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
                        'PENDING','ANALYZED','EXCLUDED','PROPOSAL_CREATED','ARCHIVED'
                      )),
  UNIQUE (source_id, content_hash)
);

CREATE TABLE source_snapshots (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id              UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  collected_document_id  UUID REFERENCES collected_documents(id) ON DELETE SET NULL,
  storage_object_id      UUID NOT NULL, -- FK는 §10에서 지연 부여
  captured_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content_hash           TEXT NOT NULL
);

CREATE TABLE document_analyses (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collected_document_id    UUID NOT NULL REFERENCES collected_documents(id) ON DELETE CASCADE,
  relevance_score          DOUBLE PRECISION,
  predicted_action         TEXT CHECK (predicted_action IN (
                              'CREATE_EVENT','ADD_SCHEDULE','UPDATE_EVENT','UPDATE_SCHEDULE',
                              'CANCEL_EVENT','POSTPONE_EVENT','PARTICIPANT_CHANGE','VENUE_CHANGE',
                              'CREATE_ALERT_ONLY','REFERENCE_ONLY','REJECT'
                            )),
  predicted_schedule_type  TEXT,
  matched_event_id         UUID REFERENCES events(id),
  confidence               DOUBLE PRECISION,
  requires_review          BOOLEAN NOT NULL DEFAULT TRUE,
  analyzed_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE extracted_entities (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_analysis_id  UUID NOT NULL REFERENCES document_analyses(id) ON DELETE CASCADE,
  entity_type           TEXT NOT NULL CHECK (entity_type IN (
                          'EVENT_NAME','DATE','VENUE','FRANCHISE','PARTICIPANT','PRICE','URL','OTHER'
                        )),
  raw_text              TEXT NOT NULL,
  normalized_value      TEXT,
  confidence            DOUBLE PRECISION
);

CREATE TABLE classification_results (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_analysis_id  UUID NOT NULL REFERENCES document_analyses(id) ON DELETE CASCADE,
  label                 TEXT NOT NULL,
  score                 DOUBLE PRECISION NOT NULL,
  model_name            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE event_matches (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_analysis_id  UUID NOT NULL REFERENCES document_analyses(id) ON DELETE CASCADE,
  event_id              UUID REFERENCES events(id),
  event_series_id       UUID REFERENCES event_series(id),
  match_score           DOUBLE PRECISION NOT NULL,
  match_type            TEXT NOT NULL CHECK (match_type IN ('EXACT','FUZZY','SERIES_ONLY','NEW_CANDIDATE')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 5. 검수 및 변경
--
-- submitted_by_*는 change_proposals의 제출 주체를 나타낸다. staff_accounts와
-- event_organizer_accounts는 신뢰 수준이 달라 별도 계정 테이블로 분리되어
-- 있으므로(§4.2 인증 및 권한), target_type+id 범용 FK 대신 두 개의 nullable FK로
-- "둘 중 하나만 채워짐"을 표현한다. 둘 다 NULL이면 SYSTEM(자동 파이프라인) 제출.
-- =========================================================================

CREATE TABLE change_proposals (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_type                 TEXT NOT NULL CHECK (proposal_type IN (
                                  'CREATE_EVENT','ADD_SCHEDULE','UPDATE_EVENT','UPDATE_SCHEDULE',
                                  'CANCEL_EVENT','POSTPONE_EVENT','PARTICIPANT_CHANGE','VENUE_CHANGE',
                                  'CREATE_ALERT_ONLY','REFERENCE_ONLY','REJECT'
                                )),
  source_document_analysis_id   UUID REFERENCES document_analyses(id) ON DELETE SET NULL,
  submitted_by_staff_id         UUID, -- FK는 §10에서 지연 부여
  submitted_by_organizer_account_id UUID, -- FK는 §10에서 지연 부여
  target_event_id               UUID REFERENCES events(id) ON DELETE CASCADE,
  target_event_schedule_id      UUID REFERENCES event_schedules(id) ON DELETE CASCADE,
  status                        TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
                                  'PENDING','APPROVED','PARTIALLY_APPROVED','REJECTED','REFERENCE_ONLY'
                                )),
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE change_proposal_fields (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_proposal_id   UUID NOT NULL REFERENCES change_proposals(id) ON DELETE CASCADE,
  field_name           TEXT NOT NULL,
  old_value            TEXT,
  new_value            TEXT NOT NULL,
  is_accepted          BOOLEAN
);

CREATE TABLE review_tasks (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_proposal_id   UUID NOT NULL REFERENCES change_proposals(id) ON DELETE CASCADE,
  assigned_to          UUID, -- FK는 §10에서 지연 부여
  status               TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','IN_PROGRESS','DONE')),
  priority             INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE review_decisions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_task_id   UUID NOT NULL REFERENCES review_tasks(id) ON DELETE CASCADE,
  decided_by       UUID NOT NULL, -- FK는 §10에서 지연 부여
  decision         TEXT NOT NULL CHECK (decision IN ('APPROVE','PARTIAL_APPROVE','REJECT','REFERENCE_ONLY')),
  note             TEXT,
  decided_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 6. 다국어 및 번역
-- =========================================================================

CREATE TABLE entity_localizations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type         TEXT NOT NULL CHECK (entity_type IN (
                        'EVENT','EVENT_SERIES','EVENT_SCHEDULE','VENUE','ORGANIZER','FRANCHISE','PARTICIPANT','TAG'
                      )),
  entity_id           UUID NOT NULL,
  locale              TEXT NOT NULL,
  title               TEXT,
  summary             TEXT,
  description         TEXT,
  translation_source  TEXT NOT NULL CHECK (translation_source IN ('OFFICIAL','MACHINE','MACHINE_REVIEWED','HUMAN','COMMUNITY')),
  translation_status  TEXT NOT NULL CHECK (translation_status IN ('PENDING','GENERATED','REVIEW_REQUIRED','VERIFIED','OUTDATED','FAILED')),
  source_locale       TEXT,
  source_revision     INTEGER,
  translated_at       TIMESTAMPTZ,
  reviewed_at         TIMESTAMPTZ,
  UNIQUE (entity_type, entity_id, locale)
);
-- entity_id는 entity_type에 따라 events/event_series/event_schedules/venues/
-- organizers/franchises/participants/tags 중 하나를 가리키는 다형 참조다.
-- §4.2 원칙상 예외적으로 허용된 유일한 다형 테이블(여러 도메인에 동일 형식으로
-- 붙는 부가 데이터)이며, 무결성은 애플리케이션 레이어에서 강제한다.

CREATE TABLE document_translations (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collected_document_id  UUID NOT NULL REFERENCES collected_documents(id) ON DELETE CASCADE,
  target_locale          TEXT NOT NULL,
  translated_text        TEXT,
  status                 TEXT NOT NULL CHECK (status IN ('PENDING','GENERATED','REVIEW_REQUIRED','VERIFIED','OUTDATED','FAILED')),
  source_revision        INTEGER NOT NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (collected_document_id, target_locale, source_revision)
);

CREATE TABLE translation_jobs (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type               TEXT NOT NULL CHECK (job_type IN ('ENTITY','DOCUMENT')),
  entity_type            TEXT,
  entity_id              UUID,
  collected_document_id  UUID REFERENCES collected_documents(id) ON DELETE CASCADE,
  target_locale          TEXT NOT NULL,
  status                 TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','RUNNING','SUCCEEDED','FAILED')),
  attempts               INTEGER NOT NULL DEFAULT 0,
  error_message          TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE translation_revisions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_localization_id   UUID NOT NULL REFERENCES entity_localizations(id) ON DELETE CASCADE,
  revision_number          INTEGER NOT NULL,
  title                    TEXT,
  summary                  TEXT,
  description              TEXT,
  translation_source       TEXT NOT NULL CHECK (translation_source IN ('OFFICIAL','MACHINE','MACHINE_REVIEWED','HUMAN','COMMUNITY')),
  created_by               UUID, -- FK는 §10에서 지연 부여
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_localization_id, revision_number)
);

CREATE TABLE translation_correction_requests (
  id                             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id                   UUID, -- FK는 §10에서 지연 부여
  localization_id                UUID NOT NULL REFERENCES entity_localizations(id) ON DELETE CASCADE,
  field_name                     TEXT NOT NULL,
  source_text_snapshot           TEXT,
  current_translation_snapshot   TEXT,
  suggested_translation          TEXT NOT NULL,
  reason                         TEXT,
  evidence_url                   TEXT,
  error_type                     TEXT NOT NULL CHECK (error_type IN (
                                    'PROPER_NOUN','CONTEXT_ERROR','TERM_INCONSISTENCY','OMISSION',
                                    'OVER_TRANSLATION','DATE_OR_NUMBER','STYLE','OFFICIAL_NAME','OTHER'
                                  )),
  status                         TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','PARTIALLY_APPROVED','REJECTED')),
  reviewer_id                    UUID, -- FK는 §10에서 지연 부여
  review_note                    TEXT,
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at                    TIMESTAMPTZ
);

CREATE TABLE glossary_terms (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_locale       TEXT NOT NULL,
  source_text         TEXT NOT NULL,
  term_type           TEXT NOT NULL CHECK (term_type IN (
                        'FRANCHISE','CHARACTER','PERSON','GROUP','VENUE','EVENT','TICKET','STREAMING','GENERAL'
                      )),
  scope_type          TEXT NOT NULL CHECK (scope_type IN ('GLOBAL','COUNTRY','FRANCHISE','EVENT_SERIES','ORGANIZER','SOURCE')),
  scope_id            UUID,
  do_not_translate    BOOLEAN NOT NULL DEFAULT FALSE,
  case_sensitive      BOOLEAN NOT NULL DEFAULT FALSE,
  status              TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DEPRECATED')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_locale, source_text, scope_type, scope_id)
);
-- scope_id는 scope_type이 GLOBAL/COUNTRY가 아닌 경우 franchises/event_series/
-- organizers/sources 중 하나를 가리키는 다형 참조다. entity_localizations와
-- 동일한 이유로 허용된 예외이며 애플리케이션 레이어에서 검증한다.

CREATE TABLE glossary_translations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  glossary_term_id  UUID NOT NULL REFERENCES glossary_terms(id) ON DELETE CASCADE,
  target_locale     TEXT NOT NULL,
  preferred_text    TEXT NOT NULL,
  alternative_text  TEXT,
  is_official       BOOLEAN NOT NULL DEFAULT FALSE,
  source_url        TEXT,
  UNIQUE (glossary_term_id, target_locale)
);

CREATE TABLE glossary_suggestions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggested_by          UUID, -- FK는 §10에서 지연 부여
  source_locale         TEXT NOT NULL,
  source_text           TEXT NOT NULL,
  term_type             TEXT CHECK (term_type IN (
                          'FRANCHISE','CHARACTER','PERSON','GROUP','VENUE','EVENT','TICKET','STREAMING','GENERAL'
                        )),
  scope_type            TEXT CHECK (scope_type IN ('GLOBAL','COUNTRY','FRANCHISE','EVENT_SERIES','ORGANIZER','SOURCE')),
  scope_id              UUID,
  target_locale         TEXT NOT NULL,
  suggested_text        TEXT NOT NULL,
  reason                TEXT,
  evidence_url          TEXT,
  status                TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','MERGED','REJECTED','DEPRECATED')),
  merged_into_term_id   UUID REFERENCES glossary_terms(id),
  reviewer_id           UUID, -- FK는 §10에서 지연 부여
  review_note           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at           TIMESTAMPTZ
);

-- =========================================================================
-- 7. 인증 및 권한 (Backstage 3단계 구조 — §7.6)
-- =========================================================================

CREATE TABLE staff_accounts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login_id       TEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  display_name   TEXT,
  role           TEXT NOT NULL CHECK (role IN ('ADMIN','DATA_REVIEWER','TRANSLATION_REVIEWER')),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 루트 관리자 로그인 세션 (§7.6.3 결정 — DB 저장 세션 + 쿠키, JWT 미사용).
-- token_hash에는 쿠키로 내려가는 토큰 원문이 아닌 sha256 해시만 저장한다.
CREATE TABLE staff_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_account_id  UUID NOT NULL REFERENCES staff_accounts(id) ON DELETE CASCADE,
  token_hash        TEXT UNIQUE NOT NULL,
  expires_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE event_organizer_accounts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login_method      TEXT NOT NULL,
  login_identifier  TEXT NOT NULL,
  display_name      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (login_method, login_identifier)
);

CREATE TABLE event_organizer_permissions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   UUID NOT NULL REFERENCES event_organizer_accounts(id) ON DELETE CASCADE,
  event_id     UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('EVENT_ORGANIZER_REP','EVENT_ORGANIZER')),
  granted_by   UUID NOT NULL REFERENCES staff_accounts(id),
  granted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at   TIMESTAMPTZ,
  UNIQUE (account_id, event_id)
);

CREATE TABLE event_organizer_invites (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id              UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  code                  TEXT UNIQUE NOT NULL,
  intended_role         TEXT NOT NULL CHECK (intended_role IN ('EVENT_ORGANIZER_REP','EVENT_ORGANIZER')),
  created_by            UUID NOT NULL REFERENCES staff_accounts(id),
  used_by_account_id    UUID REFERENCES event_organizer_accounts(id),
  used_at               TIMESTAMPTZ,
  expires_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 8. 사용자 및 알림 (Onstage)
-- =========================================================================

CREATE TABLE users (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login_provider     TEXT NOT NULL,
  login_identifier   TEXT NOT NULL,
  display_name       TEXT,
  locale_preference  TEXT,
  trust_level        TEXT NOT NULL DEFAULT 'GENERAL' CHECK (trust_level IN ('GENERAL','TRUSTED_CONTRIBUTOR')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (login_provider, login_identifier)
);

CREATE TABLE user_subscriptions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_type  TEXT NOT NULL CHECK (subscription_type IN ('FRANCHISE','EVENT_SERIES','PARTICIPANT','EVENT','TAG')),
  target_id          UUID NOT NULL,
  channel            TEXT NOT NULL CHECK (channel IN ('DISCORD','WEBHOOK','WEB_PUSH')),
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, subscription_type, target_id, channel)
);
-- target_id는 subscription_type에 따라 franchises/event_series/participants/
-- events/tags 중 하나를 가리키는 다형 참조다 (entity_localizations와 동일한 예외).

CREATE TABLE web_push_subscriptions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint           TEXT NOT NULL UNIQUE,
  p256dh_key         TEXT NOT NULL,
  auth_key           TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Push API 구독 정보. user_subscriptions.channel = 'WEB_PUSH' 발송 시 이 테이블에서
-- 브라우저별 엔드포인트를 조회한다. 브라우저/기기별로 별도 행이 생길 수 있다.

CREATE TABLE notification_templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL CHECK (notification_type IN (
                       'NEW_EVENT','TICKET_OPEN','TICKET_CLOSING','LOTTERY_OPEN','LOTTERY_CLOSING',
                       'LOTTERY_RESULT','EVENT_REMINDER','STREAM_START','ARCHIVE_CLOSING',
                       'EVENT_CANCELLED','EVENT_POSTPONED','VENUE_CHANGED','PARTICIPANT_CHANGED'
                     )),
  locale            TEXT NOT NULL,
  title_template    TEXT NOT NULL,
  body_template     TEXT NOT NULL,
  UNIQUE (notification_type, locale)
);

CREATE TABLE notification_jobs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type    TEXT NOT NULL,
  event_id             UUID REFERENCES events(id) ON DELETE CASCADE,
  event_schedule_id    UUID REFERENCES event_schedules(id) ON DELETE CASCADE,
  change_proposal_id   UUID REFERENCES change_proposals(id) ON DELETE SET NULL,
  status               TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','SENT','FAILED')),
  scheduled_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_deliveries (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_job_id    UUID NOT NULL REFERENCES notification_jobs(id) ON DELETE CASCADE,
  user_subscription_id   UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  channel                TEXT NOT NULL CHECK (channel IN ('DISCORD','WEBHOOK','WEB_PUSH')),
  recipient              TEXT,
  status                 TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','FAILED')),
  error_message          TEXT,
  sent_at                TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 9. 파일 및 스토리지
-- =========================================================================

CREATE TABLE storage_objects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider          TEXT NOT NULL CHECK (provider IN ('R2','S3','SUPABASE','MINIO')),
  bucket            TEXT NOT NULL,
  object_key        TEXT NOT NULL,
  content_type      TEXT,
  size_bytes        BIGINT,
  checksum          TEXT NOT NULL,
  retention_policy  TEXT NOT NULL CHECK (retention_policy IN ('PERMANENT','LONG_TERM','TIME_LIMITED','EPHEMERAL')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ,
  UNIQUE (provider, bucket, object_key)
);

-- storage_links: "target_type+id" 범용 FK 대신 대상별 nullable FK를 나열하고,
-- 정확히 하나만 채워지도록 애플리케이션 레이어에서 강제한다(§4.2 원칙).
CREATE TABLE storage_links (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_object_id      UUID NOT NULL REFERENCES storage_objects(id) ON DELETE CASCADE,
  link_type              TEXT NOT NULL CHECK (link_type IN (
                           'EVENT_POSTER','EVENT_THUMBNAIL','VENUE_MAP','SCHEDULE_IMAGE','DOCUMENT_SNAPSHOT','OTHER'
                         )),
  event_id               UUID REFERENCES events(id) ON DELETE CASCADE,
  event_schedule_id      UUID REFERENCES event_schedules(id) ON DELETE CASCADE,
  venue_id               UUID REFERENCES venues(id) ON DELETE CASCADE,
  collected_document_id  UUID REFERENCES collected_documents(id) ON DELETE CASCADE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 10. 지연 외래키 (섹션 간 순방향 참조)
--
-- CREATE TABLE 순서는 §4.2의 테이블 그룹 순서(행사 → 조직/장소/작품/인물 →
-- 태그 → 수집/분석 → 검수/변경 → 다국어/번역 → 인증/권한 → 사용자/알림 →
-- 스토리지)를 그대로 따른다. 이 순서상 자기보다 뒤에 나오는 테이블을 참조하는
-- 컬럼은 CREATE TABLE 시점에는 REFERENCES를 생략하고(본문의 "FK는 §10에서
-- 지연 부여" 주석 참고), 여기서 ALTER TABLE로 외래키를 부여한다. 이렇게 하면
-- 이 파일을 위에서 아래로 그대로 실행해도 에러 없이 끝까지 적용된다.
-- =========================================================================

ALTER TABLE events
  ADD CONSTRAINT fk_events_venue
  FOREIGN KEY (venue_id) REFERENCES venues(id);

ALTER TABLE event_schedules
  ADD CONSTRAINT fk_event_schedules_source_document
  FOREIGN KEY (source_document_id) REFERENCES collected_documents(id) ON DELETE SET NULL;

ALTER TABLE event_status_history
  ADD CONSTRAINT fk_event_status_history_proposal
  FOREIGN KEY (change_proposal_id) REFERENCES change_proposals(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_event_status_history_changed_by
  FOREIGN KEY (changed_by) REFERENCES staff_accounts(id);

ALTER TABLE collected_documents
  ADD CONSTRAINT fk_collected_documents_storage_object
  FOREIGN KEY (storage_object_id) REFERENCES storage_objects(id);

ALTER TABLE source_snapshots
  ADD CONSTRAINT fk_source_snapshots_storage_object
  FOREIGN KEY (storage_object_id) REFERENCES storage_objects(id);

ALTER TABLE change_proposals
  ADD CONSTRAINT fk_change_proposals_staff
  FOREIGN KEY (submitted_by_staff_id) REFERENCES staff_accounts(id),
  ADD CONSTRAINT fk_change_proposals_organizer_account
  FOREIGN KEY (submitted_by_organizer_account_id) REFERENCES event_organizer_accounts(id);

ALTER TABLE review_tasks
  ADD CONSTRAINT fk_review_tasks_assigned_to
  FOREIGN KEY (assigned_to) REFERENCES staff_accounts(id);

ALTER TABLE review_decisions
  ADD CONSTRAINT fk_review_decisions_decided_by
  FOREIGN KEY (decided_by) REFERENCES staff_accounts(id);

ALTER TABLE translation_correction_requests
  ADD CONSTRAINT fk_tcr_requester
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_tcr_reviewer
  FOREIGN KEY (reviewer_id) REFERENCES staff_accounts(id);

ALTER TABLE translation_revisions
  ADD CONSTRAINT fk_translation_revisions_created_by
  FOREIGN KEY (created_by) REFERENCES staff_accounts(id);

ALTER TABLE glossary_suggestions
  ADD CONSTRAINT fk_glossary_suggestions_suggested_by
  FOREIGN KEY (suggested_by) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_glossary_suggestions_reviewer
  FOREIGN KEY (reviewer_id) REFERENCES staff_accounts(id);

-- =========================================================================
-- 11. 주요 인덱스
-- =========================================================================

CREATE INDEX idx_events_series          ON events (event_series_id);
CREATE INDEX idx_events_status          ON events (status);
CREATE INDEX idx_events_starts_at       ON events (starts_at);
CREATE INDEX idx_event_schedules_event  ON event_schedules (event_id);
CREATE INDEX idx_event_schedules_starts ON event_schedules (starts_at);

CREATE INDEX idx_tags_group             ON tags (group_id);
CREATE INDEX idx_tags_parent            ON tags (parent_tag_id);

CREATE INDEX idx_collected_docs_source  ON collected_documents (source_id);
CREATE INDEX idx_collected_docs_status  ON collected_documents (status);
CREATE INDEX idx_document_analyses_doc  ON document_analyses (collected_document_id);

CREATE INDEX idx_change_proposals_status ON change_proposals (status);
CREATE INDEX idx_change_proposals_event  ON change_proposals (target_event_id);
CREATE INDEX idx_review_tasks_status     ON review_tasks (status);

CREATE INDEX idx_entity_localizations_lookup ON entity_localizations (entity_type, entity_id);
CREATE INDEX idx_translation_jobs_status     ON translation_jobs (status);

CREATE INDEX idx_staff_sessions_account            ON staff_sessions (staff_account_id);
CREATE INDEX idx_event_organizer_permissions_event ON event_organizer_permissions (event_id);
CREATE INDEX idx_notification_jobs_status           ON notification_jobs (status);
CREATE INDEX idx_storage_links_event                ON storage_links (event_id);
