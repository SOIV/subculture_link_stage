[← 목차](README.md)

# 08. SCLS API 및 ICS 설계

> [!NOTE]
> 현재 Private `scls-platform`에서 Phase 1 공개 GET API와 기본 ICS 피드의 초기 구현을 완료했다. 이는 외부 서비스 배포나 OpenAPI 문서 공개 완료를 의미하지 않는다.
> 아래에는 현재 구현과 향후 설계 예시가 함께 있으며, 필터·응답 필드·후기 채널 전체가 구현된 것은 아니다. 구현 근거와 남은 작업은 [로드맵](11-roadmap-and-success.md)을 참고한다.

## 8.1 SCLS API 원칙

- 공개 읽기 API와 내부 관리자 API 분리
- API 버전 명시: `/v1`
- locale 파라미터 지원
- UTC 또는 ISO 8601 기준 응답
- 원문 및 번역 출처 표시
- 변경 가능한 문자열보다 안정적인 ID 제공
- 페이지네이션 및 Rate Limit 적용

### 8.1.1 노출 채널 계층 구조

설계상 목표로 하는 전송 계층은 Pull 1개(API)와 Push 4개(WebSocket · Webhook · Discord · Web Push)이며, 그 외 노출 채널은 모두 이들을 소비하는 클라이언트이거나 포맷 변형이다.

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
  - 위젯 정적 셸은 Onstage와 분리해 별도 서브도메인에 배포하고, 로드된 뒤에는 브라우저가 API/WebSocket에 직접 접속한다(Onstage를 경유하지 않음, [10-infra-ops-security.md §10.1.2](10-infra-ops-security.md#1012-배포-구조-예시)). 세부 라우트·스펙은 아직 미정이며, API/ICS 공개 이후 단계(8.5.1의 Phase 5~6)에서 구체화한다.
  - 임베드하는 쪽 편의를 위해 iframe을 직접 다루는 대신 얇은 JS SDK(`<script>` 로더 + `SCLS.mount(el, options)`)로 감쌀 수 있다. SDK는 렌더링을 직접 하지 않고 iframe 생성·리사이즈(postMessage)·이벤트 콜백만 관리 — 렌더링을 호스트 페이지 DOM에 직접 주입하는 방식은 스타일 충돌 및 XSS 격리 실패 위험 때문에 지양한다.
  - 위젯 라우트를 메인 플랫폼과 분리하는 격리 정책, CSP `frame-ancestors`/CORS 설정, 계정 필수 여부는 [10-infra-ops-security.md §10.3.3](10-infra-ops-security.md#1033-위젯-임베드-격리-정책) 참고
- **Web**: 서비스 자체 프론트엔드도 API를 소비하는 클라이언트 중 하나다. 로그인 사용자 대상 인앱 알림함도 여기 포함 — 별도 Push 채널이 아니라 자신의 `notification_delivery` 이력을 API로 Pull 조회하는 방식([09.5](09-search-and-notifications.md#95-발송-구조) 참고)

새 노출 채널을 추가할 때는 위 전송 계층 중 하나를 재사용하는 것을 기본으로 하고, 별도 전송 방식을 새로 만드는 것은 지양한다.

EMAIL 채널 제외로 생겼던 "일반 웹 사용자의 개인화 알림 공백"(§9.5)은 Web Push(실시간성 필요한 알림) + 인앱 알림함(Pull, 놓친 알림 확인용) 조합으로 메운다.

## 8.2 공개 API 예시

| 구분 | 현재 상태 |
|---|---|
| 구현됨 (Phase 1) | `/v1/events`, `/v1/events/:slug`, `/v1/event-series`, `/v1/schedules`, `/v1/venues`, `/v1/tags`, `/v1/search`, `/v1/health` |
| 구현됨 (행사 목록 필터) | `country`, `tags`, `from`, `to`, `q` |
| 계획/보류 | `/v1/franchises`, `category`/`franchise` 필터 — 대응 데이터 모델 미구현 |

행사 목록 필터를 함께 쓰면 모든 조건을 만족하는 행사만 나온다. 조건별 규칙은 다음과 같다.

- `tags`: 쉼표로 구분한 태그 slug. **같은 태그 그룹의 태그끼리는 "또는", 서로 다른 그룹 사이는 "그리고"** 로 처리한다(예: `tags=exhibition,paid`는 행사 형식이 전시이면서 티켓 방식이 유료인 행사). 상위 태그(예: 전시)를 고르면 그 하위 태그(산업 전시 등)가 붙은 행사도 포함한다. 존재하지 않는 태그만 넘기면 결과가 없다.
- `q`: 행사 이름 검색어. 모든 언어의 제목과 slug에서 부분 일치(대소문자 무시)로 찾으므로 화면 언어와 다른 언어로 검색해도 찾아진다.

언어(`locale`: `ko`·`ja`·`en`, 기본 `ko`)는 행사 제목·요약·설명뿐 아니라 응답 안의 장소 이름(`venue.name`)과 주최 이름(`organizers[].name`)에도 적용한다. 그 언어의 번역(`entity_localizations`)이 없으면 기준 이름(`canonicalName`)으로 대신한다. 장소 주소(`venue.address`)도 요청 언어의 번역 주소가 있으면 그것을 주고, 없으면 `ko`는 기준 주소(`venues.address`, 현지 표기)를, 그 밖의 언어는 영어 주소를 거쳐 기준 주소를 준다(기준 주소가 한국어인 장소를 일본어 화면에서 한국어로 보여주지 않기 위해서다). 구독(ICS)의 장소 이름과 "자동 번역 포함" 안내 문구도 같은 `locale`을 따른다.

티켓 판매 정보는 다음과 같이 준다. 행사 상세(`/events/:slug`)에는 `ticket`이 들어 있어 권종·가격(`types[]`: `name`, `prices`(통화 코드 → 금액, 예: `{"KRW":329000,"JPY":35000}`), `note`)과 예매처(`channels[]`: `name`, `url`, `audience`, `note`)를 표시 순서대로 준다. 일정(`schedules[]`, `/v1/schedules`도 동일)에는 같은 종류의 일정을 구별하는 짧은 이름 `title`과 판매 대상 `audience`(`DOMESTIC`·`OVERSEAS`, `null`이면 전체)가 붙는다. 이름·메모는 `locale`의 번역을 쓰고 없으면 기준 이름이다. 구독(ICS)의 일정 제목에도 일정 이름이 붙는다. `OVERSEAS`는 개최국 기준이다(일본 행사에서는 한국이 해외다).

아래는 설계 기준 예시다. 행사 상세의 설계상 `{eventId}` 표기와 달리 현재 구현은 `:slug`로 조회한다. `locale` 등 나머지 파라미터와 응답 필드의 실제 지원 범위는 구현 및 향후 OpenAPI 문서에서 확인해야 한다.

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

다국어·번역 필드를 포함한 목표 응답 형식의 예시다. 현재 title/summary는 `entity_localizations`에서 조회하지만 Localizations CRUD API/UI가 미완료여서 대부분 null이며, 아래 예시 전체가 현재 응답 계약이라는 의미는 아니다.

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

디스코드 봇 연동 시 활용할 API의 설계 예시다. `/v1/events/upcoming`과 `/v1/changes`는 현재 구현 완료 목록에 포함되지 않은 계획이며, 행사 상세의 현재 식별자는 §8.2를 참고한다.

```http
GET /v1/events/upcoming
GET /v1/events/{id}
GET /v1/schedules?from=...&to=...
GET /v1/changes?since=...
```

서버별 구독 설정은 디스코드 봇 또는 별도 사용자 서비스에서 저장할 수 있으나, 행사 기준 데이터는 본 서비스에서 관리한다.

### 8.4.1 커스터마이징 가능한 외부 소비를 고려한 설계 방향

디스코드 봇처럼 알림을 자체 채널에 맞게 재구성해서 보여주는 소비자가 있다는 전제를 API 설계에 반영해 둔다.

- 알림 문구를 완성된 텍스트로 내려주기보다 구조화된 필드(행사명·요약·일정·장소·태그·공식 URL 등)를 우선 제공한다. 소비자가 자신의 채널 포맷(예: Discord Embed)에 맞게 자유롭게 재구성할 수 있어야 하며, 이는 §8.3 응답 구조 방향과 일치한다.
- [§9.3](09-search-and-notifications.md#93-알림-유형)의 `notification_type` 12종은 외부 소비자가 유형별로 필터링·커스터마이징하는 것을 전제로 안정적인 공개 계약으로 유지한다. 값 추가는 가능하되, 기존 값의 의미 변경이나 제거는 하위 호환을 깨는 것으로 취급한다.
- `/v1/changes` 계약을 확정할 때는 각 항목이 어떤 `notification_type`/변경 종류에 해당하는지 식별 가능한 필드를 포함한다. 그래야 외부 소비자가 SCLS 쪽 구독 등록 없이도 자체적으로 유형별 라우팅을 할 수 있다.
- 이 방향은 SCLS가 "구조화된 데이터 제공"까지만 책임지고 메시지의 표현(색상·문구·포맷)은 전적으로 소비자 재량에 맡기는 느슨한 결합 원칙([§1.6](01-overview-and-principles.md#16-운영-형태-및-공개-정책))과 일치한다.

## 8.5 OpenAPI 공개 전략

관심 있는 개발자들이 개인 앱에서 행사 정보를 개별 수집해 쓰는 경우가 있다. 일본·해외 행사까지 통합적으로 다루는 API와 캘린더에서 바로 구독 가능한 통합 ICS 피드 서비스는 제한적이다. OpenAPI 스펙을 공개하면 "매번 따로 확인하지 않고 한 곳에서 볼 수 있는" 대안이 될 수 있고, 이는 SCLS의 초기 사용자 확보 포인트가 될 수 있다. 시장 차별점 전반은 [01-overview-and-principles.md §1.6](01-overview-and-principles.md#16-운영-형태-및-공개-정책) 참고.

OpenAPI 스펙 공개는 API의 사용법(엔드포인트, 파라미터, 응답 형식)을 공개하는 것이며, 서버 구현 소스코드를 오픈소스로 공개하는 것과는 다르다. 소스 공개 및 개발 참여 정책은 [01-overview-and-principles.md §1.6.3](01-overview-and-principles.md#163-소스-공개-및-참여-정책) 참고.

이에 따라 공개 문서화 일정은 원래 후기 확장(Phase 6) 계획에서 앞당겨졌다.

### 8.5.1 단계별 계획

```text
Phase 1 (Core MVP)
- 공개 읽기 API 라우트와 기본 ICS 피드 초기 구현 완료 (§8.2, §8.6 범위)
- OpenAPI 스펙은 아직 작성하지 않음

Phase 2 (수집 및 검수)
- Phase 1 구현 라우트 및 추가 라우트를 기준으로 OpenAPI 3.x 스펙 작성 착수
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
- API 문서는 이 공식 공개 Repository에서 관리할 예정이다. Subculture Onstage 내 developer/API docs route로 둘지 별도 docs deployment로 둘지와 서브도메인 구성은 미정이다.
- 문서 사이트 도구는 미정이다. Fumadocs(OpenAPI 공식 패키지 제공)를 우선 검토하고 Starlight를 대안으로 두며, 확정은 Phase 2 OpenAPI 작업 착수 시점에 한다.

## 8.6 ICS 및 캘린더 설계

### 8.6.1 기본 피드

| 구분 | 현재 상태 |
|---|---|
| 구현됨 (Phase 1) | `all.ics`, `online.ics`, 국가 코드 기반 피드(`kr.ics`/`jp.ics` 등), `custom.ics`의 `country`/`tags`/`from`/`to` 필터 |
| 계획 | `game.ics`, `concert.ics`, `ticket.ics` 등 카테고리별 고정 피드와 작품별 피드 |

현재 구현은 VTIMEZONE 블록 없이 TZID를 사용하는 최소 형태이며, 캘린더 클라이언트 호환성 확인은 별도로 필요하다(개선 목표는 [§8.6.5](#865-피드-품질-목표), 앱별 구독 방식은 [§8.6.4](#864-캘린더-앱별-구독-방식)). 아래 경로 목록에는 계획 중인 피드도 포함한다.

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

`locale`(`ko`·`ja`·`en`, 기본 `ko`)로 일정 제목·장소 이름·안내 문구의 언어를 고른다(구현됨, [§8.2](#82-공개-api-예시) 참고). `country`/`tags`/`from`/`to` 조건은 [§8.2](#82-공개-api-예시)의 행사 목록 필터와 같은 규칙(`tags`는 같은 그룹 "또는", 그룹 사이 "그리고")으로 처리해 Onstage 화면에서 고른 조건과 구독 결과가 일치한다. 검색어 `q`는 받지 않는다. 개인화 피드는 사용자 인증 기능 도입 이후 제공한다.

### 8.6.3 일정 표현 원칙

- 행사 본편과 예매 일정을 별도 캘린더 이벤트로 생성 가능
- `schedule_type`은 사람이 읽는 일정 종류 이름(언어별)으로 제목에 표시한다. 같은 종류의 일정(국내·해외 티켓 판매 등)은 일정 이름을 붙여 구별한다(현재 구현은 내부 코드를 그대로 쓴다 — 아래 §8.6.5)
- 원래 타임존 보존
- 번역 언어 선택 지원
- 취소 또는 연기 시 UID 유지 및 상태 갱신
- 공식 출처 URL 포함
- 자동 번역 여부를 설명에 표시 가능

### 8.6.4 캘린더 앱별 구독 방식

일반 `https://…/all.ics` 링크를 누르면 대부분의 기기에서 **파일을 내려받아 한 번 추가하는 방식(일회성 가져오기)** 이 되어, 이후 일정이 바뀌어도 반영되지 않는다. "구독"은 캘린더 앱이 주소를 기억하고 주기적으로 다시 읽어 오는 것이므로, 앱마다 다른 구독 링크를 써야 한다. 아래는 설계 기준이며 실제 기기에서의 동작은 만든 뒤 확인한다.

| 앱 | 한 번에 구독하는 링크 | 직접 추가하는 방법 |
|---|---|---|
| Apple 캘린더(iPhone·iPad·Mac) | `webcal://{호스트}/v1/calendars/all.ics` — 누르면 캘린더 앱이 구독 여부를 묻는다 | iPhone: 설정 > 캘린더 > 계정 > 계정 추가 > 기타 > 구독 캘린더 추가 / Mac: 캘린더 > 파일 > 새로운 캘린더 구독 |
| Google 캘린더 | `https://calendar.google.com/calendar/r?cid={webcal 주소를 URL 인코딩}` — 웹에서 열려 추가를 묻는다 | 웹 설정 > 캘린더 추가 > URL로 추가(모바일 앱에는 없고 웹에서 추가하면 동기화된다) |
| Outlook(웹) | `https://outlook.live.com/calendar/0/addfromweb?url={https 주소를 URL 인코딩}&name={캘린더 이름}` | 캘린더 추가 > 웹에서 구독 |
| 그 밖의 앱 | 주소 복사 | 앱의 "URL로 구독" |

- Onstage의 구독 버튼은 "Apple 캘린더 / Google 캘린더 / Outlook / 주소 복사 / 파일 받기(한 번만 추가)"를 고르는 메뉴로 만든다. 접속한 기기가 iPhone·Mac이면 Apple을 맨 위에 둔다.
- 구독은 "실시간"이 아니라 앱이 주기적으로 다시 읽어 오는 방식이다. 갱신 주기는 앱이 정한다: Apple은 사용자가 고를 수 있고(분 단위~주 단위), Google은 보통 12~24시간 간격으로 고정이며, Outlook은 몇 시간 간격이다.
- 일정 안에 넣은 알림(`VALARM`)은 Apple 캘린더 등에서는 구독 중에도 동작하지만, **Google 캘린더는 파일 안의 알림을 무시**하고 캘린더별 기본 알림 설정을 따른다. 그래서 Google 사용자에게는 구독한 캘린더의 알림을 Google 설정에서 직접 지정해야 한다고 안내가 필요하다(웹 검색으로 확인한 내용이며 실제 기기 확인 전이다).

### 8.6.5 피드 품질 목표

| 항목 | 현재 구현 | 목표 |
|---|---|---|
| 일정 제목 | `[EVENT_START] 행사명 @ 장소`처럼 내부 코드가 보인다 | 행사명 + 일정 종류 이름(언어별) + 일정 이름(국내·해외 판매처 등) |
| 장소 | 제목 끝에 붙인다 | `LOCATION` 필드(장소 이름·주소, 언어별) |
| 시간대 | `TZID`만 쓴다(`VTIMEZONE` 없음) | `VTIMEZONE`을 포함하거나 UTC로 변환해 Outlook 등에서도 시간이 틀어지지 않게 한다 |
| 알림 | 없음 | 티켓 오픈·추첨 같은 일정에 알림(`VALARM`)을 넣는다(기본값: 하루 전과 1시간 전, 이후 사용자 지정 지원 예정). Google 캘린더는 무시한다 |
| 갱신 주기 안내 | 없음 | `REFRESH-INTERVAL`·`X-PUBLISHED-TTL`(참고하는 앱에 한함) |
| 설명 | 자동 번역 안내만 | Onstage 상세 링크, 티켓 판매처·가격 요약(선택) |

---

[← 목차](README.md) · 이전: [07. 관리자 대시보드](07-admin-dashboard.md) · 다음: [09. 검색 및 알림](09-search-and-notifications.md)
