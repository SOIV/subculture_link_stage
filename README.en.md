# Subculture Link Stage (SCLS)

[한국어](README.md) | [English](README.en.md) | [日本語](README.ja.md)

> A multilingual event information platform that collects, reviews, and translates official subculture and gaming event information — including events in Korea, Japan, and online — and provides it through a website, API, ICS calendars, and external services.

The project is currently in the **planning stage (Phase 0)**; no code has been written yet. The full development plan is maintained in Korean at [docs/plan/](docs/plan/README.md).

## Why we're building this

- In Korea, apps already exist that aggregate domestic event information, but very few (if any) also cover overseas events, including those in Japan.
- There is essentially no service that offers this kind of event information as an ICS feed that can be subscribed to directly from Google Calendar and similar apps.
- SCLS's core differentiators are **unified event information covering overseas events, plus a public ICS feed**.

See [docs/plan/01-overview-and-principles.md](docs/plan/01-overview-and-principles.md) (Korean) for background.

## Services

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

## Tech stack (planned)

| Area | Stack |
|---|---|
| Backend | Node.js + TypeScript (evaluating Express / Fastify / NestJS) |
| Web | Next.js + React |
| DB | PostgreSQL |
| ORM | Prisma or Drizzle |
| Queue | Redis + BullMQ |
| Storage | Cloudflare R2 / S3 |
| Search | PostgreSQL FTS → pgvector (once data accumulates) |
| ICS | ical-generator |
| CDN/DNS | Cloudflare |

See [docs/plan/10-infra-ops-security.md](docs/plan/10-infra-ops-security.md) (Korean) for infrastructure and operations details.

## Open source scope

- Only **Subculture Onstage** (the public web app) will be open-sourced, to invite outside contributions in UI/UX and design — an area the maintainer is weaker in.
- The API server, Workers (collection/translation/notifications), and Subculture Backstage (admin web app) remain closed source. Publishing the OpenAPI spec (usage documentation) is separate from publishing source code.
- Participation in the closed-source areas happens through direct outreach to the maintainer rather than public PRs — see Contact below.

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
- [x] PostgreSQL ERD finalized
- [x] Repository structure finalized (2-repo: `scls-onstage` public + `scls-platform` private monorepo)
- [ ] Phase 1 (Core MVP) implementation started

See [docs/plan/11-roadmap-and-success.md](docs/plan/11-roadmap-and-success.md) (Korean) for the full roadmap and checklist.

## Contact

For development/operations participation, partnerships, or other inquiries: `biz@soiv-studio.xyz`

## License

[MIT License](LICENSE) © 2026 SOIV Studio
