[← 목차](README.md)

# 06. 다국어, 번역, 용어집, 사용자 기여

## 6.1 다국어 및 번역 설계

### 6.1.1 지원 언어

초기 기본 지원 언어:

- `ko-KR`
- `ja-JP`
- `en-US` 또는 공통 `en`

### 6.1.2 번역 대상

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

### 6.1.3 번역 출처 및 상태

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

### 6.1.4 번역 처리 흐름

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

### 6.1.5 원문 수정과 번역 리비전

원문에는 콘텐츠 해시와 리비전을 부여한다.

번역은 생성 당시의 원문 리비전을 참조한다.

```text
원문 revision 4 → 번역 source_revision 4
원문 revision 5 생성 → 기존 번역 OUTDATED 처리
```

변경 부분만 재번역할 수 있도록 필드 또는 문단 단위 해시를 장기적으로 검토한다.

### 6.1.6 예상 데이터 증가

행사 텍스트가 세 언어로 확장되면 텍스트 레코드와 검색 인덱스가 크게 증가한다.

- 원문 및 공개 번역문: 약 2~3배
- 번역 상태·리비전·검수 이력: 추가 증가
- 언어별 전문 검색 인덱스: 추가 증가
- 언어별 임베딩 생성 시 추가 증가

텍스트 관련 저장 공간은 원문 단일 언어 대비 약 2.5~4배까지 증가할 수 있다. 다만 서비스 전체 스토리지에서 이미지와 원본 스냅샷 비중이 높으면 전체 용량이 동일 비율로 증가하는 것은 아니다.

## 6.2 용어집 및 고유명사 관리

### 6.2.1 필요성

일반 번역 모델은 다음 항목을 일관되게 처리하기 어렵다.

- 작품의 국내 정식 명칭
- 일본 인명 독음
- 캐릭터 및 성우 이름
- 밴드·유닛명
- 공연장 공식 영문명
- 일본 티켓 및 좌석 용어
- 번역하지 않아야 하는 브랜드명

### 6.2.2 용어집 구조

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

### 6.2.3 적용 범위

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

### 6.2.4 예시

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

## 6.3 사용자 번역 수정 요청 및 용어 제안

### 6.3.1 초기 운영 방식

초기에는 사용자가 공개 번역문을 직접 수정하지 못한다.

사용자는 다음 기능을 사용할 수 있다.

- 특정 번역 문장 수정 요청
- 누락·오역 신고
- 공식 명칭 근거 제출
- 새로운 용어집 항목 제안
- 기존 제안에 동의 또는 추가 근거 작성

### 6.3.2 번역 수정 요청 흐름

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

### 6.3.3 용어집 제안 흐름

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

### 6.3.4 권한 단계

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

> **참고**: 이 권한 단계(신뢰 기여자 등)는 "관심 있는 사람들을 데려다 실습시켜본다"는 초기 협업 구상과 자연스럽게 맞물린다. 실습 참여자를 신뢰 기여자/번역 검수자 등급에 매핑하면 "제안까지만 하고 최종 반영은 관리자(본인)가 한다"는 경계를 처음부터 명확히 둘 수 있다. 여기서 다루는 번역·용어집 기여는 웹 서비스 내에서 누구나 제출 가능한 공개 트랙이며, 코드·인프라 등 개발·운영 참여(비공개 트랙)와는 구분된다 — [01-overview-and-principles.md §1.6.3](01-overview-and-principles.md#163-소스-공개-및-참여-정책) 참고.

---

[← 목차](README.md) · 이전: [05. 오브젝트 스토리지 및 수집 파이프라인](05-storage-and-collection.md) · 다음: [07. 관리자 대시보드](07-admin-dashboard.md)
