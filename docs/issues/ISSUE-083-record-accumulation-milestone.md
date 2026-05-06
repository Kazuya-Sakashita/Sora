# ISSUE-083: alive期の記録30件達成時に「積み重なり実感」カードをホームに表示する

name: ISSUE-083
type: improvement
priority: High
status: open

---

## 背景

alive期のユーザーは記録を続けているが、「この記録が積み重なっている」という実感を得る仕組みがない。streak（連続記録日数）はあるが、これは「毎日続けているか」の指標であり「どれだけ残ってきたか」の蓄積感とは異なる。

3ヶ月（約90日）継続すると30件前後の記録が溜まる。このタイミングは、alive期ユーザーが静かに離脱し始めるリスクが高い時期でもある。「30件の思い出がここに積もっています」というメッセージが、継続の意義を再確認させるフックになる。

## 問題

```tsx
// home.tsx — memories.length に基づく蓄積感の通知が存在しない
// streak（連続日数）は日々の継続に焦点が当たっており、蓄積量を表現していない
```

alive期ユーザーが30件記録を達成しても、アプリから何のリアクションもない。

## 目的

`memories.length` が初めて30件を超えた時点で、ホームに1回限りのdismissableカードを表示し、「記録が積み重なっている = この子との時間が形として残っている」という実感を届ける。

## スコープ

- 表示条件:
  - `pet.status === "alive"`
  - `memories.length >= 30`
  - localStorage に `sora:milestone-30-records-{petId}` が存在しない
- カードUI:
  - 絵文字: `🌿`
  - テキスト: 「{pet.name}との30件の思い出が残っています。この記録が、いつかSoraの言葉になります。」
  - 閉じるボタン: `sora:milestone-30-records-{petId}` を localStorage に保存してdismiss
- 表示位置: ホームの streakバッジ直下 / 日数カードとdaily questionの間
- スタイル: `bg-white/60 backdrop-blur-xl border border-white/40` の静かなカード
- rainbow_bridge期には表示しない（milestone は alive 期専用）

## やらないこと

- 60件・100件の追加マイルストーン（最初は30件のみ、効果確認後に拡張）
- アニメーション・confetti等のゲーミフィケーション演出
- プッシュ通知との連動

## 受け入れ条件

- [ ] alive期でmemories.length >= 30 の場合にカードが表示される
- [ ] 閉じると以後は表示されない（localStorage flag）
- [ ] rainbow_bridge期には表示されない
- [ ] `pnpm tsc --noEmit` 通過
- [ ] `pnpm test` 全通過
- [ ] 既存home.tsx機能を壊していない

## 確認観点

- ユーザーの心を傷つけない（数値の可視化が「記録しないと恥ずかしい」プレッシャーにならない）
- Soraらしさを壊していない（静かな、穏やかなカード）
- AI依存を強めすぎていない
- 既存機能を壊していない
