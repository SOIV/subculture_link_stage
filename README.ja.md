# Subculture Link Stage (SCLS)

[한국어](README.md) | [English](README.en.md) | [日本語](README.ja.md)

> 韓国・日本をはじめ世界各地のオンライン・オフラインのサブカルチャー・ゲーム関連公式イベント情報を収集・確認・翻訳する、多言語のリレーショナルなイベントデータプラットフォーム。作品/IP・イベントシリーズ・個別イベント・日程・会場・主催者・参加者/出演者・タグの関係を構造化し、Web/API/ICSや外部サービスで再利用できる形で提供することを目指します。

SCLSは現在、**初期開発段階（Phase 1 Core MVPを開発中）**です。企画・設計ドキュメントと今後のSubculture Onstageのソースは、この公式公開リポジトリ（`Subculture_Link_Stage`）で管理します。SCLS API、Subculture Backstage、内部サービスは別の非公開リポジトリ `scls-platform` で開発しており、API・Backstageの一部機能は実装済みです。このリポジトリにはまだOnstageのコードはありません。開発計画と実装状況は韓国語で [docs/plan/](docs/plan/README.md) にまとめています。

## なぜ作るのか

- 韓国国内のイベント情報をまとめるアプリはすでに存在しますが、日本を含む海外イベントまで横断的に扱うサービスは限られています。
- Google Calendarなどからそのまま購読できる統合ICSフィードとして、サブカルチャーのイベント情報を提供するサービスも限られています。
- SCLSは**海外を含む統合イベント情報の提供とICSフィードの公開**を核心的な差別化ポイントとしています。

詳しい背景は [docs/plan/01-overview-and-principles.md](docs/plan/01-overview-and-principles.md)（韓国語）を参照してください。

## サービス構成

以下は、開発中の機能と今後の計画を含むサービス構成です。

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

## 技術スタック（現在および予定）

| 領域 | スタック |
|---|---|
| Backend | Node.js + TypeScript + Fastify（初期実装） |
| Backstage | React + Vite + TanStack Router/Query + Tailwind v4、ko/en/ja UI（`i18next`、初期実装） |
| Onstage | Svelte/SvelteKit（予定・未着手） |
| DB | PostgreSQL (Supabase) |
| ORM | Prisma（Phase 1のschema/migration適用済み） |
| Queue | Redis + BullMQ（予定） |
| Storage | Cloudflare R2 / S3（予定） |
| Search | 公開検索APIの初期実装済み。PostgreSQL FTS → pgvectorへの拡張を計画（データ蓄積後） |
| ICS | 基本フィードの初期実装済み。ical-generatorはライブラリ候補 |
| CDN/DNS | Cloudflare（運用計画） |

インフラ・運用計画の詳細は [docs/plan/10-infra-ops-security.md](docs/plan/10-infra-ops-security.md)（韓国語）を参照してください。

## リポジトリの公開範囲

- **公式公開リポジトリ — `Subculture_Link_Stage`（このリポジトリ）**: プロジェクト・開発ドキュメント、アーキテクチャ・データモデル、ERD・参考用DDL、Roadmap、Legacy設計文書を管理します。今後のOpenAPI/API開発者向けドキュメントとSubculture Onstageのソースもここに含めます。ERD・DDLは設計の参考資料であり、本番DBのダンプや非公開ORM schema/migrationとの完全な一致を意味しません。
- **非公開の実装 — `scls-platform`**: SCLS APIサーバー、Subculture Backstage、Collector/Worker、Scheduler、実際のDB migration/ORM schema、その他の内部サービスと運用実装を管理します。
- サービス実装のうち、**Subculture Onstage**（ユーザー向け公開Web）のソースを公開し、UI/UX・デザインなどの外部貢献を受け入れる予定です。独立した `scls-onstage` 公開リポジトリを前提とはしていません。このリポジトリ内のフロントエンドの配置先は未定です。
- OpenAPI仕様の公開（利用方法の公開）とAPIサーバーのソースコード公開は別です。
- 非公開領域の共同開発・運営にも参加可能です。公開PRではなく、下記の連絡先への個別問い合わせを通じて進めます。

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
- [x] PostgreSQL ERDの設計基準を整理
- [x] リポジトリ構造確定（この公開リポジトリで文書・今後のOnstageを管理 + `scls-platform` 非公開Monorepo）
- [x] Phase 1 Core MVPの開発に着手
- [ ] Phase 1 Core MVP — 開発中
- [ ] APIの初期実装 — 開発中（基本データCRUD、ルート管理者ログイン、Public GET API・ICS feedsは実装済み）
- [ ] Backstageの初期実装 — 開発中（イベント・日程・基本データの手動管理UI、ko/en/ja UIは実装済み）
- [ ] Localizations CRUD API/UIおよびテストイベント20件以上の登録
- [ ] Subculture Onstage — 未着手。この公開リポジトリで開発予定

全体のロードマップとチェックリストは [docs/plan/11-roadmap-and-success.md](docs/plan/11-roadmap-and-success.md)（韓国語）を参照してください。

## お問い合わせ

開発・運営参加、提携などのお問い合わせ: `biz@soiv-studio.xyz`

## ライセンス

[MIT License](LICENSE) © 2026 SOIV Studio
