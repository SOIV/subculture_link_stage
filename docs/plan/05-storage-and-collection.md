[← 목차](README.md)

# 05. 오브젝트 스토리지, 수집 소스 및 분석 파이프라인

## 5.1 오브젝트 스토리지 설계

### 5.1.1 저장 대상

- 공식 웹페이지 HTML 스냅샷
- SNS API 또는 RSS 원본 JSON/XML
- 공식 포스터 및 썸네일
- 일정표·행사장 지도 등 검수에 필요한 이미지
- 파싱 실패 원본
- 장기 보관용 압축 자료

영상 원본과 행사와 무관한 SNS 첨부파일은 기본적으로 저장하지 않는다.

### 5.1.2 DB와 스토리지 역할 분리

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

### 5.1.3 스토리지 후보

- Cloudflare R2
- AWS S3
- Supabase Storage
- MinIO

초기에는 Cloudflare 사용 환경과 S3 호환성을 고려하여 R2를 우선 후보로 둔다.

## 5.2 수집 소스 및 행사 프로필

### 5.2.1 행사별 수집 프로필

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

> **리스크 메모 — SNS 수집 가능성**: X(Twitter)와 Instagram은 공식 API 접근이 유료화·제한되어 있고 약관상 자동 수집이 제한되는 경우가 많다. `sources.terms_note` 필드가 있는 이유가 이것이며, [11-roadmap-and-success.md](11-roadmap-and-success.md)의 Phase 0에 있는 "초기 수집 출처 및 이용 조건 확인"이 이 리스크를 미리 검증하기 위한 항목이다. X/Instagram 자동 수집이 막힐 경우 공식 홈페이지·RSS·수동 제보 위주로 Phase 2~3 범위를 조정해야 한다.

### 5.2.2 수집 규칙

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

### 5.2.3 과거 데이터 활용

과거 행사에서 승인된 공지와 거절된 공지를 보존한다.

신규 수집 문서는 다음 기준으로 비교한다.

- 승인 데이터와의 의미 유사도
- 거절 데이터와의 의미 유사도
- 행사명·장소·출연자·날짜 매칭
- 출처 신뢰도
- 과거 행사 공지 순서와 패턴
- 포함·제외 키워드

초기에는 규칙 기반 분류와 임베딩 검색을 사용하고, 충분한 정답 데이터가 쌓인 후 별도 분류 모델 학습을 검토한다.

## 5.3 수집 및 분석 파이프라인

### 5.3.1 기본 흐름

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

### 5.3.2 후보 처리 유형

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

### 5.3.3 자동화 단계

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

### 5.3.4 신뢰도 예시

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

[← 목차](README.md) · 이전: [04. 데이터베이스 설계](04-database-design.md) · 다음: [06. 다국어, 번역, 용어집](06-i18n-translation-glossary.md)
