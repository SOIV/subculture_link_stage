[← 목차](README.md)

# 11. 개발 단계, 성공 기준, 구현 체크리스트

> [!NOTE]
> 현재 Phase 1 Core MVP 진행 중이다. Private `scls-platform`에서 API·Backstage 기본 기능을, 이 공개 Repository의 `apps/onstage`에서 메인·행사 목록·상세를 구현해 임시 도메인으로 배포·테스트 중이다. 정식 도메인은 미정이다. Phase 2는 수집 출처(Sources) 관리부터 착수했다.
> 이 문서는 **현재 상태·남은 작업·성공 기준**을 관리한다. 상세 변경 내용과 구현 근거는 [작업 로그](../devlog/README.md)에 기록한다.
> `[x]`는 해당 기획·설계 또는 개별 구현 항목의 완료를 뜻하며, 세부 기능 완료만으로 Phase 전체 완료나 운영 배포를 뜻하지 않는다.

## 11.1 개발 단계

### Phase 0 — 기획 및 기반 설계

설계 확정 과정과 기획 체크리스트의 상세 기록은 [Phase 0 작업 로그](../devlog/phase-0-planning-and-design.md)에 보관한다.

- [x] 프로젝트명 확정: Subculture Link Stage (SCLS)
- [x] 공식 공개 Repository + 비공개 Monorepo 구조 확정 ([§3.2.1](03-architecture-and-domain.md#321-repository-구조-확정))
- [x] PostgreSQL ERD·참고 DDL 작성 ([ERD](database/erd.md), [DDL](database/schema.sql))
- [x] 일정 분류 코드 15종 정의 ([DDL §1](database/schema.sql))
- [x] 번역 출처·검수 상태 정의 ([§6.1.3](06-i18n-translation-glossary.md#613-번역-출처-및-상태))
- [x] 태그 트리·초기 시드 매핑 확정 — 티켓 방식 세부값은 Phase 1과 병행 ([§4.4](04-database-design.md#44-태그-구조))
- [x] 초기 대상 행사 시리즈 9개 선정 ([§2.3.3](02-users-and-scope.md#233-초기-대상-행사-시리즈-확정))
- [ ] 초기 수집 출처·이용 조건 확인 — SNS API 접근 포함, Phase 2 착수 전 확인. 2026-10-21 1차 조사 완료([조사 기록](../devlog/2026-10.md)); X·Instagram 약관 원문은 확인함(X는 API만 허용, Instagram 자동 수집은 금지); 지스타 수집 문의, X API 사용 목적 신고, SNS 원본 보관 방식 검토가 남음
  - [ ] 지스타 수집 문의 — 2026-11-18 이용약관 4장(서비스 이용) 확인: 수집 금지 조항은 없으나 robots.txt가 메인 화면 외 전부 막으므로 허락 전까지 자동 수집 보류 유지. 문의 메일 초안 작성함, 행사 주간이라 행사 종료 1~2주 뒤(12월 초) 하단 대표(info) 메일로 보내고, 답이 없으면 1~2주 뒤 한 번 더 보낸다. 답장 전까지는 수동 등록·X 공식 계정 확인

### Phase 1 — Core MVP

상세 변경 내용과 구현 파일 경로는 [초기 구현 기록](../devlog/phase-1-initial-implementation.md)을 참고한다.

- [x] PostgreSQL 및 Migration 구성 — Supabase 연결, Phase 1 Prisma 스키마·초기 migration 적용
- [x] Event Series, Event, Event Schedule CRUD API·관리자 UI
- [x] Venue, Organizer, Tag CRUD API·관리자 UI
- [x] Localizations CRUD API·관리자 UI — 행사·시리즈·일정·장소·주최·태그 대상
- [x] 루트 관리자 로그인 — DB 저장 세션 + HttpOnly 쿠키 ([§7.6.3](07-admin-dashboard.md#763-권한-부여-절차))
- [x] 행사 수동 등록·수정 UI — 태그·주최/후원·행사 링크 연결 관리 포함
- [x] 공개 GET API — `/v1` 기본 조회·검색·행사 필터 구현, `category`/`franchise` 필터 보류 ([§8.2](08-api-and-ics.md#82-공개-api-예시))
- [x] 공개 API 보호·핵심 로직 테스트 — IP당 분당 600회 요청 제한, JSON·ICS 캐시 헤더, ICS·캘린더 일정 변환·행사 필터·요청 제한·캐시 검증
- [x] ICS 전체·온라인·국가별·필터 피드 — 한국·일본 타임존, 티켓 알림·장소·일정 제목 반영 ([§8.6](08-api-and-ics.md#86-ics-및-캘린더-설계))
- [x] Backstage·API 초기 배포 — Cloudflare Workers / Fly.io 도쿄, 자동 배포 연결, 임시 도메인 테스트 중
- [ ] 정식 도메인 구매·연결 — 정식 공개 시점에 Onstage·Backstage·API 호스트 연결, 그전까지 임시 도메인으로 개발·테스트 ([§10.1.2](10-infra-ops-security.md#1012-배포-구조-예시))
- [ ] 정식 공개 시 Fly API 머신 2대로 전환 — 도쿄 리전, 무중단 배포·장애 대비; 수집 Worker는 별도 프로세스 그룹 ([§10.1.2](10-infra-ops-security.md#1012-배포-구조-예시))
- [x] 테스트 행사 20개 이상 등록 — 9개 시리즈·22개 행사, 공식 확인 13건·간접 확인 9건; 기계번역 콘텐츠 검수 필요
- [ ] Subculture Onstage 행사 상세 웹페이지 — 기본 기능 구현·임시 배포 후 보완 중. Phase 1 범위는 [§2.2.1](02-users-and-scope.md#221-core-mvp-기능-phase-1) 참고
  - [x] 메인 페이지·행사 목록 분리, 검색·필터, 상세·ICS 구독 링크
  - [x] ko/ja/en, 언어·화면 모드 설정, 행사 요약·다음 일정 카드
  - [x] 국기 SVG·선 아이콘, 타임존 표기, 장소·주최·주소 현지화
  - [x] 태그 그룹별 필터 — 그룹 안은 OR, 그룹 사이는 AND, 하위 태그 포함; API·ICS에 동일 적용
  - [x] 검색엔진·링크 미리보기 기반 — 제목·설명·Open Graph·행사 JSON-LD·sitemap·robots, 검색·필터 목록은 `noindex`
  - [ ] 링크 미리보기 이미지(`og:image`) — 디자인 확정 후 추가
  - [ ] 사용 중 발견되는 UI·UX 보완 — 1차 정리 완료, 후속 수정 계속
  - [x] 티켓 판매 구조 점검·확장 — DB·공개 API·상세 표시·초기 데이터·Backstage 입력 UI 구현. 2026-11-17 재검토: 표 구조는 그대로 두고 필수·선택·보류·안 함을 정리했으며, 끝난 판매·행사를 날짜로 자동 "종료" 표시하게 했다 ([DB 설계](04-database-design.md), [작업 로그 2026-11](../devlog/2026-11.md))
  - [ ] 비어 있는 티켓 정보 채우기 — 2026-11-17 코믹월드 338·코미케 109·일러스타 14 입력, WONDERLIVET JST 일정의 판매처(티켓피아) 확인. 남은 것: 애니메재팬 2027(티켓 발표 전), 코미케 오전·오후 리스트밴드 가격
  - [ ] 행사 목록(시리즈)·행사 상세와 연혁 — 2026-11-17 사용자 제안, 착수 시점은 OpenAPI 작업 무렵 검토. 화면 이름: 시리즈 묶음 = "행사 목록", 지금의 회차 목록 = "행사 일정 목록"
    - 일본어 명칭은 이 화면을 만들 때 일본 행사 사이트 용례를 조사해 정한다(2026-11-18 결정). 지금 쓰는 「イベントシリーズ」는 뜻은 통하지만 일본에서 잘 안 쓰는 말이다. 후보: 시리즈 목록 = 「イベント一覧」, 회차 목록 = 「開催スケジュール」(또는 「開催一覧」), 상세의 시리즈 칸 이름은 미정. 정하면 Onstage·Backstage·API 문서(`texts.ja.ts`)를 함께 바꾼다. 그전에 피드백이 오면 그때 반영한다. 영어는 "Event series"(회차는 "edition")가 일반적이라 그대로 둔다
    - 행사 목록(`/series` 예정): 시리즈 카드(이름·국가·시작 연도·다음 회차)
    - 행사 상세: 소개·시작 연도·공식 사이트, 다가오는 회차, 연도별 연혁(회차·날짜·장소 → 회차 상세로 연결). 회차 상세의 시리즈 표시에서 이 페이지로 연결
    - 먼저 정할 것: 끝난 회차 공개 — 공개 API는 지금 `CONFIRMED`·`POSTPONED` 행사만 보여 줘서 `ENDED`로 넣은 지난 회차(코믹월드 330~336, 일러스타 11~13, 코미케 108, 도쿄게임쇼 2026 등)가 어디에도 나오지 않는다
    - API: 시리즈 상세, 시리즈별 행사 목록(필터). 새로 만드는 공개 라우트라 OpenAPI 스키마를 처음부터 붙인다
    - 데이터: 시리즈 소개 글(9개 모두 비어 있음). 첫 버전 연혁은 DB에 있는 회차만, 그 이전 연혁은 나중에 채운다
  - [ ] 행사장 부스 찾기 연결 — 해시태그·공식 배치도·서클 목록·외부 지도 링크 검토 중, 착수 시점 미정 ([§2.2.4](02-users-and-scope.md#224-후기-확장-기능))
  - [ ] 모바일 UI/UX 정리와 PWA — 2026-11-17 사용자 제안, 검토 중. 모바일 화면 정리 → PWA 기본(아이콘·설치·오프라인 보기) → 웹 푸시 알림 순서, 수집기 작업 뒤로 둔다. 푸시 알림은 서버 작업이 필요해 Phase 5 알림과 함께 정한다 ([검토 기록](../devlog/future-feature-discussions.md#record-4))

### Phase 2 — 수집 및 검수

- [ ] 행사 관리자 로그인·인증 설계 — SSO·소셜 연동·증명 자료 심사와 권한 범위 확정 ([§7.6.3](07-admin-dashboard.md#763-권한-부여-절차))
- [ ] 행사 관리자 계정 도입 — 대표·하위 권한 부여와 Change Proposal 제안 제출 ([§7.6.3](07-admin-dashboard.md#763-권한-부여-절차))
- [ ] Sources 및 Source Rules 구현 — Sources부터 착수. 구현 기록은 [작업 로그 2026-10](../devlog/2026-10.md)
  - [x] Sources 표·`/admin/sources` API·Backstage 수집 출처 화면 — 2026-10-21 구현. 목록 필터, 생성·수정·삭제, 활성 토글, 이용 조건 메모(`terms_note`) 입력 ([§5.2.1](05-storage-and-collection.md#521-행사별-수집-프로필), [§7.3](07-admin-dashboard.md#73-수집-소스-관리))
  - [x] Sources migration 적용·초기 9개 시리즈 출처 입력 — 2026-11-17 운영 DB에 반영. 출처 32건은 전부 비활성으로 들어가 아직 아무것도 수집하지 않는다 ([작업 로그 2026-11](../devlog/2026-11.md))
  - [ ] Source Rules — 미착수
- [ ] 공식 웹사이트 1~2개 Collector 구현 — Python Worker로 만든다(방향, 2026-11-05). DB는 API를 거쳐 쓰고, Queue는 Python에서 쓸 수 있는 것으로 고른다 ([§3.2.1](03-architecture-and-domain.md#321-repository-구조-확정), [§10.1.2](10-infra-ops-security.md#1012-배포-구조-예시))
- [ ] Collected Documents 및 Storage Object 구현
- [ ] 해시 중복 검사
- [ ] Change Proposal 생성
- [ ] 관리자 승인·거절 UI
- [ ] 원문 스냅샷 및 변경 비교
- [x] **OpenAPI 3.x 스펙 작성 착수** (비공개, 내부 검증용) — 2026-11-17 공개 `/v1` 12개 경로에 요청·응답 스키마를 붙이고 코드에서 스펙(OpenAPI 3.1)을 만들기 시작했다. 도구는 `@fastify/type-provider-zod` + `@fastify/swagger`(Zod 4) — [08-api-and-ics.md §8.5.2](08-api-and-ics.md#852-미결-사항), [작업 로그 2026-11](../devlog/2026-11.md)
  - [x] 언어별 설명 문구(한·일·영)를 기준 스펙에 덧입히는 방식 정하기 — 2026-11-18 "문구 표" 방식으로 정하고 구현(Overlay는 쓰지 않음). 스펙 3개 생성, 한·일 문구 초안은 검수 필요
  - [x] 요청 제한(429) 응답과 응답 헤더(Cache-Control 등)를 스펙에 적기 — 2026-11-18 완료. 한도 초과가 500으로 나가던 문제도 함께 고침
- [ ] **API Docs 페이지 개발 착수** (비공개) — 문서 사이트 도구는 Fumadocs 우선, 차선책 Starlight + Scalar ([§8.5.3](08-api-and-ics.md#853-문서-사이트-도구-확정)). 구현은 미착수

### Phase 3 — 다국어 번역

- [ ] 언어 감지
- [ ] 한국어·일본어·영어 번역 Worker
- [ ] 번역 출처 및 상태 표시
- [ ] 원문 리비전과 OUTDATED 처리
- [ ] 용어집 기본 기능
- [ ] 공식 명칭 초기 용어 등록
- [ ] 관리자 번역 검수 UI
- [ ] **OpenAPI 스펙 및 API Docs 페이지 전체 공개**

### Phase 4 — 커뮤니티 기여

- [ ] 사용자 로그인
- [ ] 행사 정보 수정 요청
- [ ] 번역 수정 요청
- [ ] 용어집 제안
- [ ] 중복 제안 병합
- [ ] 신뢰 기여자 및 번역 검수자 권한

### Phase 5 — 외부 연동 및 자동화

- [ ] 디스코드 봇 API 연동 예제 및 문서화 (이미 공개된 OpenAPI Docs를 소비하는 사례로 작성)
- [ ] 카테고리·작품별 ICS
- [ ] 알림 작업 생성
- [ ] Discord 알림 발송
- [ ] 임베딩 및 유사 문서 검색
- [ ] 고신뢰 출처 제한적 자동 승인

### Phase 6 — 운영 확장

- [ ] API Key·개발자 콘솔 — 상향 Rate Limit·Webhook 등 심화 기능 ([§8.5](08-api-and-ics.md#85-openapi-공개-전략))
- [ ] 개인 구독·개인 ICS — 표시 방식·대상·알림을 계정별 저장, 구독 주소 유지 ([§8.6.5](08-api-and-ics.md#865-피드-품질))
- [ ] 내 행사 기록·연간 리캡 — 등록 행사·사용량 확인 후 착수 ([§2.2.4](02-users-and-scope.md#224-후기-확장-기능))
- [ ] Webhook 또는 변경 Feed
- [ ] 외부 수집 소스 확대
- [ ] 비용·용량 모니터링 자동화
- [ ] 백업 및 재해 복구 훈련

## 11.2 성공 기준

### MVP 성공 기준

- 행사 및 일정 50건 이상 관리
- 공식 출처 3개 이상 정기 수집
- 수집 후보를 관리자 화면에서 승인·거절 가능
- 한국어·일본어·영어 행사 상세 제공
- 전체 및 국가별 ICS 피드 정상 동작
- 디스코드 봇 또는 외부 클라이언트에서 공개 API 조회 가능

### 초기 운영 성공 기준

- 행사 시리즈 20개 이상
- 장소 30개 이상
- 작품/IP 30개 이상
- 승인·거절 수집 데이터 1,000건 이상
- 번역 용어 500건 이상
- 변경·취소 공지를 누락 없이 처리할 수 있는 운영 흐름 확보
- DB와 스토리지 용량 및 비용을 월 단위로 추적

## 11.3 구현 체크리스트

### 기획

결정 과정과 구현 근거는 [Phase 0 작업 로그](../devlog/phase-0-planning-and-design.md)를 참고한다.

- [x] 플랫폼·서비스 명칭 확정: SCLS / Onstage / Backstage / SCLS API
- [x] 행사와 일정 분리
- [x] 수집·분석·검수 계층 구분
- [x] 다국어 번역 구조 정의
- [x] 번역 수정 요청·용어집 제안 방향 정의
- [x] PostgreSQL + Object Storage 방향 확정
- [x] 프로젝트명 확정: Subculture Link Stage (SCLS)
- [x] 계획 문서 주제별 분리 ([목차](README.md))
- [x] OpenAPI 공개 단계 확정 — Phase 2 착수 / Phase 3 공개 ([§8.5](08-api-and-ics.md#85-openapi-공개-전략))
- [x] OpenAPI 스펙 작성 방식 확정 — 코드에서 자동 생성(Code-first) ([§8.5.2](08-api-and-ics.md#852-미결-사항))
- [x] 운영 형태 방향 정리 — 무료·후원 기본, 유료화·광고는 검토 중 ([§1.6.2](01-overview-and-principles.md#162-운영-형태))
- [x] 프로젝트·설계·Onstage 공개 및 내부 구현 비공개 범위 확정 ([§1.6.3](01-overview-and-principles.md#163-소스-공개-및-참여-정책))
- [x] 개발·운영 참여 방식 확정 — 메인 개발자 문의
- [ ] 초기 분류 코드 잔여 항목 확정 — 티켓 방식 등 세부 분류
- [x] 관리자 인증 3단계 구조 확정 ([§7.6](07-admin-dashboard.md#76-인증-및-권한-구조))
- [x] 공개 Repository + 비공개 Monorepo 구조 확정 ([§3.2.1](03-architecture-and-domain.md#321-repository-구조-확정))
- [x] 도메인별 ERD·전체 참고 DDL 확정 ([ERD](database/erd.md), [DDL](database/schema.sql))
- [x] 초기 DB 제공자 Supabase 확정 ([§10.1.1](10-infra-ops-security.md#1011-권장-기술-스택))
- [x] 행사 관리자 권한 부여 기본 절차 확정 ([§7.6.3](07-admin-dashboard.md#763-권한-부여-절차))
- [x] 행사 관리자 계정 도입을 Phase 2에 배치 ([§2.1.3](02-users-and-scope.md#213-행사-측-담당자-행사-관리자))
- [x] Backstage UI ko/en/ja 지원 — 행사 콘텐츠 번역과 별도 ([§7.7](07-admin-dashboard.md#77-관리자-ui-다국어-지원))
- [ ] 비용 상한·트리거 확정

### 구현

- [x] Phase 1: Core MVP 개발 착수
- [ ] Phase 1: Core MVP — 진행 중 (§11.1 세부 항목 기준)
- [ ] Phase 2: 수집 및 검수
- [ ] Phase 3: 다국어 번역
- [ ] Phase 4: 커뮤니티 기여
- [ ] Phase 5: 외부 연동 및 자동화
- [ ] Phase 6: 운영 확장

### 초기 데이터

- [ ] Event Series 10개 이상 (현재 9개 — §2.3.3 확정 시리즈 전부 등록, 10개째는 반복 투어형 시리즈 추가 검토와 함께 이후 확대)
- [x] Event 20개 이상 (22개 등록)
- [ ] Event Schedule 50개 이상 (현재 27개)
- [x] Venue 10개 이상 (현재 47개 — 한국 22·일본 25, 2026-11-17 행사장·공연장 40곳 추가)
- [ ] Tag 30개 이상 (현재 16개 — [04-database-design.md §4.4](04-database-design.md#44-태그-구조) 트리 전체 등록, 세부 확장은 이후 검토)
- [ ] 공식 용어집 100개 이상
- [ ] 수집 출처 3개 이상

---

[← 목차](README.md) · 이전: [10. 인프라, 데이터 보관, 보안, 운영](10-infra-ops-security.md)
