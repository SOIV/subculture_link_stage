[← 목차](README.md)

# 08. SCLS API 및 ICS 설계

## 8.1 SCLS API 원칙

- 공개 읽기 API와 내부 관리자 API 분리
- API 버전 명시: `/v1`
- locale 파라미터 지원
- UTC 또는 ISO 8601 기준 응답
- 원문 및 번역 출처 표시
- 변경 가능한 문자열보다 안정적인 ID 제공
- 페이지네이션 및 Rate Limit 적용

## 8.2 공개 API 예시

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

## 8.3 응답 예시

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

## 8.4 디스코드 봇 연동 예시

디스코드 봇은 필요에 따라 다음 공개 API를 사용할 수 있다.

```http
GET /v1/events/upcoming
GET /v1/events/{id}
GET /v1/schedules?from=...&to=...
GET /v1/changes?since=...
```

서버별 구독 설정은 디스코드 봇 또는 별도 사용자 서비스에서 저장할 수 있으나, 행사 기준 데이터는 본 서비스에서 관리한다.

## 8.5 OpenAPI 공개 전략

현재 이 서비스 영역의 API가 공식적으로 존재하지 않아, 관심 있는 개발자들이 각자 개인 앱을 만들어 개별적으로 정보를 수집해 쓰고 있는 상태다. 이런 앱들은 대부분 국내(한국) 행사에 한정되어 있고, 캘린더에서 바로 구독 가능한 ICS 피드를 제공하는 서비스는 사실상 없는 수준이라 이 두 지점이 비어 있다. OpenAPI 스펙을 공개하면 "매번 따로 확인하지 않고 한 곳에서 볼 수 있는" 대안이 될 수 있고, 이는 SCLS의 초기 사용자 확보 포인트가 될 수 있다. 시장 차별점 전반은 [01-overview-and-principles.md §1.6](01-overview-and-principles.md#16-운영-형태-및-공개-정책) 참고.

OpenAPI 스펙 공개는 API의 사용법(엔드포인트, 파라미터, 응답 형식)을 공개하는 것이며, 서버 구현 소스코드를 오픈소스로 공개하는 것과는 다르다. 소스 공개 및 개발 참여 정책은 [01-overview-and-principles.md §1.6.3](01-overview-and-principles.md#163-소스-공개-및-참여-정책) 참고.

이에 따라 공개 문서화 일정은 원래 후기 확장(Phase 6) 계획에서 앞당겨졌다.

### 8.5.1 단계별 계획

```text
Phase 1 (Core MVP)
- 공개 읽기 API 라우트 구현
- OpenAPI 스펙은 아직 작성하지 않음

Phase 2 (수집 및 검수)
- 라우트 구현과 동시에 OpenAPI 3.x 스펙 작성 착수
- API Docs 페이지(예: Swagger UI/Redoc 기반) 개발 착수
- 이 시점에는 비공개 상태로 관리자만 접근 (내부 정합성 확인용)

Phase 3 (다국어 번역)
- 번역 파이프라인이 안정화되는 시점에 맞춰
  OpenAPI 스펙과 API Docs 페이지를 전체 공개
- 이 시점부터 외부 개발자는 인증 없이 기본 Rate Limit 내에서 API 사용 가능

Phase 5 (외부 연동 및 자동화)
- 디스코드 봇 연동은 "예제"로 취급 — 이미 공개된 API/Docs를 소비하는
  하나의 사례를 문서화하는 것이지, 이 시점에 처음 API를 공개하는 것이 아님

Phase 6 (운영 확장)
- API Key 발급 체계 및 개발자 콘솔 도입
- 이 단계의 API Key는 "API 접근 자체"가 아니라 기본 Rate Limit보다
  높은 호출 한도, Webhook 구독 등록, 사용량 통계 제공 등 심화 기능을 위한 것
```

### 8.5.2 미결 사항

- 스펙 우선(Spec-first) vs 코드 우선(Code-first, 라우트 주석에서 자동 생성) 방식 중 어느 쪽으로 OpenAPI 스펙을 유지보수할지는 Phase 2 착수 시점에 결정한다.
- Docs 페이지를 별도 서브도메인으로 둘지, `scls-onstage` 내 경로로 둘지는 미정이다.

## 8.6 ICS 및 캘린더 설계

### 8.6.1 기본 피드

```text
/v1/calendars/all.ics
/v1/calendars/kr.ics
/v1/calendars/jp.ics
/v1/calendars/online.ics
/v1/calendars/game.ics
/v1/calendars/concert.ics
/v1/calendars/ticket.ics
```

### 8.6.2 필터 기반 피드

```text
/v1/calendars/custom.ics?country=JP&tags=concert&locale=ko-KR
```

개인화 피드는 사용자 인증 기능 도입 이후 제공한다.

### 8.6.3 일정 표현 원칙

- 행사 본편과 예매 일정을 별도 캘린더 이벤트로 생성 가능
- `schedule_type`을 제목 접두어 또는 카테고리로 표시
- 원래 타임존 보존
- 번역 언어 선택 지원
- 취소 또는 연기 시 UID 유지 및 상태 갱신
- 공식 출처 URL 포함
- 자동 번역 여부를 설명에 표시 가능

---

[← 목차](README.md) · 이전: [07. 관리자 대시보드](07-admin-dashboard.md) · 다음: [09. 검색 및 알림](09-search-and-notifications.md)
