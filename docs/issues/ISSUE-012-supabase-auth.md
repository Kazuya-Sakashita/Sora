# ISSUE-012: Supabase認証基盤を実装する

## 基本情報

| 項目 | 内容 |
|------|------|
| 優先度 | critical |
| ステータス | done |
| 関連画面 | 認証画面（新規）, 全画面 |
| 関連ファイル | `lib/auth.ts`, `lib/supabase-browser.ts`, `lib/supabase-server.ts`, `middleware.ts`, `app/auth/` |

## 問題の概要

Supabase認証基盤が未実装。ISSUE-001（データ永続化）の前提となる最重要インフラタスク。

## 詳細

MVP再定義（`docs/specs/sora-product-rethinking.md`）において、データ永続化はSupabaseクラウドで実装することを決定した。認証基盤はその前提条件であり、最初に完了させる必要がある。

既存ファイルの現状:
- `lib/auth.ts` — 作成済みだが実装内容を確認・完成させる必要がある
- `lib/supabase-browser.ts` — 作成済み
- `lib/supabase-server.ts` — 作成済み
- `middleware.ts` — 作成済み
- `app/auth/` — ディレクトリ存在確認が必要

## 期待する動作

- メールアドレス + パスワード でアカウント作成・ログインができる
- Google OAuth でログインができる
- Apple OAuth でログインができる（iOS対応）
- 未ログイン状態でアクセスするとログイン画面にリダイレクトされる
- ログイン状態はセッションとして永続化される
- ログアウトができる

## 実装方針

1. Supabaseプロジェクトの環境変数を確認（`.env.local`）
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. `lib/supabase-browser.ts` の実装を確認・完成
3. `lib/supabase-server.ts` の実装を確認・完成
4. `middleware.ts` の認証ミドルウェアを確認・完成
5. `app/auth/login/page.tsx`, `app/auth/signup/page.tsx` を実装
6. `lib/auth.ts` のヘルパー関数を完成
7. ログイン状態に応じたルーティング（未ログイン→ログイン画面、ログイン済み→ホーム）

## 依存関係

- このISSUEが完了するまで、ISSUE-001, 013, 014 は着手しない

## 完了条件

- [x] Google / Apple OAuthでログインできる（SNSログインのみに方針変更）
- [x] 未ログインで `/` にアクセスするとログイン画面にリダイレクトされる
- [x] ログイン後にホーム画面が表示される
- [x] ログアウトが機能する（設定画面から）
- [x] ログイン中のメールアドレスが設定画面に表示される
- [x] セッションがブラウザを閉じても維持される
- [x] ステータスを done に更新した

## 方針変更メモ

メール/パスワード認証は採用しない。Google / Apple OAuthのみとする（モバイルファーストの観点から）。

## 検証ログ

- 確認日時: 2026-04-28
- 確認内容: ログイン画面（Google/Apple OAuth）、コールバックルート、ミドルウェア、設定画面のユーザー表示＋ログアウトボタンを確認。TypeScriptエラーなし。
- 問題なし
