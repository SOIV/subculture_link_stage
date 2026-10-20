[← 작업 로그 목록](README.md) · [현재 로드맵](../plan/11-roadmap-and-success.md)

# 인증·관리자 UI·인프라 결정 기록

인증 방식, 관리자 UI 언어, DB·호스팅 선택과 초기 배포 과정의 기록이다. 당시 가격·서비스 조건·미구현 상태는 역사적 검토 자료이며 현재 설정이나 제공자 정책을 새로 확인한 결과가 아니다.

> 2026-10-20에 기존 문서에서 이관했다. 이관일은 개별 작업일이나 재검증일이 아니다. 날짜·완료 여부·미결 상태는 원문에 명시된 범위만 보존한다. 최신 계획과 상태는 각 기획 문서와 [로드맵](../plan/11-roadmap-and-success.md)에서 관리한다.

## 찾아보기

- [2026-09-01 — 루트 관리자 세션](#record-1)
- [2026-09-02 — 행사 관리자 신원 확인 절차](#record-2)
- [2026-09-05 — Backstage UI 다국어 지원](#record-3)
- [DB 제공자 선택 — Supabase·Neon·자체 호스팅 검토](#record-4)
- [2026-09-19·10-02 — Cloudflare 선택과 프론트엔드 초기 배포](#record-5)
- [2026-09-19 — 위젯 호스트 분리](#record-6)
- [2026-09-19 — API의 실시간 연결 경로](#record-7)
- [2026-09-19 — 관리자 프록시·Origin·Worker 설정](#record-8)
- [2026-09-19·10-20 — Fly.io 선택·배포·머신 확장 결정](#record-9)
- [API 도메인 연결 시점의 CORS·요청 제한 메모](#record-10)

<a id="record-1"></a>

## 2026-09-01 — 루트 관리자 세션

기록 출처: [docs/plan/07-admin-dashboard.md](../plan/07-admin-dashboard.md)

> **결정 (2026-09-01)**: 루트 관리자 세션은 DB 저장 세션 + HttpOnly 쿠키 방식으로 구현했다(JWT 대신 — 1인 운영 규모에서 즉시 무효화가 쉬운 쪽을 택함). `staff_sessions` 테이블에 세션 토큰의 해시만 저장한다. 비밀번호 복구는 별도 셀프서비스 없이, 운영자가 `create-root-admin` 스크립트로 직접 재설정한다(이메일 발송 인프라가 없으므로). 현재 Private `scls-platform`의 API 구현에 반영되었다. 구현 근거는 [작업 로그](README.md)에 정리한다.

<a id="record-2"></a>

## 2026-09-02 — 행사 관리자 신원 확인 절차

기록 출처: [docs/plan/07-admin-dashboard.md](../plan/07-admin-dashboard.md)

> **결정 (2026-09-02)**: 신원 확인 절차는 이메일 인프라를 새로 구축하지 않고, 행사 공식 SNS 계정을 통한 DM 확인으로 처리한다(루트 관리자 세션 결정과 마찬가지로, 1인 운영 규모에서 이메일 발송 시스템 구축 비용을 피하는 방향). 행사 관리자 대표는 최초로 신원 확인된 요청자로 고정하며, 별도 지정 절차는 두지 않는다. 초대 코드 방식은 기본 절차를 쓸 수 없는 예외 상황을 위한 보조 수단으로 남겨둔다.

<a id="record-3"></a>

## 2026-09-05 — Backstage UI 다국어 지원

기록 출처: [docs/plan/07-admin-dashboard.md](../plan/07-admin-dashboard.md)

> **결정 (2026-09-05)**: Backstage는 한국어·영어·일본어 3개 언어를 지원한다. 현재는 운영자 1인만 사용하지만, 향후 [7.6.2](../plan/07-admin-dashboard.md#762-backstage-인증--3단계-구조)의 행사 관리자(대표·하위 계정)가 해외(특히 일본) 행사 담당자로 유입될 가능성이 있어 미리 기반을 잡아둔다. `i18next` + `react-i18next` 기반으로 구현했고, 사이트명("SCLS Backstage")만 언어와 무관하게 고정한다. 언어 선택은 헤더의 드롭다운으로 전환하며 `localStorage`에 저장돼 재방문 시 유지된다. 현재 Private `scls-platform`의 Backstage 구현에 반영되었다.

<a id="record-4"></a>

## DB 제공자 선택 — Supabase·Neon·자체 호스팅 검토

기록 출처: [docs/plan/10-infra-ops-security.md](../plan/10-infra-ops-security.md)

> **결정 사항 — DB 제공자: Supabase (Neon 제외)**: Neon은 컴퓨트 사용량 기반 과금 구조라, Worker/Scheduler처럼 상시 DB 커넥션을 유지하는 프로세스가 있으면 스케일-투-제로가 되지 않아 과금이 크게 튈 수 있다(운영자가 다른 프로젝트의 Discord Bot에서 이미 겪은 문제). SCLS도 수집·번역 Worker와 Scheduler가 상시 커넥션을 유지할 가능성이 높아 동일 리스크를 안고 있어, 초기에는 Neon을 사용하지 않는다. Supabase는 무료/Pro 티어가 정액 요금이라 이런 과금 급증 리스크가 없다. 다만 Supabase Pro 요금(무료 티어 초과 시 $25/월~)이 부담되는 시점이 오면 자체 호스팅 PostgreSQL(VPS)로 이전하는 것을 장기적으로 고려한다 — 이 경우 마이그레이션 비용을 낮추기 위해 Supabase 전용 기능(Auth, Realtime 등)에 의존하지 않고 표준 PostgreSQL 기능 위주로 스키마·쿼리를 설계한다.

<a id="record-5"></a>

## 2026-09-19·10-02 — Cloudflare 선택과 프론트엔드 초기 배포

기록 출처: [docs/plan/10-infra-ops-security.md](../plan/10-infra-ops-security.md)

> **결정 (2026-09-19) — 프론트엔드 호스팅: Cloudflare (Vercel 제외)**: Backstage(정적 SPA), Onstage(SvelteKit), 위젯 셸을 모두 Cloudflare에 올린다. 이유는 ① DNS·CDN·WAF·R2를 이미 Cloudflare로 쓰므로 벤더가 늘지 않고, ② Vercel Hobby는 비상업용으로 제한되는 것으로 알고 있어 부분 유료화나 광고 수익이 생길 수 있는 SCLS는 처음부터 유료 플랜이 필요할 수 있기 때문이다(약관은 착수 시점에 재확인). 조건과 주의: Cloudflare는 Pages에서 Workers(Static Assets)로 권장 방식이 옮겨가는 중이라 Onstage 착수 시점에 공식 문서로 어느 쪽을 쓸지 확인한다(Backstage는 `/admin/*` 프록시를 같은 Worker에 두기 위해 Workers Static Assets로 배포했다. Onstage도 Workers로 정해 2026-10-02 Git 연결(Workers Builds)로 초기 배포했다). Onstage는 `adapter-cloudflare`로 Node와 다른 Workers 런타임에서 동작하므로 공개 API `fetch` 위주로 유지하고 Node 전용 라이브러리 의존을 지양한다. 이 조건이 깨지면 재검토한다.

<a id="record-6"></a>

## 2026-09-19 — 위젯 호스트 분리

기록 출처: [docs/plan/10-infra-ops-security.md](../plan/10-infra-ops-security.md)

> **결정 (2026-09-19) — 위젯은 Onstage와 분리 배포**: 위젯 정적 셸은 Onstage와 별개로 `widget.*` 호스트에 배포한다. 런타임 경로는 `위젯 셸(정적, CDN 캐시) 로드 → 브라우저가 API/WS에 직접 접속`이며 Onstage를 경유하지 않는다(Onstage의 위젯 설정 화면은 임베드 코드를 만들어 줄 뿐). `api.*/widget/**`처럼 API 오리진 아래에 두지 않는 이유는, 위젯이 옵션을 받아 렌더링하므로 XSS 가능성이 0이 아니고 API와 same-origin이면 이후 쿠키 인증 엔드포인트가 생겼을 때 피해가 커지기 때문이다. 격리 정책은 [§10.3.3](../plan/10-infra-ops-security.md#1033-위젯-임베드-격리-정책) 참고.

<a id="record-7"></a>

## 2026-09-19 — API의 실시간 연결 경로

기록 출처: [docs/plan/10-infra-ops-security.md](../plan/10-infra-ops-security.md)

> **결정 (2026-09-19) — 실시간 연결(WS/SSE)은 API 서버의 별도 경로로 제공**: 별도 서버나 호스트명을 두지 않고 `api` 서버 한 대가 REST와 함께 받는다(예: `/v1/stream`). 실제 경로명은 제3자 클라이언트가 붙기 전에 확정해야 한다. 경로로 나눠 두면 Cloudflare 캐시 규칙(REST 공개 GET은 캐시, 스트림 경로는 우회)을 걸기 쉽고, 부하가 커지면 Cloudflare에서 특정 경로만 다른 origin으로 보내 URL을 유지한 채 분리할 수 있다(플랜·한도는 그때 확인). 조건과 주의:
>
> - API 호스트는 상시 연결을 유지할 수 있는 컨테이너/VPS형이어야 한다. 요청 단위 서버리스와 유휴 시 자동 종료(scale-to-zero)는 맞지 않는다.
> - 배포·재시작 때 모든 연결이 끊기므로 SDK와 위젯은 지수 백오프에 지터를 넣은 자동 재연결을 기본으로 한다.
> - embed/ambient 위젯은 WS 없이 캐시된 공개 GET 폴링(카운트다운은 클라이언트 계산)을 기본으로 하고, 상시 연결은 overlay 등 실시간성이 필요한 경우로 한정한다. 이를 위해 공개 GET에 짧은 `Cache-Control`과 Cloudflare 캐시 규칙을 적용한다(Cloudflare는 API JSON을 기본 캐시하지 않는다).

<a id="record-8"></a>

## 2026-09-19 — 관리자 프록시·Origin·Worker 설정

기록 출처: [docs/plan/10-infra-ops-security.md](../plan/10-infra-ops-security.md)

> **결정 (2026-09-19) — Backstage ↔ API는 프록시로 동일 오리진 유지**: 프로덕션에서도 Backstage는 `/admin/*`를 상대 경로로 호출하고, `backstage.*` 호스트가 이 경로만 API origin으로 프록시한다(Backstage 정적 자산과 함께 Cloudflare Workers에 얇은 프록시를 두는 방식으로 구현했다). 개발 환경의 Vite proxy([03 §3.2.1](../plan/03-architecture-and-domain.md#321-repository-구조-확정))와 같은 구조라 Backstage 코드를 바꾸지 않아도 되고, CORS credentials 설정이 필요 없으며, HttpOnly 쿠키 세션([07 §7.6](../plan/07-admin-dashboard.md#76-인증-및-권한-구조))은 `backstage.*` 한 곳에서만 쓰인다. 외부 행사 담당자가 사용자에 포함되므로([07 §7.6.2](../plan/07-admin-dashboard.md#762-backstage-인증--3단계-구조)) 공격 면을 줄이는 쪽을 택했다. 관리자 요청은 소수 사용자의 CRUD라 프록시를 한 번 더 거치는 비용은 무시할 수 있다. 조건과 주의:
>
> - `/admin/*`는 `api.*` 호스트로 받지 않는다. 프록시가 요청에 공유 시크릿 헤더를 붙이고, API가 이 시크릿이 맞는 `/admin` 요청만 수락한다(구현 완료). 코드로 강제하므로 호스트·Cloudflare 설정과 무관하게 직접 접근이 막히고, 운영에서 시크릿이 설정되지 않으면 `/admin` 요청을 모두 거부한다(fail closed). WAF 차단 방식은 채택하지 않았다.
> - 프록시 Worker의 요청 수: 정적 자산 요청은 Worker를 거치지 않고(`/admin/*`만 Worker가 먼저 실행) Worker 요청으로 집계되지 않는다. `/admin/*` 요청 수가 Cloudflare 플랜 한도 안에 들어오는지는 정식 운영 시작 시 확인한다.
> - `widget.*`와 `api.*`는 같은 사이트라 SameSite만으로는 구분되지 않으므로, `/admin`의 상태 변경 요청에는 프록시 여부와 무관하게 Origin 검증 등 CSRF 방어를 둔다. 구현: 상태 변경 요청(POST/PUT/PATCH/DELETE)은 Origin을 API의 허용 목록(Backstage 주소)과 대조해 다르면 403으로 거부한다. Backstage에 새 도메인을 연결하거나 바꾸면 이 허용 목록에도 함께 추가해야 하며, 빠뜨리면 로그인 요청이 403으로 실패한다(2026-09-19 임시 도메인을 붙였을 때 실제로 발생).
> - 프록시 뒤에서는 API가 보는 접속 IP가 프록시 주소다. 프록시가 방문자 IP를 헤더로 넘기고, API는 위 시크릿이 확인된 요청에서만 이 값을 로그인 시도 제한(rate limit)의 기준으로 쓴다. 그렇지 않으면 모든 사용자가 한 사람으로 집계된다.
> - 프록시 Worker의 설정: API 주소는 시크릿이 아니므로 Worker 설정 파일(코드)에서 관리하고, 프록시 공유 시크릿만 Secret으로 넣는다. Wrangler로 배포하면 대시보드에서 넣은 일반 변수는 다음 배포 때 덮어써지고 Secret만 유지되기 때문이다(실제로 일반 변수가 지워져 프록시가 오류를 낸 적이 있다). 미리보기 주소(`preview_urls`)는 어떤 배포든 실제 API에 연결되므로 만들지 않는다.
> - Backstage에서 외부 IdP(소셜·SSO) 로그인을 쓰게 되면 콜백 URL도 `backstage.*` 아래에 둔다.

<a id="record-9"></a>

## 2026-09-19·10-20 — Fly.io 선택·배포·머신 확장 결정

기록 출처: [docs/plan/10-infra-ops-security.md](../plan/10-infra-ops-security.md)

> **결정 (2026-09-19) — API/Worker 호스트: Fly.io 도쿄(nrt) 리전**: API, Worker, Scheduler는 Fly.io 도쿄 리전에서 돌린다. Supabase가 도쿄 리전이라 API·Worker와 DB 사이의 왕복 지연을 줄이는 것이 가장 큰 이유다. 검토한 대안은 다음과 같다.
>
> - **Railway**: 아시아 리전이 싱가포르뿐이라 도쿄 DB와의 왕복이 대략 70ms 안팎으로 늘어난다(추정, 실측하지 않음). 공개 GET은 Cloudflare 캐시가 흡수하지만 관리자 API, 쓰기, 쿼리를 반복하는 Worker에서는 누적된다.
> - **VPS**: 요금은 가장 유리하지만 OS·배포·TLS·백업을 직접 운영해야 해서 1인 운영에는 부담이 커 제외했다. Hetzner는 저렴한 플랜이 유럽에만 있어 부적합하다.
>
> 비용은 API·Worker 각 512MB에 Redis 256MB(Phase 2 이후)를 더해 월 약 $9로 추정한다(2026-09 공식 가격 기준으로 shared-cpu-1x 512MB가 월 $3.32이며, 가격은 착수 시점에 재확인). 조건과 주의:
>
> - 서비스별로 Dockerfile과 `fly.toml`을 두고, 수동 배포는 `fly deploy` 한 번으로, 자동 배포는 GitHub Actions 워크플로(push 시 `flyctl deploy --remote-only`, 배포 토큰을 `FLY_API_TOKEN` 시크릿으로 저장)로 한다. 워크플로 파일은 직접 작성해야 한다. `scls-platform`이 monorepo라 저장소 루트를 빌드 컨텍스트로 하고 앱별 `fly.toml`·Dockerfile은 `--config`/`--dockerfile`로 지정한다. 공유 패키지(DB 클라이언트·도메인 타입)가 TS 소스를 그대로 가리키므로 컨테이너에서는 빌드 산출물 대신 `tsx`로 소스를 직접 실행하며, 실제 접속 정보 파일(`.env`)은 이미지에서 제외한다(2026-09-19 구현 및 배포 확인).
> - Fly는 머신을 상시 켜 두는 과금이라 한가해도 비용이 줄지 않는다.
> - 머신은 개발·테스트 중에는 1대로 고정한다(`--ha=false`). Fly는 첫 배포에서 기본으로 2대를 만드는데, 비용이 2배가 되기 때문이다. 이 기간에는 배포 중 API가 잠깐 끊겨도 영향이 없다.
> - **정식 공개(릴리즈) 때는 API 머신을 2대로 늘린다**(2026-10-20 결정). Cloudflare Workers에 배포한 Onstage·Backstage는 요청에 맞춰 자동으로 늘어나 신경 쓸 것이 없고, 머신 수를 직접 관리해야 하는 것은 Fly의 API뿐이다. 1대면 배포마다 그 머신을 교체하는 동안 API가 끊기고, 머신에 장애가 나면 대신 받을 곳이 없다. 2대면 롤링 배포로 끊김 없이 배포하고 한 대가 죽어도 이어진다. 캘린더 앱 구독과 Onstage 서버 렌더링이 API에 의존하므로, 공개 뒤에는 이 이점이 비용(머신 1대분, 월 약 $3.32)보다 크다고 본다.
>   - 두 머신 모두 도쿄(`nrt`)에 둔다. Supabase가 같은 리전이라 DB 지연이 늘지 않는다.
>   - 요청 제한(관리자 로그인 분당 10회, 공개 `/v1` 분당 600회)이 프로세스 메모리 기반이라 머신마다 따로 집계되어 실질 한도가 머신 수만큼 늘어난다. 계정 잠금은 DB(`locked_until`)에 저장돼 영향이 없다. 이 오차는 감수하고 2대로 가며, 한도를 엄격히 지켜야 할 일이 생기면 그때 Redis 등 공유 저장소로 옮긴다. (이전에는 2대 이상으로 가기 전에 저장소 공유를 먼저 하기로 했으나, 오차가 작아 선행 조건에서 뺐다.)
>   - Phase 2의 수집 Worker·스케줄러는 API 머신과 같은 프로세스에 두지 않고 별도 프로세스 그룹으로 분리한다. 같은 프로세스에 두면 머신이 2대일 때 수집 작업이 두 번 돈다.
>   - 머신 수를 늘리는 방법과 `deploy:api`의 `--ha=false` 옵션 처리는 그때 Fly 문서를 확인해 정한다. 늘린 뒤 청구서를 보고 비용 상한(아래 미결 사항) 판단에 반영한다.
> - Supabase 직접 연결은 IPv6 전용이므로 런타임은 풀러(IPv4) 주소, migration은 직접 연결 주소로 나누어 설정한다. Fly에서 API의 DB 조회가 정상 동작함을 확인했다(2026-09-19). Prisma의 풀러 모드 세부 설정은 부하가 생기면 다시 확인한다.
> - 배포 때마다 프로세스가 재시작되므로 위 실시간 연결의 재연결 조건이 필요하다.
> - Fly 대시보드의 GitHub 연동(Launch from GitHub)은 쓰지 않는다. 자동 배포는 위 GitHub Actions로 하며, 비공개 monorepo에서 앱 하나만 배포하는 구조에 맞지 않고 저장소 동기화 단계가 진행되지 않는 문제도 있었다.

<a id="record-10"></a>

## API 도메인 연결 시점의 CORS·요청 제한 메모

기록 출처: [docs/plan/10-infra-ops-security.md](../plan/10-infra-ops-security.md)

> 5. 브라우저에서 `api.*`를 직접 호출하는 클라이언트(Onstage·위젯)가 붙기 전에 CORS를 정해야 한다([§10.3.3](../plan/10-infra-ops-security.md#1033-위젯-임베드-격리-정책)). **현재 구현**: 공개 `/v1`의 GET·HEAD·OPTIONS는 모든 오리진(`*`)을 허용하며(`scls-platform`의 `apps/api/src/server.ts`), Onstage가 이 설정으로 임시 도메인에서 동작한다. `/admin`은 별도 Origin 허용 목록을 쓰므로 영향이 없다. §10.3.3의 "자체 호스트만 허용하는 allow-list" 기본안과 다르게 처음부터 넓게 열어 둔 상태다. 또 앞단 Cloudflare 때문에 API가 보는 접속 IP가 Cloudflare 주소가 되므로, 공개 API의 요청 제한을 도입할 때 방문자 IP 헤더를 신뢰하는 설정을 함께 해야 한다. 공개 `/v1`의 요청 제한은 아직 구현 전이다(로그인에만 적용 중).
