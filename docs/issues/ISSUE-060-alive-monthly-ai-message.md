# ISSUE-060: alive 期ユーザー向け「今月のひとこと」カードをホームに追加する

name: ISSUE-060
type: feature
priority: High
status: open

---

## 概要

alive 状態のユーザーが体験できる AI 機能は「今日の問いかけ」だけ。ペットが生きているうちこそ長期利用と PLUS 転換を育てる期間だが、AI 価値が薄く離脱リスクが高い。月末 5 日間（26〜31 日）にホームへ「今月の〇〇へのひとこと」カードを表示し、AI が記録を読んで生成した短文を届ける。

## 背景

- `POST /api/pets/{petId}/letter/generate` は ISSUE-055 で実装済み
- rainbow_bridge 専用ガード（`status !== "RAINBOW_BRIDGE"` → 403）を外した alive 対応 API が必要
- 月次レター（Settings、Sora+ 専用）は 150〜200 字のフルレター。このカードは 50〜80 字の短文
- Free プランでも表示（AI 価値の先見せ）、Sora+ ではより深い月次レターへの導線を付ける

## 目的

- alive 期ユーザーに毎月 AI との接触機会を作る
- 「この記録、AIが読んでくれている」という感覚を伝える
- PLUS 転換の動機を月次で育てる

## スコープ

### API

- `POST /api/pets/[petId]/ai-message` を新規追加
  - alive / rainbow_bridge 両方対応（status ガードなし）
  - 直近 5 件の記録を元に 50〜80 字の短文を生成
  - レート制限: 1 ユーザー・1 日 3 回
  - Free・PLUS 両方利用可

### ホーム画面

- 表示条件: `pet.status === "alive"` かつ `today.getDate() >= 26` かつ `memories.length >= 3`
- `localStorage` キー `sora:monthly-message-{petId}-{year}-{month}` にキャッシュ（再 fetch 抑制）
- カードデザイン: GlassCard、左に ✨ アイコン、`pet.name}への今月のひとこと` ラベル
- カード下部に「毎月の記録から作る手紙は → Sora+」リンク（Free のみ表示）
- 「もう一度生成」ボタン: 1 回まで（localStorage に生成回数を保存）

### プロンプト調整

- 月次レター（`lib/letter.ts`）とは別の短文プロンプト
- 口調: やさしく・問いかけベース・50〜80 字
- 月の集約ではなく「今月記録を残してくれたこと」への感謝が主軸

## 非スコープ

- DB 永続化（localStorage キャッシュのみ）
- rainbow_bridge ユーザーへの表示（月次レターが既にある）
- 月次 cron での自動生成

## API変更

- あり
- `POST /api/pets/{petId}/ai-message` を `openapi.yaml` に追加

## 受け入れ条件

- [ ] 月末 5 日間、alive ユーザーのホームに「今月のひとこと」カードが表示される
- [ ] カードの文言にペット名・記録内容が反映されている
- [ ] 月が変わると自動的に消える（localStorage キーに年月含む）
- [ ] Free ユーザーに Sora+ への導線が表示される
- [ ] `pnpm tsc --noEmit` 通過
- [ ] `pnpm test` 全通過

## テスト観点

- 正常系: alive + 月末 + 記録 3 件以上 → カード表示
- 境界値: alive + 月末 + 記録 2 件以下 → カード非表示
- 境界値: alive + 月初（1〜25 日）→ カード非表示
- 正常系: rainbow_bridge → カード非表示
- 正常系: API 呼び出し → ペット名が含まれる
- 正常系: localStorage キャッシュがあれば API を呼ばない
