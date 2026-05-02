# ISSUE-039: zodバリデーション統一

name: ISSUE-039
type: chore
priority: Medium
status: open

---

## 概要

API ルートの入力バリデーションを `zod` で統一し、型安全かつ一貫したエラーレスポンスを実現する。

## 背景

現状の API ルートはリクエストボディのバリデーションが個別実装か未実装で、バリデーションエラー時のレスポンスが統一されていない。
zod スキーマを導入すると OpenAPI 定義との整合性チェックも容易になる。

## 目的

- API 入力バリデーションを型安全に統一する
- バリデーションエラー時に 400 + JSON エラーボディを一貫して返す

## スコープ

- `zod` のインストール
- 共通パーサーヘルパー `lib/validate.ts`（`parseBody<T>(schema, req)` → `{ data } | { error: Response }`）
- 主要 POST/PATCH ルートへの適用:
  - `POST /api/pets`
  - `PATCH /api/pets/[petId]`
  - `POST /api/pets/[petId]/memories`
  - `POST /api/pets/[petId]/feelings`
  - `POST /api/pets/[petId]/schedules`

## 非スコープ

- GET ルートのクエリパラメータバリデーション
- 全ルートへの一括適用（段階的に進める）

## API変更

- なし（既存エラーレスポンス構造に合わせる）

## 受け入れ条件

- [ ] 対象ルートで不正な入力に 400 が返る
- [ ] エラーレスポンスが `{ type, title, detail }` 形式
- [ ] `pnpm tsc --noEmit` が通過する
- [ ] バリデーションテストが追加されている

## テスト観点

- 正常系: 正しい入力でリクエストが通る
- 異常系: 必須フィールド欠如で 400
- 異常系: 型不正（文字列に数値期待など）で 400

## 完了確認

- [ ] ISSUEステータスを `done` に更新
- [ ] テスト追加・成功
- [ ] `pnpm tsc --noEmit` 通過
- [ ] ブラウザ動作確認
