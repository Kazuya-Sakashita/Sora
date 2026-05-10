# ISSUE-087: alive期Sora+に月次記録サマリーカードを追加する

name: ISSUE-087
type: improvement
priority: High
status: done

---

## 背景

Sora+ の主要価値である「月次AIメモリーレター（ことば）」は rainbow_bridge 期にのみ利用できる。alive 期のユーザーが Sora+ に加入しても、現時点で届く追加価値は「マイルストーンカード保存」のみ。

alive 期ユーザーが Sora+ に加入した翌月も「何も変わっていない」と感じると解約につながる。alive 期の Sora+ 価値として、今月の記録をふりかえる月次サマリーカードを提供する。

## 問題

```tsx
// home.tsx — alive期のSora+に特別な体験がない
// plan === "PLUS" && pet.status === "alive" → 通常UIと同じ
```

## 目的

alive 期 Sora+ ユーザーが毎月1回、今月の記録の「かたち」を受け取れる体験を作る。AIを使わず、記録データから静的に生成するサマリーカードで実現する。

## スコープ

- `home.tsx` に以下を追加:
  - 表示条件:
    - `plan === "PLUS"` かつ `pet.status === "alive"`
    - 当月の記録が1件以上ある
    - localStorage に `sora:plus-summary-seen-{petId}-{year}-{month}` がない
  - カードUI:
    - 絵文字: `📖`
    - タイトル: 「{month}月の{pet.name}との記録」
    - 内容（静的計算）:
      - 「{件数}件の思い出を残しました」
      - 最も多かった気持ちタグ（あれば）: 「{tag}な瞬間が多かった月でした」
      - 写真を撮った記録数（photoUrls が存在するもの）: 「{枚}枚の写真とともに」
    - dismissボタン: localStorage に保存して非表示
    - 表示位置: ホームの「今月のひとこと」カードの上
  - 計算はフロントエンドのみ（API呼び出しなし）

## やらないこと

- AI によるサマリー文章生成
- PDF / 画像出力
- alive 期のレター生成機能解放

## 受け入れ条件

- [ ] alive 期 Sora+ ユーザーに当月のサマリーカードが表示される
- [ ] 記録0件のときは表示されない
- [ ] dismissで今月は再表示されない
- [ ] rainbow_bridge期・FREE プランには表示されない
- [ ] `pnpm tsc --noEmit` 通過
- [ ] `pnpm test` 全通過

## 確認観点

- AIを使わずにSora+の価値を届けている
- Soraらしい静かな表示
- 「数値の押しつけ」にならない文言設計
