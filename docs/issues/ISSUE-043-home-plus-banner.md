# ISSUE-043: ホームにSora+誘引バナーを常設

name: ISSUE-043
type: feature
priority: High
status: done

---

## 概要

Free ユーザーのホーム画面に「今月のフォトブックを作る」カードを常設し、Settings 以外の課金導線を確保する。

## 背景

現状、Plus へのアップグレード導線は Settings 画面か機能タップ時の 402 経由のみ。ホームを毎日開くユーザーに対して、Plus の存在を自然に伝える常設エントリポイントがない。

## 目的

- Plus 機能の認知率を上げる
- 記録が溜まってきたユーザーへの課金タイミングを逃さない

## スコープ

- `home.tsx` に以下の条件で GlassCard バナーを追加
  - 表示条件：`plan === "FREE"` かつ `memories.length >= 5`
  - 位置：月次ふりかえりカードの直下（なければ最近の思い出の直上）
  - コピー：「${pet.name}の今月をフォトブックにまとめよう 📷」
  - サブコピー：「Sora+ で毎月PDF保存できます」
  - ボタン：「Sora+ を見る」→ UpgradeModal を表示
  - ロックアイコン（`Lock` from lucide）をバナー右上に表示
- plan は `/api/billing/plan` を初回マウント時に fetch してステートに保持
- バナーは「閉じる」なし（恒常表示）

## 非スコープ

- Plus ユーザーへのバナー表示
- バナーのA/Bテスト機能

## API変更

- なし（`/api/billing/plan` は既存）

## 受け入れ条件

- [ ] memories 5件以上の Free ユーザーにバナーが表示される
- [ ] memories 4件以下では表示されない
- [ ] Plus ユーザーには表示されない
- [ ] ボタンタップで UpgradeModal が開く
- [ ] `pnpm tsc --noEmit` 通過

## テスト観点

- 正常系: Free + memories >= 5 でバナー表示
- 正常系: Free + memories < 5 でバナー非表示
- 正常系: Plus でバナー非表示
- UI動作: UpgradeModal 起動
