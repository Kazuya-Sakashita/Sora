# ISSUE-XXX: タイトル

name: ISSUE-XXX
type: feature / fix / refactor / chore / docs / test
priority: Critical / High / Medium / Low
status: open

---

## 概要

（1行で何をするか）

## 背景

（なぜ必要か・現状の問題）

## 目的

（何を達成するか）

## スコープ

- （やること）

## 非スコープ

- （やらないこと）

## API変更

- あり / なし
- あり の場合: `docs/api/openapi.yaml` を先に更新すること

## 受け入れ条件

- [ ] （ユーザー視点の完了条件）

## テスト観点

- 正常系: （正常な入力・操作）
- 異常系: （不正な入力・権限なし）
- 認証: （未ログイン・権限不足）
- バリデーション: （入力チェック）
- OpenAPI一致: （レスポンス構造がyamlと一致）
- UI動作: （画面確認）

## 完了確認

- [ ] ISSUEステータスを `done` に更新
- [ ] OpenAPI更新（API変更あり の場合）
- [ ] テスト追加・成功
- [ ] `pnpm tsc --noEmit` 通過
- [ ] ブラウザ動作確認
- [ ] 既存ナビゲーション正常
