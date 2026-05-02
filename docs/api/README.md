# API駆動開発 運用ガイド

## 基本方針

**OpenAPI First** — APIの追加・変更はすべて `openapi.yaml` の更新から始める。  
コードを先に書かない。定義が契約であり、フロント・バック双方の実装の根拠になる。

---

## API追加手順

```
1. openapi.yaml にエンドポイントを追加（パス・メソッド・req/res・エラー）
2. ISSUEを作成して変更内容を記録
3. フロント側: 定義に合わせてAPI呼び出しコードを実装
4. （将来）バック側: 定義に合わせてルートを実装
5. 動作確認してISSUEをclose
```

## API変更手順

```
1. 既存の openapi.yaml の該当箇所を修正
2. 破壊的変更の場合: ISSUEを立てて影響範囲を確認してから実施
3. フロント・バック双方の実装を更新
4. 動作確認
```

---

## フロント・バック連携ルール

| ルール | 内容 |
|--------|------|
| 型の生成 | openapi.yamlからTypeScriptの型を生成する（将来対応） |
| エラー処理 | `application/problem+json` 形式で統一（後述） |
| レスポンス形式 | 成功は `data` キーにラップ、リストは `items` + `total` |
| 日時 | ISO 8601形式（`2026-04-24T10:00:00+09:00`） |

---

## 認証ルール

**MVP段階では認証なし（localStorage のみ）。**

将来実装時の方針（TODO）:
- NextAuth.js を使ったセッション管理
- Apple ID / Google OAuth
- API呼び出し時は `Authorization: Bearer {token}` ヘッダー

---

## エラーレスポンス統一形式

[RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457) に準拠。

```json
{
  "type": "https://sora-app.example/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "指定されたペットが見つかりません",
  "instance": "/api/pets/xxx"
}
```

| ステータス | 用途 |
|-----------|------|
| 400 | バリデーションエラー |
| 401 | 未認証 |
| 403 | 権限なし |
| 404 | リソースが存在しない |
| 422 | 意味的に不正なリクエスト |
| 500 | サーバーエラー |

---

## ファイル構成

```
openapi.yaml              # API定義（Single source of truth, プロジェクトルート）
docs/api/
├── README.md             # このファイル（運用ガイド）
└── API_DRIVEN_DEVELOPMENT.md  # API駆動開発ガイド
```
