# ISSUE-069: rainbow_bridge期のstreakバッジを「ともにいた日々」表示に変える

name: ISSUE-069
type: improvement
priority: High
status: done

---

## 背景

ホーム画面の「🔥 {streak}日連続記録中」バッジはalive期の記録継続モチベーションとして機能する。しかしrainbow_bridge期のユーザーにとって、このバッジは「記録しなかった日は途切れる」というプレッシャーを伴うゲーム的トーンを持っている。ペットを亡くした直後の人に競争的な表現を見せることは、Soraの感情設計と矛盾する。

## 問題

`home.tsx` のstreak表示がpet.statusを区別していない：

```tsx
{streak > 0 && (
  <span className="...">
    🔥 {streak}日連続記録中
  </span>
)}
```

rainbow_bridge期にも同じ文言が表示される。

## 目的

rainbow_bridge期のユーザーには、streakを「連続記録の競争」ではなく「記録を続けてきた愛情の蓄積」として伝える表示に変える。

## スコープ

- `pet.status === "rainbow_bridge"` の場合:
  - 🔥 絵文字をやめる
  - 「{streak}日連続記録中」→ 「{streak}日分の思い出が残っています」
  - スタイル: `bg-orange-50 border-orange-100 text-orange-500` → `bg-primary/5 border-primary/10 text-primary/60`
- `pet.status === "alive"` の場合: 現状の🔥バッジのまま変更なし

## やらないこと

- streak計算ロジックの変更
- alive期のバッジデザイン変更
- streak数値そのものの非表示

## 受け入れ条件

- [ ] rainbow_bridge期には🔥バッジが表示されない
- [ ] rainbow_bridge期には「{streak}日分の思い出が残っています」が表示される
- [ ] alive期は現状の🔥バッジのまま
- [ ] `pnpm tsc --noEmit` 通過
- [ ] `pnpm test` 全通過
- [ ] gstackで動作確認済み
