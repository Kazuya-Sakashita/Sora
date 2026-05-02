# ISSUE-042: 課金成功後のWelcome画面

name: ISSUE-042
type: feature
priority: High
status: open

---

## 概要

Stripe Checkout 完了後に「Sora+ へようこそ」Welcome 画面を表示し、解放機能を3枚スライドで案内してからホームへ遷移する。

## 背景

現状は課金完了後にそのままアプリに戻るだけで、「何かが変わった感覚」がない。サブスク初月の解約率に直結する。課金直後の感動演出が継続率を左右する。

## 目的

- 課金後の満足感・期待感を高め、初月解約率を下げる
- 解放機能を明示して「元を取ろう」という行動を促す

## スコープ

- `app/billing/success/page.tsx` を新規作成
  - Stripe の `?session_id=` パラメータを受け取り、`/api/billing/plan` で PLUS 確認
  - 確認できない場合はホームへリダイレクト
  - 確認できた場合：3枚スライド表示
    - スライド1：「Sora+ へようこそ ✨」+ ブランドカラーのアニメーション
    - スライド2：解放機能一覧（フォトブック・年次レポート・記念カード・無制限記録）
    - スライド3：「最初のフォトブックを作りましょう」CTA → タイムラインへ
  - 「スキップ」ボタンでいつでもホームへ
- `app/api/billing/checkout/route.ts` の `success_url` を `/billing/success?session_id={CHECKOUT_SESSION_ID}` に変更

## 非スコープ

- Stripe Session の詳細情報（プラン名・金額）の表示
- ウェルカムメール送信

## API変更

- なし（checkout の success_url 変更のみ）

## 受け入れ条件

- [ ] Checkout 完了後に `/billing/success` へリダイレクトされる
- [ ] 3枚スライドが表示される
- [ ] 「はじめる」でホームへ遷移する
- [ ] plan が PLUS でない場合はホームへリダイレクトされる
- [ ] `pnpm tsc --noEmit` 通過

## テスト観点

- 正常系: PLUS ユーザーでウェルカム画面が表示される
- 異常系: FREE ユーザー（未課金）でアクセスするとリダイレクト
- UI動作: スライド遷移・スキップ動作
