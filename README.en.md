# Subculture Link Stage (SCLS)

[한국어](README.md) | [English](README.en.md) | [日本語](README.ja.md)

> A multilingual relational event data platform for official subculture and gaming events in Korea, Japan, and worldwide, both online and in person. SCLS collects, reviews, and translates information, structuring the relationships between works/IP, event series, individual events, schedules, venues, organizers, participants/performers, and tags for reuse through the Web, API, ICS, and external services.

SCLS is in **early development, with Phase 1 Core MVP underway**. This official public repository (`Subculture_Link_Stage`) maintains the project’s planning and design documents and the Subculture Onstage source. SCLS API, Subculture Backstage, and internal services are being developed in the separate private repository `scls-platform`, where some API and Backstage features and Localizations (multilingual content) CRUD are implemented; Backstage (Cloudflare Workers) and the API (Fly.io, Tokyo) have had an initial deployment on temporary domains and are being tested. Onstage is under development in this repository’s `apps/onstage` (SvelteKit), with the home page, event list (search and filters), and event details implemented; it is not yet deployed because no official domain is connected. The development plan and implementation status are maintained in Korean at [docs/plan/](docs/plan/README.md).

## Why we're building this

- Apps already aggregate domestic events in Korea, while services that bring domestic and overseas events, including those in Japan, together remain limited.
- Services offering subculture event information as a unified ICS feed for direct subscription in Google Calendar and similar apps are also limited.
- SCLS's core differentiators are **unified event information covering overseas events, plus a public ICS feed**.

See [docs/plan/01-overview-and-principles.md](docs/plan/01-overview-and-principles.md) (Korean) for background.

## Services

The following describes both features under development and future plans.

| Name | Role |
|---|---|
| **Subculture Onstage** | Public web app — event search, details, calendar subscription, notifications, user suggestions |
| **Subculture Backstage** | Admin/operations web app — reviewing collection candidates, managing events, translations, glossary, sources |
| **SCLS API** | Serves data to Onstage, ICS, Discord bots, personal apps, and other external services |

```text
[Official sites / Official SNS / Ticketing platforms / RSS / Manual reports]
                 ↓
          [Collector Workers] → store raw documents/snapshots (PostgreSQL + Object Storage)
                 ↓
          [Analysis Pipeline] → matching / classification / diffing
                 ↓
          [Change Proposal] → [Admin review] → [Public DB]
                 ↓
    ┌────────────┼────────────┬────────────┐
  [REST API]  [ICS Feed]   [Web App]   [Notification]
```

See [docs/plan/03-architecture-and-domain.md](docs/plan/03-architecture-and-domain.md) (Korean) for the full architecture.

## Tech stack (current and planned)

| Area | Stack |
|---|---|
| Backend | Node.js + TypeScript + Fastify (initial implementation) |
| Backstage | React + Vite + TanStack Router/Query + Tailwind v4, ko/en/ja UI (`i18next`) (initial implementation) |
| Onstage | Svelte/SvelteKit (started, not yet deployed — `apps/onstage`) |
| DB | PostgreSQL (Supabase) |
| ORM | Prisma (Phase 1 schema/migration applied) |
| Queue | Redis + BullMQ (planned) |
| Storage | Cloudflare R2 / S3 (planned) |
| Search | Initial public search API implemented; PostgreSQL FTS → pgvector expansion planned as data accumulates |
| ICS | Initial basic feeds implemented; ical-generator is a candidate library |
| CDN/DNS | Cloudflare (operations plan) |
| Hosting | Onstage and Backstage: Cloudflare (Workers); API/Worker: Fly.io Tokyo (Backstage and API initially deployed on temporary domains) |

See [docs/plan/10-infra-ops-security.md](docs/plan/10-infra-ops-security.md) (Korean) for infrastructure and operations details.

## Repository publication scope

- **Official public repository — `Subculture_Link_Stage` (this repository)**: project and development documentation, architecture and data models, ERDs and reference DDL, the roadmap, and legacy designs. The Subculture Onstage source (`apps/onstage`) and future OpenAPI/API developer documentation also live here. ERDs and DDL are design references, not production database dumps or guaranteed one-to-one copies of the private ORM schema/migrations.
- **Private implementation — `scls-platform`**: the SCLS API server, Subculture Backstage, Collectors/Workers, Scheduler, actual database migrations/ORM schema, and other internal services and operations code.
- Among service implementations, **Subculture Onstage** (the public web app) is developed as open source in this repository’s `apps/onstage`, and we plan to welcome contributions to UI/UX, design, and related work once the service is public. A separate public `scls-onstage` repository is not required.
- Publishing the OpenAPI specification (usage documentation) is separate from publishing the API server’s source code.
- Contributors can also participate in private development and operations by contacting the maintainer directly, rather than through public PRs; see Contact below.

See [docs/plan/01-overview-and-principles.md §1.6.3](docs/plan/01-overview-and-principles.md#163-소스-공개-및-참여-정책) (Korean) for details.

## Operating model

SCLS operates on a free + freemium (F2P) model. Until a paid product is introduced, operating costs are covered through donations. See [docs/plan/01-overview-and-principles.md §1.6.2](docs/plan/01-overview-and-principles.md#162-운영-형태) (Korean) for details.

## Development plan documents

The full development plan is organized by topic in [docs/plan/](docs/plan/README.md) (Korean only, for now):

1. [Overview and core principles](docs/plan/01-overview-and-principles.md)
2. [Target users and scope](docs/plan/02-users-and-scope.md)
3. [System architecture and domain model](docs/plan/03-architecture-and-domain.md)
4. [Database design](docs/plan/04-database-design.md) ([ERD & full DDL](docs/plan/database/erd.md))
5. [Object storage and collection pipeline](docs/plan/05-storage-and-collection.md)
6. [Localization, translation, glossary](docs/plan/06-i18n-translation-glossary.md)
7. [Admin dashboard](docs/plan/07-admin-dashboard.md)
8. [SCLS API and ICS design](docs/plan/08-api-and-ics.md)
9. [Search and notifications](docs/plan/09-search-and-notifications.md)
10. [Infrastructure, ops, security](docs/plan/10-infra-ops-security.md)
11. [Roadmap and success criteria](docs/plan/11-roadmap-and-success.md)

Earlier single-document versions (v1–v3) are archived in [docs/legacy/](docs/legacy/).

## Current status

- [x] Project name finalized: Subculture Link Stage (SCLS)
- [x] Planning docs split by topic
- [x] Admin authentication model (3-tier permission structure) finalized
- [x] Operating model and open-source scope finalized
- [x] PostgreSQL ERD design baseline documented
- [x] Repository structure finalized (this public repository for docs and future Onstage + private `scls-platform` monorepo)
- [x] Phase 1 Core MVP development started
- [ ] Phase 1 Core MVP — in progress
- [ ] Initial API implementation — in progress (core data CRUD, root admin login, public GET API, and ICS feeds implemented)
- [ ] Initial Backstage implementation — in progress (manual event, schedule, and reference data management UI, plus ko/en/ja UI implemented)
- [x] Localizations (multilingual content) CRUD API/UI implemented
- [x] At least 20 test events registered (22 — see [11-roadmap-and-success.md](docs/plan/11-roadmap-and-success.md))
- [x] Initial deployment of Backstage and the API (Backstage: Cloudflare Workers, API: Fly.io Tokyo — being tested on temporary domains)
- [ ] Official domain finalized and connected
- [ ] Subculture Onstage — started. Home page, event list with filters and search, event details, ko/ja/en, and ICS subscription links implemented in `apps/onstage` (SvelteKit); not yet deployed because no official domain is connected

See [docs/plan/11-roadmap-and-success.md](docs/plan/11-roadmap-and-success.md) (Korean) for the full roadmap and checklist.

## Contact

For development/operations participation, partnerships, or other inquiries: `biz@soiv-studio.xyz`

## License

[Apache License 2.0](LICENSE) © 2026 SOIV Studio

Unless otherwise noted, Apache-2.0 applies to this public repository’s project, development and design documentation, ERDs, reference DDL, roadmap, legacy documents, and source code, including the Subculture Onstage source in `apps/onstage`.

See [NOTICE](NOTICE) for the copyright notice and the sources of third-party assets used by Onstage (flag SVGs and icons). This license does not cover implementations in the separate private `scls-platform` repository; third-party materials with their own license notices remain subject to those terms. This change does not retroactively revoke rights granted for versions previously provided under the MIT License.
