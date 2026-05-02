# ISSUE-038: openapi-typescript導入 + 型自動生成

name: ISSUE-038
type: chore
priority: High
status: open

---

## 概要

`openapi-typescript` を導入し、`openapi.yaml` から TypeScript 型を自動生成する基盤を整える。

## 背景

現状フロント/バックエンドの型は手書きで管理されており、OpenAPI定義との乖離が起きやすい。
`openapi-typescript` で型を自動生成すれば、openapi.yaml を更新するだけで型が追従し、安全なAPI連携が保証される。

## 目的

- openapi.yaml を唯一の型ソースにする
- 手書き型の重複を排除し、変更時の追従コストを下げる

## スコープ

- `openapi-typescript` のインストール
- `package.json` に `gen:types` スクリプト追加（`openapi-typescript openapi.yaml -o types/api.ts`）
- 型生成を実行し `types/api.ts` をコミット
- `lib/app-context.tsx` の Pet 型など、主要な手書き型を生成型に置き換えるパターンを1ファイル適用してガイドを示す
- `types/api.ts` を `.gitignore` から除外（生成物だが変更追跡する）

## 非スコープ

- 全ファイルの型置き換え（段階的に進める）
- `openapi-fetch` の導入（別ISSUEで対応）

## API変更

- なし

## 受け入れ条件

- [ ] `pnpm gen:types` で `types/api.ts` が生成される
- [ ] 生成された型がコンパイルエラーなく使用できる
- [ ] `pnpm tsc --noEmit` が通過する

## テスト観点

- 正常系: `pnpm gen:types` が成功する
- 正常系: 生成型を使ったファイルで型エラーが出ない

## 完了確認

- [ ] ISSUEステータスを `done` に更新
- [ ] テスト追加・成功
- [ ] `pnpm tsc --noEmit` 通過
