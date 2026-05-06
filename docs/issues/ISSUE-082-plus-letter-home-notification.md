# ISSUE-082: Sora+月次レター生成後にホームで通知カードを表示する

name: ISSUE-082
type: improvement
priority: Critical
status: open

---

## 背景

Sora+の月次AIメモリーレターは、ユーザーが Settings → 「月次AIレター」に自分でアクセスしない限り存在に気づかない。プッシュ通知もなく、ホーム画面にも表示されない。

月次レターはSora+の最大の差別化価値であり、「AIが自分のペットのことを考えてくれた手紙」という体験は感情的インパクトが高い。しかし現状、その価値体験がユーザーに「届いていない」。

## 問題

```tsx
// home.tsx — PLUS月次レターはhome.tsxで一切参照されていない
// Settings内でしか確認できない
```

PLUSユーザーが月次レターを受け取っても（Settingsから生成済みの場合）、ホームには何も表示されない。「届いた感」が設計されていない。

## 目的

Sora+ユーザーが今月の月次レターを受け取った（生成済み）タイミングで、ホーム画面にdismissableな通知カードを表示する。月1回の強い感情フックとして機能させる。

## スコープ

- `home.tsx` に以下を追加:
  - `plan === "PLUS"` かつ `pet` が存在する場合
  - `GET /api/pets/{petId}/letters` を呼び、今月分のレターが存在するか確認
  - 今月分のレターが存在し、かつ `sora:plus-letter-notified-{petId}-{year}-{month}` が localStorage にない場合
  - dismissableカードを表示:
    - 絵文字: `✉️`
    - タイトル: 「今月の手紙が届いています」
    - サブテキスト: `{pet.name}との{month}月の記録から、Soraが手紙を書きました`
    - ボタン: 「読む」→ `setCurrentScreen("settings")` に遷移
    - 閉じるボタン: `sora:plus-letter-notified-{petId}-{year}-{month}` を localStorage に保存してdismiss
- lettersのfetchは月1回限り（既存のplan fetchと同様）
- エラー時はサイレントに無視（カード非表示）

## やらないこと

- 月次レターの自動生成トリガー
- プッシュ通知との統合
- Settings内のレター表示UIの変更

## 受け入れ条件

- [ ] Sora+ユーザーが今月分のレターが存在する場合、ホームに通知カードが表示される
- [ ] 「読む」ボタンでSettings画面に遷移する
- [ ] 閉じるボタンで今月は再表示されない
- [ ] FREEユーザーにはカードが表示されない
- [ ] `pnpm tsc --noEmit` 通過
- [ ] `pnpm test` 全通過
- [ ] 既存home.tsx機能を壊していない

## 確認観点

- ユーザーの心を傷つけない
- Soraらしさを壊していない（大きすぎない通知デザイン）
- AI依存を強めすぎていない
- 既存機能を壊していない
