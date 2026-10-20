[← 목차](README.md)

# 10. 인프라, 데이터 보관, 보안, 운영 모니터링

> [!NOTE]
> 본 문서는 공개 가능한 설계 및 운영 정책을 다룬다. 실제 credential, API key, secret, token, DB connection string, 운영 접속 정보, origin IP, SSH 정보 등 실제 접근에 사용 가능한 민감정보는 별도 비공개 설정에서 관리한다.
> 아래 운영 정책과 예정 스택 전체가 현재 적용되었다는 의미는 아니며, 구현 현황은 [로드맵](11-roadmap-and-success.md)을 참고한다.

## 10.1 인프라 및 기술 스택

### 10.1.1 권장 기술 스택

| 영역 | 권장안 | 비고 |
|---|---|---|
| Backend | Node.js + TypeScript + Fastify | Private API 초기 구현에 사용 |
| Backstage | React + Vite + TanStack Router/Query + Tailwind v4 | Private 관리자 UI 초기 구현에 사용, ko/en/ja (`i18next`) |
| Onstage | Svelte/SvelteKit | 이 공개 Repository(`apps/onstage`)에서 개발 중, 임시 도메인으로 초기 배포 |
| DB | PostgreSQL (Supabase) | 초기 제공자 확정, 비용 부담 시 자체 호스팅 이전 검토 |
| ORM | Prisma | Private `scls-platform`에 Phase 1 schema/migration 적용 |
| Queue | Redis + BullMQ | 수집·번역·알림 Worker |
| Storage | Cloudflare R2 / S3 | 원본 및 이미지 |
| Search | PostgreSQL FTS | 설계상 초기 검색 방향, 현재 공개 검색 API 초기 구현 범위는 로드맵 참고 |
| Vector | pgvector | 데이터 축적 후 도입 |
| ICS | 최소 RFC 5545 피드 구현 / ical-generator (라이브러리 후보) | 피드 초기 구현 완료, 라이브러리 채택 여부는 현재 문서에서 확정하지 않음 |
| Monitoring | Sentry + Metrics | 초기 무료/저비용 플랜 |
| CDN/DNS | Cloudflare | 기존 환경 활용 |

초기 DB 제공자는 Supabase다. 이전 가능성을 유지하기 위해 Auth·Realtime 등 제공자 전용 기능 대신 표준 PostgreSQL 기능 위주로 설계한다. 비용 부담이 커지면 자체 호스팅 PostgreSQL 이전을 검토한다. 선택 배경과 당시 비용 검토는 [인프라 결정 기록](../devlog/auth-and-infrastructure-history.md)에 보관한다.

### 10.1.2 배포 구조 예시

```text
Cloudflare
- DNS
- CDN
- R2
- WAF / Rate Limit

Web Hosting (Onstage / Backstage / 위젯 셸)
- Cloudflare Workers

API / Worker
- Fly.io 도쿄(nrt) 리전

Database
- Supabase (초기 제공자 — §10.1.1)

Queue
- Managed Redis 또는 소형 자체 Redis
```

**호스트 구성** (호스트명은 `scls.app`을 가정한 예시이며 실제 도메인·서브도메인은 확정 전이다)

| 호스트 | 용도 | 배포 |
|---|---|---|
| `scls.app` | Subculture Onstage | Cloudflare (SvelteKit) |
| `backstage.scls.app` | Subculture Backstage | Cloudflare Workers (정적 SPA + `/admin/*` 프록시) |
| `widget.scls.app` | iFrame 위젯 정적 셸 | Cloudflare (정적) |
| `api.scls.app` | 공개 REST API + 실시간(WS/SSE) 경로 | Fly.io 도쿄, 앞단 Cloudflare |

서버 프로세스는 `api`(와 Worker/Scheduler)뿐이며, 나머지 세 호스트는 Cloudflare의 정적/엣지 배포라 추가 서버 비용이 없다.

**프론트엔드 호스팅**

Onstage·Backstage는 Cloudflare Workers에 배포한다. Backstage는 정적 SPA와 `/admin/*` 프록시를 함께 두고, Onstage는 `adapter-cloudflare`로 배포한다. 위젯 셸도 Cloudflare에 둘 계획이다. Workers에서는 공개 API `fetch` 위주로 유지하고 Node 전용 라이브러리 의존을 지양하며, 이 조건을 유지할 수 없으면 호스팅을 재검토한다.

**위젯 호스트 — 계획**

위젯 정적 셸은 Onstage·API와 분리한 `widget.*`에서 제공한다. 브라우저는 CDN에 캐시된 셸을 로드한 뒤 API/WS에 직접 연결하고, Onstage 설정 화면은 임베드 코드만 만든다. API와 같은 오리진에 렌더링 페이지를 두지 않는다 ([격리 정책](#1033-위젯-임베드-격리-정책)).

**실시간 연결 — 계획**

- WS/SSE는 API의 별도 경로로 제공한다(예: `/v1/stream`, 실제 경로는 외부 클라이언트 도입 전에 확정).
- API는 상시 연결이 가능한 컨테이너/VPS로 운영하며 요청 단위 서버리스·유휴 자동 종료를 사용하지 않는다.
- REST 공개 GET에는 짧은 `Cache-Control`과 Cloudflare 캐시 규칙을 적용하고, 스트림 경로는 캐시를 우회한다. API JSON은 Cloudflare 기본 캐시에 의존하지 않는다.
- 부하가 커지면 URL을 유지하면서 스트림 경로만 다른 origin으로 분리하는 방안을 검토한다. 플랜·한도는 그때 확인한다.
- 배포·재시작에 대비해 SDK·위젯에 지수 백오프와 지터를 적용한 자동 재연결을 둔다.
- embed/ambient는 캐시된 GET 폴링과 클라이언트 카운트다운을 기본으로 하고, 상시 연결은 overlay 등 필요한 경우로 한정한다.

**Backstage ↔ API 프록시·보안**

Backstage는 `/admin/*`를 상대 경로로 호출하고, Cloudflare Worker가 이 경로만 API origin으로 전달한다. 개발 Vite proxy와 같은 구조로, 관리자 쿠키는 `backstage.*`에서만 사용한다.

- **접근 제한:** API는 프록시의 공유 시크릿이 확인된 `/admin` 요청만 수락한다. 시크릿이 없는 운영 환경은 모든 관리자 요청을 거부한다. 별도 WAF 차단에 의존하지 않는다.
- **Origin 검증:** POST/PUT/PATCH/DELETE의 Origin을 Backstage 허용 목록과 대조하고, 불일치는 403으로 거부한다. Backstage 도메인을 추가·변경하면 이 목록도 갱신한다. 같은 사이트의 `widget.*`를 SameSite만으로 구분하지 않는다.
- **로그인 요청 제한:** 프록시가 전달한 방문자 IP는 공유 시크릿이 검증된 관리자 요청에서만 신뢰한다.
- **Worker 설정:** API 주소는 코드의 일반 설정, 공유 시크릿은 Secret으로 관리한다. Wrangler 배포에 의해 일반 변수가 덮어써질 수 있으므로 API 주소를 대시보드 변수에만 두지 않는다. 실제 API에 연결되는 `preview_urls`는 만들지 않는다.
- **요청 수:** 정적 자산은 Worker 요청 수에 포함되지 않는 구성으로 두며, `/admin/*` 요청이 플랜 한도에 들어오는지는 정식 운영 때 확인한다.
- **향후 외부 IdP:** 소셜·SSO 콜백도 `backstage.*` 아래에 둔다.

**Fly.io API·Worker 운영**

API·Worker·Scheduler는 Supabase와 같은 도쿄(`nrt`) 리전에 둔다. 개발·테스트 중 API 머신은 1대로 유지하고, **정식 공개 때 2대로 늘린다**. Cloudflare의 Onstage·Backstage와 달리 Fly 머신 수는 직접 관리한다.

- API 2대는 도쿄에 두어 롤링 배포·머신 장애 시 요청을 이어받는다.
- 관리자 로그인 분당 10회·공개 `/v1` 분당 600회의 메모리 기반 요청 제한은 머신별로 집계된다. 실질 한도가 머신 수만큼 늘어나는 오차는 감수하며, 엄격한 전역 집계가 필요해지면 Redis 등 공유 저장소를 검토한다. 계정 잠금은 DB의 `locked_until`로 공유한다.
- Phase 2 수집 Worker·Scheduler는 API와 별도 프로세스 그룹으로 분리해 머신 증가로 작업이 중복 실행되지 않게 한다.
- 머신 증설 절차와 `deploy:api`의 `--ha=false` 옵션 처리는 릴리즈 때 Fly 문서를 확인하여 정한다. 증설 후 청구서를 비용 상한 판단에 반영한다.
- 서비스별 Dockerfile·`fly.toml`을 두며 수동은 `fly deploy`, 자동은 GitHub Actions의 `flyctl deploy --remote-only`를 사용한다. 배포 토큰은 `FLY_API_TOKEN` Secret으로 관리한다. Fly 대시보드의 Launch from GitHub는 사용하지 않는다.
- Monorepo 루트를 빌드 컨텍스트로 두고 `--config`·`--dockerfile`로 앱 파일을 지정한다. 공유 패키지가 TS 소스를 가리키므로 컨테이너는 `tsx`로 실행하며 `.env`는 이미지에서 제외한다.
- DB 런타임은 IPv4 풀러, migration은 IPv6 직접 연결 주소를 사용한다. Prisma 풀러 모드의 세부 설정은 부하가 생기면 다시 확인한다.
- Fly는 유휴 상태에도 상시 머신 비용이 발생하며, 배포·재시작 시 실시간 연결은 재연결해야 한다.

선택 대안·당시 비용 추정·초기 배포 확인·머신 확장 결정 과정은 [인증·인프라 기록](../devlog/auth-and-infrastructure-history.md)에 보관한다.

> **절차 — API 커스텀 도메인 연결 (Fly + Cloudflare 프록시)**: API 도메인이 확정되면 Fly 공식 권장 구성(Cloudflare 프록시 + Full (strict))에 따라 다음 순서로 연결한다.
>
> 1. Fly에 도메인을 등록한다(`fly certs add <API 호스트>`). 이어서 `fly certs setup`이 알려 주는 소유권 확인용 TXT 레코드(`_fly-ownership`)를 Cloudflare DNS에 추가한다.
> 2. Cloudflare DNS에 API 호스트의 `A`·`AAAA`(또는 `CNAME`) 레코드를 Fly 앱 주소로 추가하고 프록시(주황 구름)를 켠다. 앞단 Cloudflare 구성([호스트 표](#1012-배포-구조-예시))과 캐시 규칙 적용을 위한 것이다.
> 3. Cloudflare SSL/TLS 모드를 Full (strict)로, Always Use HTTPS를 켠다. 이후 Fly가 인증서를 자동 발급하며 `fly certs check`로 진행을 확인한다. 발급이 실패하면 Cloudflare Origin Certificate 가져오기를 검토한다.
> 4. Backstage 프록시는 기존 Fly 주소를 계속 쓰므로 바꾸지 않는다(`/admin/*`는 `api.*`로 받지 않는다). Backstage 허용 Origin 목록도 API 도메인과 무관하다.
> 5. 공개 `/v1`의 GET·HEAD·OPTIONS는 현재 모든 오리진(`*`)을 허용하고, `/admin`은 별도 Origin 허용 목록을 유지한다. 위젯용 CORS 최종 정책은 [§10.3.3](#1033-위젯-임베드-격리-정책)에서 확정한다. 공개 요청 제한은 이미 구현되어 있다 ([§10.3.2](#1032-기본-정책)). Cloudflare 프록시를 새로 연결할 때도 실제 방문자 IP 전달·신뢰 범위와 요청 제한 동작을 확인한다.

> **미결 사항 — 작업 대기열(Queue)**: Worker가 필요해지는 Phase 2 착수 때 정한다. 후보는 Redis(BullMQ)를 Fly에 볼륨과 함께 직접 띄우는 방식, 관리형 Redis(Upstash 고정 플랜 등), Supabase Postgres 기반 대기열(pg-boss 등)로 Redis 없이 가는 방식이다. Phase 1에는 필요하지 않다.

### 10.1.3 무료 운영 원칙 수정

무료 운영을 기본으로 하며, 부분 유료화와 Onstage 광고는 검토 중이다. 운영비는 후원을 기반으로 마련한다. 수익이 생겼을 때의 사용처는 [§1.6.2 운영 형태](01-overview-and-principles.md#162-운영-형태)를 따른다. 변경 과정은 [Phase 0 기록](../devlog/phase-0-planning-and-design.md)에 보관한다.

초기에는 무료 티어와 저비용 서비스를 활용하되 다음 비용을 고려한다.

- PostgreSQL 저장 용량
- R2/S3 저장 용량
- 수집 Worker 실행 시간
- 번역 API 또는 LLM 비용
- 임베딩 생성 비용
- Redis 및 Queue
- 외부 SNS API 비용

비용 절감을 위해 번역 전 필터링, 변경 부분만 재처리, 이미지 선별 보관, 데이터 압축 및 보관 정책을 적용한다.

> **미결 사항 — 비용 상한선**: 현재 문서에는 "비용을 고려한다"는 방향만 있고, 월 예산 상한이나 "이 이상 넘으면 번역/수집 빈도를 줄인다" 같은 구체적인 트리거는 없다. 1인 운영 초기 단계에서는 실제 청구서를 몇 달 지켜본 뒤 상한을 정하는 편이 현실적이므로, 별도로 값을 정하기 전까지는 의도적인 미결 상태로 둔다.

## 10.2 데이터 용량 및 보관 정책

### 10.2.1 용량 증가 요인

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

### 10.2.2 보관 등급

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

### 10.2.3 압축 및 중복 제거

- 콘텐츠 해시 기반 중복 제거
- HTML, JSON, XML 압축 저장
- 이미지 원본과 썸네일 분리
- 동일 포스터 재사용 시 Storage Object 참조 공유
- 변경 없는 페이지는 새 파일을 만들지 않고 확인 시각만 갱신

## 10.3 보안 및 권한

### 10.3.1 역할

전역 역할(내부 운영자 대상):

```text
ADMIN
DATA_REVIEWER
TRANSLATION_REVIEWER
TRUSTED_CONTRIBUTOR
USER
SERVICE_CLIENT
```

event_id 단위로 스코프되는 권한(행사 측 담당자 대상, 전역 역할과 별도 매핑 테이블로 관리):

```text
EVENT_ORGANIZER_REP  (행사 관리자 대표 — 하위 계정 조회·제거만 가능, 등록 불가)
EVENT_ORGANIZER      (행사 관리자 하위 계정)
```

### 10.3.2 기본 정책

- 관리자 API 인증 필수
- 관리자 API(`/admin/*`)는 Backstage 프록시를 거친 요청만 수락하고, 상태 변경 요청은 Origin을 검증한다 ([§10.1.2](#1012-배포-구조-예시) 결정 참고)
- 공개 API Rate Limit 적용 — 공개 `/v1`은 방문자 IP당 분당 600회(`PUBLIC_RATE_LIMIT_MAX`)이고, 운영(Fly.io)에서는 Fly 프록시가 넣는 `Fly-Client-IP`를 방문자 IP로 쓴다. 운영이 아닌 환경에서는 클라이언트가 보낼 수 있는 헤더라 믿지 않는다. 관리자 로그인 제한과는 별개다
- 수집 Worker와 API의 DB 권한 분리
- 오브젝트 스토리지 비공개 Bucket 기본
- 공개 이미지에만 서명 URL 또는 CDN 경로 제공
- 모든 수정·승인 작업 감사 로그 기록 — 단, 루트 관리자는 1인 운영 및 공유 계정 특성상 계정 단위 기록에 그치고, 행사 관리자(대표/하위)는 event_id 스코프 권한 특성상 계정별로 구분 기록됨
- 사용자 제안에 스팸 방지 및 신고 기능 적용

관리자 로그인의 구체적인 인증 방식과 3단계 권한 구조(루트 관리자 / 행사 관리자 대표 / 행사 관리자 하위 계정)는 [07-admin-dashboard.md §7.6 인증 및 권한 구조](07-admin-dashboard.md#76-인증-및-권한-구조)에 정리되어 있다.

### 10.3.3 위젯 임베드 격리 정책

iFrame 위젯([08-api-and-ics.md §8.1.1](08-api-and-ics.md#811-노출-채널-계층-구조))을 제3자 사이트에 삽입 가능하게 열어주는 것과, 메인 플랫폼(공개 웹·관리자 대시보드)의 보안 설정은 완전히 분리한다.

- **라우트 격리**: 위젯 렌더링 페이지는 별도 서브도메인(`widget.*`, [§10.1.2](#1012-배포-구조-예시))의 정적 셸로 분리하고, 위젯이 소비하는 API 네임스페이스도 메인 사이트 라우트와 분리한다. iframe 허용을 위한 예외 설정은 이 격리된 호스트 안에서만 적용하고, 메인 플랫폼(Onstage·Backstage·`api.*`)에는 손대지 않는다.
- **CSP `frame-ancestors` / X-Frame-Options**: 메인 플랫폼(공개 웹, 관리자 대시보드)은 기본적으로 프레임 삽입을 차단한다(클릭재킹 방지). 위젯 호스트(`widget.*`)만 예외로 모든 origin에서의 프레임 삽입을 허용한다 — 위젯이 보여주는 데이터는 인증 없이 공개된 읽기 전용 정보(§8.5.1 Phase 3)라 열어줘도 노출되는 것이 없다. 헤더를 호스트 단위로 걸 수 있어 경로 단위 예외보다 단순하다.
- **CORS**: 위젯 셸이 API와 다른 origin(`widget.*` → `api.*`)이므로 위젯의 API 호출은 cross-origin이다. 기본은 SCLS 자체 호스트(위젯, Onstage)만 허용하는 allow-list로 두고, 인증이 필요한 경로(`/admin/*` 등)에는 위젯 origin을 허용하지 않는다. 제3자 사이트의 JS가 iframe 없이 API를 직접 fetch하는 것까지 지원할지는 아직 결정하지 않았으며, 지원하기로 하면 인증 없는 공개 읽기 전용 GET에 한해 credentials 없이 `Access-Control-Allow-Origin: *`로 넓힌다. (현황 2026-10-02: 공개 `/v1` GET·HEAD·OPTIONS는 이미 `*`로 열려 있다 — Discord 봇·개인 앱 등 브라우저 직접 호출을 전제로 한 구현이다. 위 allow-list 기본안으로 되돌릴지, 이 상태를 정식 결정으로 확정할지는 위젯 착수 전에 정한다.)
- **계정 필수 여부**: 위젯 API도 일반 공개 API와 동일하게 **계정/로그인 없이 기본 Rate Limit 안에서 사용 가능**하다(§8.5.1 Phase 3과 동일 정책 상속). 계정(API Key)은 상향 Rate Limit·사용량 통계 등 심화 기능을 위한 선택 사항이며(§8.5.1 Phase 6), 위젯 이용 자체의 전제 조건이 아니다.

## 10.4 운영 및 모니터링

### 10.4.1 필수 지표

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

### 10.4.2 오류 처리

- 네트워크 오류: 지수 백오프 재시도
- 파싱 오류: 원본 보존 및 검수 작업 생성
- 번역 오류: FAILED 상태 및 재시도 가능
- 날짜 충돌: 자동 반영 금지 및 관리자 검수
- 행사 매칭 불확실: 신규 행사 후보와 기존 행사 후보를 함께 제시
- 공식 페이지 삭제: 기존 데이터 삭제 금지, 출처 상태만 변경

### 10.4.3 백업

- PostgreSQL 자동 백업
- 정기 복구 테스트
- 주요 스토리지 오브젝트 버전 또는 별도 백업 검토
- 용어집·검수 이력·행사 기준 데이터 우선 복구
- 단순 Worker 로그와 캐시는 복구 우선순위에서 제외

---

[← 목차](README.md) · 이전: [09. 검색 및 알림](09-search-and-notifications.md) · 다음: [11. 개발 단계 및 성공 기준](11-roadmap-and-success.md)
