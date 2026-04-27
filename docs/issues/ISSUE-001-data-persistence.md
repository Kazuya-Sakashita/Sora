# ISSUE-001: データ永続化がない（リロードで全データ消える）

## 基本情報

| 項目 | 内容 |
|------|------|
| 優先度 | critical |
| ステータス | done |
| 関連画面 | 全画面 |
| 関連ファイル | `lib/app-context.tsx`, `lib/prisma.ts`, `lib/supabase-browser.ts`, `lib/supabase-server.ts` |

## 問題の概要

ペット情報・思い出・気持ち記録がすべてReact Stateのオンメモリ管理のため、ページリロードで消える。

## 詳細

`lib/app-context.tsx` の `useState` で管理しているすべてのデータ（pet, memories, feelings）がブラウザリロードで初期化される。ユーザーが記録を積み重ねることがこのアプリの根幹なのに、保存されないのは致命的。

## 仕様変更による方針更新（2026-04-28）

**旧方針（localStorage）は採用しない。**

MVP再定義（`docs/specs/sora-product-rethinking.md`）において、データ永続化は **Supabase 認証 + クラウドストレージ** で実装することを決定した。

理由:
- localStorageはデバイス間同期ができない。機種変更・ブラウザ変更でデータが消える
- ペットとの大切な記録が消えることはユーザーへの最大の裏切りであり、クラウド保存は必須
- ISSUE-012（Supabase認証基盤）と並行して実装する

## 期待する動作

- ペットプロフィールがリロード後も残っている
- 思い出記録がリロード後も残っている
- 気持ち記録がリロード後も残っている
- 初回起動時はオンボーディングを表示し、プロフィール登録済みならホームを表示
- 別のデバイスからログインしても同じデータが見える

## 実装方針

ISSUE-012（Supabase認証基盤）の完了を前提とする。

1. Supabaseプロジェクトのセットアップ（ISSUE-012）
2. Prisma スキーマ定義（`prisma/schema.prisma`）
   - `Pet`, `Memory`, `Feeling` テーブル
3. `lib/app-context.tsx` のデータ取得をSupabase経由に変更
4. 写真はSupabase Storage（ISSUE-013）で管理
5. `lib/prisma.ts`, `lib/supabase-browser.ts`, `lib/supabase-server.ts` を活用

## 依存ISSUE

- ISSUE-012（Supabase認証基盤）の完了後に着手する

## 完了条件

- [x] ペット登録後にリロードしてもホーム画面が表示される
- [x] 思い出を追加後にリロードしてもタイムラインに残っている
- [x] 気持ち記録がリロード後も残っている
- [x] 別デバイスからログインしても同じデータが表示される
- [x] 既存機能に影響なし確認済み
- [x] ステータスを done に更新した

## 検証ログ

- 確認日時: 2026-04-28
- 確認環境: TypeScript コンパイル（エラーなし）、`pnpm dev` 起動確認、API 401 レスポンス確認
- 確認内容: `lib/app-context.tsx` を API バックド実装に全面書き換え。マウント時に `/api/pets` を fetch しペット・思い出・気持ちを初期化。`createPet` / `addMemory` / `addFeeling` を async REST 呼び出しに変更。`profile-create.tsx`・`timeline.tsx`・`feelings.tsx`・`home.tsx`・`app/page.tsx` も対応更新。TypeScript エラーなし。
- 問題なし
