# ISSUE-094: rainbow_bridge期の気持ち記録選択肢をグリーフケアに特化する

name: ISSUE-094
type: improvement
priority: Medium
status: open

---

## 背景

現在の `feelings.tsx` の選択肢は alive 期・rainbow_bridge 期共通で以下の5択:

```
🥰 うれしい / 😌 おだやか / 😄 笑った / 😟 心配 / 💝 愛おしい
```

rainbow_bridge 期のユーザーは「悲しい」「つらい」「ぼーっとしている」「よくわからない」という感情を抱えることが多い。現在の選択肢はこれらを表現できない。「うれしい」「笑った」しか選べる喜び系感情に、ロスケアユーザーが自分の気持ちを当てはめることへの違和感がある。

## 問題

```tsx
// feelings.tsx — ペットステータスに関わらず同じ5択
const feelingOptions = [
  { emoji: "🥰", label: "うれしい", tag: "happy" },
  { emoji: "😌", label: "おだやか", tag: "calm" },
  { emoji: "😄", label: "笑った", tag: "fun" },
  { emoji: "😟", label: "心配", tag: "worried" },
  { emoji: "💝", label: "愛おしい", tag: "loving" },
]
// rainbow_bridge 期に適した「悲しい」「つらい」がない
```

## 目的

rainbow_bridge 期ユーザーが自分の感情を正確に記録できるよう、ステータスに応じた選択肢を提供する。「悲しみを記録できる場所」という信頼性がグリーフケアの核心。

## スコープ

- `feelings.tsx` を更新:
  - `pet.status === "rainbow_bridge"` のとき、以下の選択肢セットを使用:
    ```
    😢 悲しい (sad)
    😔 つらい (hard)
    😌 おだやか (calm)
    💝 愛おしい (loving)
    😶 よくわからない (numb)
    ```
  - `pet.status === "alive"` のときは現状の5択を維持
- `FeelingTag` 型に `"sad"` / `"hard"` / `"numb"` を追加（`api-types.ts`）
- APIスキーマ・openapi.yaml に新タグを追加
- 気持ちトレンドグラフ（`mood-trend.ts`）に新タグの表示色・ラベルを追加

## やらないこと

- 既存の "happy" / "fun" / "worried" タグの削除（過去データとの互換性維持）
- チャットAPIへのfeeling tag引き渡しの変更（既存のままでOK）
- 選択肢の5択を超える拡張（今回は5択固定）

## 受け入れ条件

- [ ] rainbow_bridge期のユーザーに「悲しい」「つらい」「おだやか」「愛おしい」「よくわからない」が表示される
- [ ] alive期には現状の5択が表示される（変化なし）
- [ ] 新タグで記録した気持ちがトレンドグラフに表示される
- [ ] TypeScript型エラーなし（FeelingTagに新タグ追加）
- [ ] `pnpm tsc --noEmit` 通過
- [ ] `pnpm test` 全通過

## 確認観点

- 「悲しい」を選ぶことへの心理的ハードルが低いコピー・デザインか
- 「よくわからない」は感情が麻痺した状態を安全に受け止める選択肢として機能しているか
- rainbow_bridge期から alive期に戻る（データ修正等）シナリオは考慮不要
