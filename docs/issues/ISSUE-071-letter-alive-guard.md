# ISSUE-071: ことば画面にalive期ガードを追加する

name: ISSUE-071
type: bug
priority: Critical
status: done

---

## 背景

`chat.tsx` はISSUE-064で `pet.status !== "rainbow_bridge"` のalive期ガードを実装した。しかし `letter.tsx`（ことば画面）には同様のガードがない。alive期のユーザーが「ことば」タブに入ると、AIが虹の橋を渡ったペット向けに設計された手紙生成フローが表示される。

APIは `POST /api/pets/{petId}/letters` でalive期の場合403を返すが、UIにはエラーが出るだけで「なぜ使えないか」「いつ使えるか」が伝わらない。

## 問題

```tsx
// letter.tsx — alive期でも手紙生成UIがそのまま表示される
export default function LetterScreen() {
  const { pet } = useApp()
  // alive期チェックなし → 生成ボタンを押すと403エラーが出る
```

## 目的

alive期ユーザーに対して `chat.tsx` と同じトーンで「今はまだこの場所ではない」を穏やかに伝え、記録に集中するよう誘導する。ロスケア後に使える機能として前向きに認知させる。

## スコープ

- `letter.tsx` の先頭部分に `pet.status !== "rainbow_bridge"` チェックを追加
- alive期の場合、以下のプレースホルダーUIを返す:
  - 絵文字: `🌱`
  - タイトル: 「まだこのことばはないかもしれない」
  - 説明: 「ことばは、記録を積み重ねた先に生まれます。\n今は、毎日のできごとを残していく時間です。」
  - ボタン: 「記録を見る」→ `setCurrentScreen("timeline")` に遷移
- スタイルは `chat.tsx` の alive期ガードUIに合わせる

## やらないこと

- letter.tsx の生成ロジック変更
- alive期向け別機能の実装
- APIガードの変更

## 受け入れ条件

- [ ] alive期ユーザーが「ことば」タブを開くとプレースホルダーUIが表示される
- [ ] rainbow_bridge期ユーザーには現状の手紙生成UIが表示される
- [ ] プレースホルダーの「記録を見る」ボタンでタイムライン画面に遷移する
- [ ] `pnpm tsc --noEmit` 通過
- [ ] `pnpm test` 全通過
- [ ] 既存導線を壊していない

## 確認観点

- ユーザーの心を傷つけない
- Soraらしさを壊していない
- alive期ユーザーに期待値を正しく持たせている
- 既存機能を壊していない
