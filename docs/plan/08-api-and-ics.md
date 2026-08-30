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

### 8.1.1 노출 채널 계층 구조

서비스가 지원하는 실제 전송 계층은 Pull 1개(API)와 Push 4개(WebSocket · Webhook · Discord · Web Push)이며, 그 외 노출 채널은 모두 이들을 소비하는 클라이언트이거나 포맷 변형이다.

```text
[전송 계층]
  Pull   API
  Push   WebSocket (지속 연결·실시간) · Webhook (구독자 콜백 URL) · Discord (봇/자체 웹훅) · Web Push (브라우저 구독)
                       │
                       ▼
[포맷/클라이언트]  ICS · Web(+인앱 알림함) · iFrame(embed/overlay/ambient)
```

- **ICS**: API 응답을 캘린더 앱이 구독 가능한 포맷으로 직렬화한 것. 별도 전송 방식이 아니라 API의 특수 응답 포맷에 가깝다. 상세: 8.6
- **Discord**: 알림 발송 채널 중 하나로 09.5 발송 구조에 병렬 채널로 정의됨. 봇이 API를 조회하는 방식과, 알림을 직접 수신하는 방식 모두 08.4/09.5 참고
- **Webhook**: 외부 구독자가 등록한 콜백 URL로 알림을 발송. Phase 6(8.5.1)의 "Webhook 구독 등록"과 연결
- **Web Push**: 브라우저 Push API 구독. 구조적으로는 Webhook과 동일(구독자가 내준 엔드포인트로 POST)하되, 엔드포인트를 브라우저가 발급한다는 점만 다르다. `web_push_subscriptions` 테이블([database/schema.sql](database/schema.sql)) 참고
- **iFrame 위젯**: API/WebSocket을 렌더링만 해주는 얇은 표면. 임베드 대상에 따라 용도가 갈린다.
  - `embed`: 팬사이트·블로그 등에 삽입하는 캘린더/일정 리스트
  - `overlay`: OBS 브라우저 소스 등, 이벤트 트리거 시에만 표시되는 알림
  - `ambient`: Corsair Xeneon Edge류 세컨드 디스플레이처럼 상시 노출되는 요약/카운트다운. 마우스 hover가 없는 터치 입력 환경이므로 hover 의존 UI 금지, 탭 타겟은 충분히 크게, `touchstart`/`pointerdown` 기반 처리
  - 라우트·스펙은 아직 미정이며, API/ICS 공개 이후 단계(8.5.1의 Phase 5~6)에서 구체화한다.
  - 임베드하는 쪽 편의를 위해 iframe을 직접 다루는 대신 얇은 JS SDK(`<script>` 로더 + `SCLS.mount(el, options)`)로 감쌀 수 있다. SDK는 렌더링을 직접 하지 않고 iframe 생성·리사이즈(postMessage)·이벤트 콜백만 관리 — 렌더링을 호스트 페이지 DOM에 직접 주입하는 방식은 스타일 충돌 및 XSS 격리 실패 위험 때문에 지양한다.
  - 위젯 라우트를 메인 플랫폼과 분리하는 격리 정책, CSP `frame-ancestors`/CORS 설정, 계정 필수 여부는 [10-infra-ops-security.md §10.3.3](10-infra-ops-security.md#1033-위젯-임베드-격리-정책) 참고
- **Web**: 서비스 자체 프론트엔드도 API를 소비하는 클라이언트 중 하나다. 로그인 사용자 대상 인앱 알림함도 여기 포함 — 별도 Push 채널이 아니라 자신의 `notification_delivery` 이력을 API로 Pull 조회하는 방식([09.5](09-search-and-notifications.md#95-발송-구조) 참고)

새 노출 채널을 추가할 때는 위 전송 계층 중 하나를 재사용하는 것을 기본으로 하고, 별도 전송 방식을 새로 만드는 것은 지양한다.

EMAIL 채널 제외로 생겼던 "일반 웹 사용자의 개인화 알림 공백"(§9.5)은 Web Push(실시간성 필요한 알림) + 인앱 알림함(Pull, 놓친 알림 확인용) 조합으로 메운다.

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
