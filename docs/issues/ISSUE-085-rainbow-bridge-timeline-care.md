# ISSUE-085: rainbow_bridge移行後の時間軸ケアカードを実装する

name: ISSUE-085
type: improvement
priority: Critical
status: done

---

## 背景

現在の実装では、rainbow_bridge移行後72時間以内に「そばにいます」カードが表示される（ISSUE-062）。しかし悲嘆のピークは移行後2〜4週間に来ることが多く、72時間後にSoraが無言になる設計は最もサポートが必要なタイミングを逃している。

```tsx
// home.tsx — 移行後72h以降、何もケアがない
// elapsed < 72 * 60 * 60 * 1000 のみ
```

## 問題

移行直後は welcome card と guidance modal があるが、72h を過ぎると通常UIに戻る。実際の悲嘆のピークは 2〜4 週間後であり、このタイミングで Sora が何も変わらない UI を出すことは「役目が終わったアプリ」という印象を与える。

## 目的

rainbow_bridge移行後 7日・14日・30日のタイミングで、それぞれ異なる文言の静かなケアカードをホームに表示する。押しつけずに「覚えているよ」という存在感を届ける。

## スコープ

- `home.tsx` に以下を追加:
  - 表示条件: `pet.status === "rainbow_bridge"` かつ対象期間内かつ未dismiss
  - localStorage キー: `sora:care-card-{petId}-{day}` (`day` = 7 | 14 | 30)
  - 移行日は `sora:loss-transition-{petId}` の保存タイムスタンプから計算
  - 表示期間: 各タイミングから 72 時間以内に1回表示（dismiss または期間超過で消える）
  - 各カードの文言:
    - 7日後: 「{pet.name}がいなくなって1週間。ゆっくりでいいですよ。」
    - 14日後: 「2週間、ここに残し続けてくれてありがとう。」
    - 30日後: 「1ヶ月経ちました。{pet.name}のこと、いつでも話せます。」
  - dismiss ボタン（×）のみ。CTAボタンなし
  - スタイル: `bg-white/60 backdrop-blur-xl border border-white/40` の静かなカード

- 表示優先度: loss welcome card（72h）が非表示になった後に表示
- 各カードは独立して dismiss 可能

## やらないこと

- 4週間以降の追加カード（30日以降は定期通知が担う）
- カードからのCTA追加
- push通知との連動

## 受け入れ条件

- [ ] 移行後7日経過（±72h）にケアカードが表示される
- [ ] 移行後14日・30日も同様に表示される
- [ ] dismissで以後その日程のカードは表示されない
- [ ] 72h以内に見なかった場合はスキップ（次のタイミングへ）
- [ ] alive期には表示されない
- [ ] `pnpm tsc --noEmit` 通過
- [ ] `pnpm test` 全通過

## 確認観点

- 文言が押しつけがましくない（短く・問いかけでない）
- タイミングの計算がずれていない
- 既存の loss welcome card と重複しない
