# ISSUE-059: ホームのn日前カードタップで該当記録をハイライト遷移する

name: ISSUE-059
type: improvement
priority: Medium
status: done

---

## 概要

ホーム画面の「n年前の今日」カードをタップすると `setCurrentScreen("timeline")` するだけで、どの記録なのかが分からない。ISSUE-057 で実装した `pendingHighlightMemoryId` の仕組みを使い、タップしたら対象記録を自動スクロール＋ハイライトするべき。

## 背景

ISSUE-057 で「あの日通知 → タイムライン該当記録ハイライト」の仕組みが完成している。

```tsx
// app-context.tsx
const [pendingHighlightMemoryId, setPendingHighlightMemoryId] = useState<string | null>(null)
```

```tsx
// timeline.tsx
useEffect(() => {
  if (!pendingHighlightMemoryId || memories.length === 0) return
  // scroll + amber highlight
}, [pendingHighlightMemoryId, memories.length])
```

ホームの on-this-day カードは同じ記録に対してタップされているにもかかわらず、この仕組みを使っていない。`setPendingHighlightMemoryId` を 1 行追加するだけで体験が大きく向上する。

## 目的

- 「n年前の今日」カードから過去記録との感動的な再会体験を作る
- 通知タップ（ISSUE-057）とホームカードタップの体験を統一する

## スコープ

- `home.tsx` の on-this-day カードの `onClick` を変更
  - `setCurrentScreen("timeline")` の前に `setPendingHighlightMemoryId(onThisDay.id)` を追加
- `useApp()` の destructuring に `setPendingHighlightMemoryId` を追加

## 非スコープ

- タイムライン側のハイライト実装の変更（ISSUE-057 で完成済み）
- ホームカードのデザイン変更

## API変更

- なし

## 受け入れ条件

- [ ] ホームの「n年前の今日」カードをタップするとタイムラインで対象記録がアンバーハイライトされる
- [ ] 記録へのスクロールが 300ms 後に実行される（既存挙動）
- [ ] ハイライトが 2 秒後に消える（既存挙動）
- [ ] `pnpm tsc --noEmit` 通過
- [ ] `pnpm test` 全通過

## テスト観点

- on-this-day カードタップ → `setPendingHighlightMemoryId` が対象 ID で呼ばれる
- on-this-day カードタップ → `setCurrentScreen("timeline")` が呼ばれる
