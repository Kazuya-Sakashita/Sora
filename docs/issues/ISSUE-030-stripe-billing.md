# ISSUE-030: Stripe サブスク課金基盤を実装する

name: ISSUE-030
type: feature
priority: Critical
status: open

---

## 概要

Stripe を使った月額サブスクリプション課金基盤を実装し、Free / Sora+ プランを分岐させる。

## 背景

課金フローが存在しないため収益ゼロ。記録上限ゲート・年次レポート・フォトブックなど全課金機能の前提インフラ。最初に実装しなければ他の有料機能が成立しない。

## 目的

ユーザーが月額 ¥480 / 年額 ¥4,300 で Sora+ にアップグレードできる状態を作り、ARPUを生む。

## スコープ

- `prisma.User` に `plan: FREE | PLUS` フィールド・`stripeCustomerId`・`stripeSubscriptionId` 追加
- `POST /api/billing/checkout` — Stripe Checkout セッション生成（月額・年額 2プライス）
- `POST /api/billing/webhook` — Stripe Webhook で `checkout.session.completed` / `customer.subscription.deleted` を受け取りプラン反映
- 設定画面に「Sora+ にアップグレード」ボタン・現在のプラン表示を追加
- `lib/plan.ts` — `requirePlus(user)` ユーティリティ（402 を返す）

## 非スコープ

- Family プラン（ISSUE-034 と切り離す）
- iOS/Android IAP
- プロモーションコード

## 受け入れ条件

- [ ] Stripe Checkout から決済完了後、`user.plan` が `PLUS` になる
- [ ] Webhook 署名検証（`stripe.webhooks.constructEvent`）が通る
- [ ] サブスクキャンセル後に `plan` が `FREE` に戻る
- [ ] 設定画面にプラン名と「アップグレード」「管理」ボタンが表示される
