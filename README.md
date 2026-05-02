# Sora — ペットとの毎日を残す場所

ペットとの日々の思い出を記録し、その積み重ねが将来のグリーフケアへ自然につながるアプリ。

> そばにいた時間が、ずっとそばにいてくれる。

## 技術スタック

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Package manager:** pnpm

## 開発環境のセットアップ

```bash
# 依存関係のインストール
pnpm install

# 開発サーバー起動
pnpm dev
```

`http://localhost:3000` をブラウザで開く。

## ディレクトリ構造

```
Sora/
├── app/                   # Next.js App Router
├── components/
│   ├── screens/           # 各画面コンポーネント
│   └── ui/                # shadcn/ui コンポーネント
├── lib/                   # ユーティリティ・Context
├── docs/
│   ├── specs/             # プロダクト仕様書
│   ├── api/               # API設計（OpenAPI）
│   ├── issues/            # ISSUEトラッキング
│   ├── prompts/           # Claude Code指示テンプレート
│   ├── reviews/           # 評価フレームワーク
│   └── ai-driven-development/ # 開発メソッド
└── CLAUDE.md              # 開発ガイドライン
```

## 開発方針

このプロジェクトはAI駆動 × API駆動で開発する。

- 詳細な開発ルールは [`CLAUDE.md`](./CLAUDE.md) を参照
- ISSUE管理は [`docs/issues/README.md`](./docs/issues/README.md) を参照
- 開発フローは [`docs/ai-driven-development/development-method.md`](./docs/ai-driven-development/development-method.md) を参照

## ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [仕様書](./docs/specs/pet-memory-care-app-spec.md) | プロダクト全体の仕様 |
| [OpenAPI](./openapi.yaml) | API設計（MVP） |
| [ISSUE一覧](./docs/issues/README.md) | 現在の課題と優先度 |
| [評価フレームワーク](./docs/reviews/app-evaluation.md) | HEART / AARRR評価 |
