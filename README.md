# Subculture Link Stage (SCLS)

[한국어](README.md) | [English](README.en.md) | [日本語](README.ja.md)

> 한국·일본·글로벌 온·오프라인의 서브컬처 및 게임 관련 공식 행사 정보를 수집·검수·번역하고, 작품/IP·행사 시리즈·개별 행사·일정·장소·주최사·참가/출연 주체·태그의 관계를 구조화하여 Web/API/ICS 및 외부 서비스에서 재사용할 수 있도록 제공하는 다국어 관계형 행사 데이터 플랫폼

현재 SCLS는 **초기 개발 단계(Phase 1 Core MVP 진행 중)** 입니다. 프로젝트의 기획·설계 문서와 향후 Subculture Onstage 소스는 이 공식 공개 Repository(`Subculture_Link_Stage`)에서 관리합니다. SCLS API, Subculture Backstage 및 내부 서비스는 별도 비공개 Repository인 `scls-platform`에서 개발 중이며, API·Backstage 일부 기능이 구현되어 있습니다. 이 저장소에는 아직 Onstage 코드가 없습니다. 개발 계획과 구현 현황은 [docs/plan/](docs/plan/README.md)에 정리되어 있습니다.

## 왜 만드는가

- 국내에는 국내 한정 행사 정보를 모아 보여주는 앱이 이미 있지만, 일본을 포함한 해외 행사까지 통합적으로 다루는 서비스는 제한적입니다.
- Google Calendar 등에서 바로 구독 가능한 통합 ICS 피드로 서브컬처 행사 정보를 제공하는 서비스 역시 제한적입니다.
- SCLS는 **해외 포함 통합 행사 정보 + ICS 피드 공개**를 핵심 차별점으로 삼습니다.

자세한 배경은 [docs/plan/01-overview-and-principles.md](docs/plan/01-overview-and-principles.md) 참고.

## 서비스 구성

아래는 구현 중인 기능과 향후 계획을 포함한 서비스 구성입니다.

| 명칭 | 역할 |
|---|---|
| **Subculture Onstage** | 사용자 공개 웹 — 행사 검색, 상세 정보, 캘린더 구독, 알림, 사용자 제안 |
| **Subculture Backstage** | 관리자·운영 웹 — 수집 후보 검수, 행사·번역·용어집·소스 관리 |
| **SCLS API** | Onstage, ICS, Discord 봇, 개인 앱 등 외부 서비스에 데이터 제공 |

```text
[공식 웹 / 공식 SNS / 예매처 / RSS / 수동 제보]
                 ↓
          [Collector Workers] → 원본 문서/스냅샷 저장 (PostgreSQL + Object Storage)
                 ↓
          [Analysis Pipeline] → 매칭 / 분류 / 변경점 비교
                 ↓
          [Change Proposal] → [관리자 검수] → [공개 DB]
                 ↓
    ┌────────────┼────────────┬────────────┐
  [REST API]  [ICS Feed]   [Web App]   [Notification]
```

전체 아키텍처는 [docs/plan/03-architecture-and-domain.md](docs/plan/03-architecture-and-domain.md) 참고.

## 기술 스택 (현재 및 예정)

| 영역 | 스택 |
|---|---|
| Backend | Node.js + TypeScript + Fastify (초기 구현) |
| Backstage | React + Vite + TanStack Router/Query + Tailwind v4, ko/en/ja UI (`i18next`) (초기 구현) |
| Onstage | Svelte/SvelteKit (예정, 미착수) |
| DB | PostgreSQL (Supabase) |
| ORM | Prisma (Phase 1 schema/migration 적용) |
| Queue | Redis + BullMQ (예정) |
| Storage | Cloudflare R2 / S3 (예정) |
| Search | 공개 검색 API 초기 구현; PostgreSQL FTS → pgvector 확장 계획 (데이터 축적 후) |
| ICS | 기본 피드 초기 구현; ical-generator는 라이브러리 후보 |
| CDN/DNS | Cloudflare (운영 계획) |

자세한 인프라·운영 계획은 [docs/plan/10-infra-ops-security.md](docs/plan/10-infra-ops-security.md) 참고.

## Repository 공개 범위

- **공식 공개 Repository — `Subculture_Link_Stage` (현재 이 저장소)**: 프로젝트·개발 문서, 아키텍처·데이터 모델, ERD·참고용 DDL, Roadmap, Legacy 설계 문서를 관리합니다. 향후 OpenAPI/API 개발자 문서와 Subculture Onstage 소스도 이 저장소에 포함합니다. ERD·DDL은 설계/참고 자료이며 실제 운영 DB dump나 Private ORM schema/migration과의 1:1 일치를 의미하지 않습니다.
- **비공개 구현 — `scls-platform`**: SCLS API 서버, Subculture Backstage, Collector/Worker, Scheduler, 실제 DB migration/ORM schema, 기타 내부 서비스 및 운영 구현을 관리합니다.
- 서비스 구현 소스 중 **Subculture Onstage**(사용자 공개 웹)를 오픈소스로 공개하여 UI/UX·디자인 등의 외부 기여를 받을 예정입니다. 별도 `scls-onstage` 공개 Repository를 전제로 하지 않으며, 이 저장소 안의 프론트엔드 경로는 미정입니다.
- OpenAPI 스펙 공개(사용법 공개)는 API 서버 소스코드 공개와 별개입니다.
- 비공개 영역도 공동 개발·운영 참여가 가능하며, 공개 PR이 아니라 아래 연락처로 개별 문의를 통해 진행합니다.

자세한 내용은 [docs/plan/01-overview-and-principles.md §1.6.3](docs/plan/01-overview-and-principles.md#163-소스-공개-및-참여-정책) 참고.

## 운영 형태

무료 + 부분 유료화(F2P) 모델로 운영하며, 유료화 상품이 나오기 전까지는 후원(도네이션) 기반으로 운영 비용을 충당합니다. 자세한 내용은 [docs/plan/01-overview-and-principles.md §1.6.2](docs/plan/01-overview-and-principles.md#162-운영-형태) 참고.

## 개발 계획 문서

전체 개발 계획은 [docs/plan/](docs/plan/README.md)에서 주제별로 확인할 수 있습니다.

1. [개요 및 핵심 원칙](docs/plan/01-overview-and-principles.md)
2. [목표 사용자 및 기능 범위](docs/plan/02-users-and-scope.md)
3. [시스템 구조 및 도메인 모델](docs/plan/03-architecture-and-domain.md)
4. [데이터베이스 설계](docs/plan/04-database-design.md) ([ERD·전체 DDL](docs/plan/database/erd.md))
5. [오브젝트 스토리지 및 수집 파이프라인](docs/plan/05-storage-and-collection.md)
6. [다국어, 번역, 용어집](docs/plan/06-i18n-translation-glossary.md)
7. [관리자 대시보드](docs/plan/07-admin-dashboard.md)
8. [SCLS API 및 ICS 설계](docs/plan/08-api-and-ics.md)
9. [검색 및 알림](docs/plan/09-search-and-notifications.md)
10. [인프라, 데이터 보관, 보안, 운영](docs/plan/10-infra-ops-security.md)
11. [개발 단계 및 성공 기준](docs/plan/11-roadmap-and-success.md)

과거 버전(v1~v3) 단일 문서는 [docs/legacy/](docs/legacy/)에 보관되어 있습니다.

## 현재 진행 상태

- [x] 프로젝트명 확정: Subculture Link Stage (SCLS)
- [x] 계획 문서 주제별 분리
- [x] 관리자 인증 방식(3단계 권한 구조) 확정
- [x] 운영 형태 및 소스 공개 범위 확정
- [x] PostgreSQL ERD 설계 기준 정리
- [x] Repository 구조 확정 (현재 공개 Repository에 문서·향후 Onstage + `scls-platform` 비공개 Monorepo)
- [x] Phase 1 Core MVP 개발 착수
- [ ] Phase 1 Core MVP — 진행 중
- [ ] API 초기 구현 — 진행 중 (기본 데이터 CRUD, 루트 관리자 로그인, Public GET API·ICS feeds 구현 완료)
- [ ] Backstage 초기 구현 — 진행 중 (행사·일정·기준 데이터 수동 관리 UI, ko/en/ja UI 구현 완료)
- [ ] Localizations CRUD API/UI 및 테스트 행사 20개 이상 등록
- [ ] Subculture Onstage — 미착수, 이 공개 Repository에서 개발 예정

전체 로드맵과 체크리스트는 [docs/plan/11-roadmap-and-success.md](docs/plan/11-roadmap-and-success.md) 참고.

## 문의

개발·운영 참여, 제휴 등 문의: `biz@soiv-studio.xyz`

## 라이선스

[MIT License](LICENSE) © 2026 SOIV Studio
