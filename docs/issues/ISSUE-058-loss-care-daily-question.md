# ISSUE-058: ロスケア期の「今日の問いかけ」を毎日表示する

name: ISSUE-058
type: improvement
priority: High
status: open

---

## 概要

`rainbow_bridge` 状態のユーザーは `recordedToday` が true になると「今日の問いかけ」カードが消える。ロスケア期ユーザーこそ毎日 AI が話しかけるべきで、記録済みかどうかに関わらず表示し続けるべき。

## 背景

現在のホーム画面の表示条件:

```tsx
{pet && dailyQuestion && !recordedToday && (
  // 今日の問いかけカード
)}
```

`!recordedToday` は「未記録ならリマインド」という意図だが、ロスケア期は記録=癒しのプロセスであり、記録後も追加の問いかけが有効。また `daily-question` API は `rainbow_bridge` 時に別プロンプトで感情的に深い問いかけを生成しているのに、1日1件記録したらそれが消えてしまう。最も孤独を感じているユーザーへの毎日の接触機会を失っている。

## 目的

- ロスケア期ユーザーが毎日 AI の問いかけと出会える場を確保する
- 「今日も話してくれますか」という継続的な関係を演出する
- Retention の改善（rainbow_bridge ユーザーの離脱防止）

## スコープ

- `home.tsx` の today の問いかけカード表示条件を変更
  - `alive` 状態: 現状維持（`!recordedToday` の場合のみ表示）
  - `rainbow_bridge` 状態: `recordedToday` の有無にかかわらず表示
- 表示位置は現状のまま（Days Counter の下）
- `rainbow_bridge` 時のカードコピーを微調整
  - 現在: 「タップして記録する」
  - 変更後: 「今日も残しませんか」

## 非スコープ

- `daily-question` API の変更
- 問いかけの内容・生成ロジックの変更
- 表示デザインの変更

## API変更

- なし

## 受け入れ条件

- [ ] `rainbow_bridge` 状態で今日記録済みの場合も問いかけカードが表示される
- [ ] `alive` 状態で今日記録済みの場合は問いかけカードが表示されない（現状維持）
- [ ] カードのサブコピーが `rainbow_bridge` 時は「今日も残しませんか」になる
- [ ] `pnpm tsc --noEmit` 通過
- [ ] `pnpm test` 全通過

## テスト観点

- `rainbow_bridge` + 記録済み → 問いかけカード表示
- `alive` + 記録済み → 問いかけカード非表示
- `alive` + 未記録 → 問いかけカード表示
- コピー分岐の確認
