# ISSUE-034: 家族共有（ペット共同オーナー）を実装する

name: ISSUE-034
type: feature
priority: High
status: open

---

## 概要

招待リンクで複数ユーザーが同じペットの記録を共有・追記できる家族共有機能を実装する。

## 背景

複数人が依存することで解約コストが上がり、Family プラン（¥780/月）への布石になる。「家族みんなで残す」は記録継続の最強動機でもある。

## 目的

世帯単位での課金（ARPU 向上）と解約率低下を実現する。1契約に複数人を依存させる構造を作る。

## スコープ

- `PetMember` テーブル追加（`petId`, `userId`, `role: OWNER | MEMBER`, `createdAt`）
- `POST /api/pets/:petId/invite` — 招待トークン（JWT、24h有効）生成・返却
- `POST /api/invite/accept` — トークン検証 → `PetMember` 登録
- ペット設定画面に「家族を招待する」UI 追加（招待リンクをコピー）
- 既存 memories / feelings / schedules API に PetMember 経由のアクセス許可を追加
- ヘッダーのペット選択 UI に共有ペット（MEMBER として参加しているペット）を表示

## 非スコープ

- 権限別の編集制限（MVP は全員フル権限）
- Family プランの価格設定・Stripe 連携（ISSUE-030 完了後に追加）
- メール招待（MVP はリンクコピーのみ）

## 受け入れ条件

- [ ] 招待リンクから別アカウントが同じペットのタイムラインを閲覧できる
- [ ] MEMBER が追加した記録が OWNER のタイムラインに表示される
- [ ] 24h経過後の招待トークンは無効
- [ ] OWNER はメンバー一覧・除外ができる
