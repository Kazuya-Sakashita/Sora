# ISSUE-037: openapi.yaml を現行実装と完全同期させる

name: ISSUE-037
type: refactor
priority: High
status: done

---

## 概要

ISSUE-030〜034 で追加した API がすべて openapi.yaml に未定義のまま運用されている。yaml を現行実装と同期させる。

## 背景

ISSUE-030〜034 の実装時に「OpenAPIを更新せずにAPIを追加」というルール違反が継続して発生した。yaml がソース・オブ・トゥルースとして機能していない状態を解消する。

## スコープ

- `GET /pets` 一覧エンドポイント追加
- Pet スキーマに `broughtAt`・`role` フィールド追加
- 招待・メンバー管理 API 4本追加
- 課金（Stripe）API 4本追加
- 年次レポート・OGP・シェア・Push API 5本追加
- 新スキーマ追加: `PetRole`, `PetMember`, `BillingPlan`, `CheckoutInterval`, `ShareMemory`
- タグ追加: `billing`, `sharing`, `push`, `members`

## 受け入れ条件

- [ ] すべての実装済みエンドポイントが yaml に定義されている
- [ ] Pet レスポンスの全フィールドが yaml スキーマと一致している

## 完了確認

- [ ] ISSUEステータスを `done` に更新
- [ ] `docs/api/API_DRIVEN_DEVELOPMENT.md` の既知乖離一覧を削除
