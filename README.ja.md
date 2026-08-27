# Subculture Link Stage (SCLS)

[한국어](README.md) | [English](README.en.md) | [日本語](README.ja.md)

> 韓国・日本・グローバルオンラインを含むサブカルチャー・ゲーム関連の公式イベント情報を収集・検証・翻訳し、Web、API、ICSカレンダー、外部サービスに提供する多言語イベント情報プラットフォーム

現在プロジェクトは**企画段階（Phase 0）**であり、まだコードは書かれていません。開発計画全体は韓国語で [docs/plan/](docs/plan/README.md) に整理されています。

## なぜ作るのか

- 韓国国内には国内限定のイベント情報をまとめて見せるアプリがすでに存在しますが、日本を含む海外イベントまで扱うサービスはほとんどありません。
- Google Calendarなどからそのまま購読できるICSフィード形式でこうしたイベント情報を提供するサービスも、事実上存在しません。
- SCLSは**海外を含む統合イベント情報の提供とICSフィードの公開**を核心的な差別化ポイントとしています。

詳しい背景は [docs/plan/01-overview-and-principles.md](docs/plan/01-overview-and-principles.md)（韓国語）を参照してください。

## サービス構成

| 名称 | 役割 |
|---|---|
| **Subculture Onstage** | ユーザー向け公開Web — イベント検索、詳細情報、カレンダー購読、通知、ユーザー提案 |
| **Subculture Backstage** | 管理者・運営用Web — 収集候補の検証、イベント・翻訳・用語集・ソースの管理 |
| **SCLS API** | Onstage、ICS、Discordボット、個人アプリなど外部サービスへのデータ提供 |

```text
[公式サイト / 公式SNS / チケット販売サイト / RSS / 手動報告]
                 ↓
          [Collector Workers] → 原本ドキュメント/スナップショット保存（PostgreSQL + Object Storage）
                 ↓
          [Analysis Pipeline] → マッチング / 分類 / 変更点比較
                 ↓
          [Change Proposal] → [管理者検証] → [公開DB]
                 ↓
    ┌────────────┼────────────┬────────────┐
  [REST API]  [ICS Feed]   [Web App]   [Notification]
```

全体アーキテクチャは [docs/plan/03-architecture-and-domain.md](docs/plan/03-architecture-and-domain.md)（韓国語）を参照してください。

## 技術スタック（予定）

| 領域 | スタック |
|---|---|
| Backend | Node.js + TypeScript（Express / Fastify / NestJSを検討中） |
| Web | Next.js + React |
| DB | PostgreSQL |
| ORM | Prisma または Drizzle |
| Queue | Redis + BullMQ |
| Storage | Cloudflare R2 / S3 |
| Search | PostgreSQL FTS → pgvector（データ蓄積後） |
| ICS | ical-generator |
| CDN/DNS | Cloudflare |

インフラ・運用計画の詳細は [docs/plan/10-infra-ops-security.md](docs/plan/10-infra-ops-security.md)（韓国語）を参照してください。

## ソース公開範囲

- **Subculture Onstage**（ユーザー向け公開Web）のみオープンソースとして公開します。運営者はUI/UX・デザイン面が弱いため、外部からの貢献を受け入れる目的です。
- APIサーバー、Worker（収集・翻訳・通知処理）、Subculture Backstage（管理者用Web）は非公開のまま維持します。OpenAPI仕様の公開（使用方法の公開）とソースコードの公開は別物です。
- 非公開領域の開発・運営への参加は、公開PRではなく下記の連絡先への個別問い合わせを通じて行います。

詳細は [docs/plan/01-overview-and-principles.md §1.6.3](docs/plan/01-overview-and-principles.md#163-소스-공개-및-참여-정책)（韓国語）を参照してください。

## 運営形態

無料＋部分有料化（F2P）モデルで運営し、有料化商品が登場するまでは寄付（ドネーション）ベースで運営費を賄います。詳細は [docs/plan/01-overview-and-principles.md §1.6.2](docs/plan/01-overview-and-principles.md#162-운영-형태)（韓国語）を参照してください。

## 開発計画ドキュメント

開発計画全体はテーマ別に韓国語で [docs/plan/](docs/plan/README.md) にまとめられています。

1. [概要及び核心原則](docs/plan/01-overview-and-principles.md)
2. [目標ユーザー及び機能範囲](docs/plan/02-users-and-scope.md)
3. [システム構造及びドメインモデル](docs/plan/03-architecture-and-domain.md)
4. [データベース設計](docs/plan/04-database-design.md)（[ERD・全体DDL](docs/plan/database/erd.md)）
5. [オブジェクトストレージ及び収集パイプライン](docs/plan/05-storage-and-collection.md)
6. [多言語、翻訳、用語集](docs/plan/06-i18n-translation-glossary.md)
7. [管理者ダッシュボード](docs/plan/07-admin-dashboard.md)
8. [SCLS API及びICS設計](docs/plan/08-api-and-ics.md)
9. [検索及び通知](docs/plan/09-search-and-notifications.md)
10. [インフラ、データ保管、セキュリティ、運用](docs/plan/10-infra-ops-security.md)
11. [開発段階及び成功基準](docs/plan/11-roadmap-and-success.md)

過去バージョン（v1〜v3）の単一ドキュメントは [docs/legacy/](docs/legacy/) に保管されています。

## 現在の進行状況

- [x] プロジェクト名確定: Subculture Link Stage (SCLS)
- [x] 計画ドキュメントのテーマ別分離
- [x] 管理者認証方式（3段階権限構造）確定
- [x] 運営形態及びソース公開範囲確定
- [x] PostgreSQL ERD確定
- [x] リポジトリ構造確定（2-Repo構成: `scls-onstage` 公開 + `scls-platform` 非公開Monorepo）
- [ ] Phase 1（Core MVP）実装着手

全体のロードマップとチェックリストは [docs/plan/11-roadmap-and-success.md](docs/plan/11-roadmap-and-success.md)（韓国語）を参照してください。

## お問い合わせ

開発・運営参加、提携などのお問い合わせ: `biz@soiv-studio.xyz`

## ライセンス

[MIT License](LICENSE) © 2026 SOIV Studio
