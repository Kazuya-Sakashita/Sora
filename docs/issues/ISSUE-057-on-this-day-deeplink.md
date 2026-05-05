# ISSUE-057: あの日通知タップで該当記録に直接遷移する

name: ISSUE-057
type: improvement
priority: Medium
status: in_progress

---

## 概要

現在「あの日のこと」通知をタップすると `/`（ホーム）に遷移するだけで、該当の記録画面に直接アクセスできない。「残してよかった」体験の核心は記録との再会であり、ディープリンクが機能しないと体験が中途半端になる。

## 背景

ISSUE-053 でのバッチ処理 (`/api/cron/on-this-day`) が Push 通知を送る際に `url: "/"` をハードコードしている。この URL は Service Worker の `notificationclick` ハンドラで `clients.openWindow(url)` に渡されるので、適切な URL を渡せば記録画面にジャンプできる。

現状コード（`app/api/cron/on-this-day/route.ts`）:
```ts
JSON.stringify({ title: "Sora", body, url: "/" })
```

## 目的

- 通知タップ→記録との再会という体験をシームレスにする
- 「あの日」記録の再発見率を上げる

## スコープ

- Push 通知ペイロードの `url` を `/?memoryId={memoryId}` 形式に変更
- `app/page.tsx` または `lib/app-context.tsx` の初期化処理で URL パラメータ `memoryId` を読み取り、該当記録をハイライト表示してタイムライン画面を開く
  - タイムライン画面を開き、該当 memoryId の記録まで自動スクロール
  - ハイライトは2秒後に自動解除
- `memoryId` が存在しない・記録が削除済みの場合はホームにフォールバック

## 非スコープ

- 記録の個別ページ（URLベースのルーティング）—— 現状はSPA構成のため
- iOS Safari のバックグラウンド起動対応（SW の制約内で対応）

## API変更

- なし（cron ルートの Push ペイロードを修正するのみ）

## 受け入れ条件

- [ ] 通知ペイロードに `memoryId` を含む URL が設定される
- [ ] 通知タップ後にタイムライン画面が開き、該当記録まで自動スクロールする
- [ ] 該当記録がハイライト表示される（2秒後に解除）
- [ ] `memoryId` が無効な場合はホームにフォールバックする
- [ ] `pnpm tsc --noEmit` 通過

## テスト観点

- 正常系: `?memoryId=xxx` でタイムライン表示→該当記録にスクロール
- 正常系: ハイライトが2秒後に消える
- 異常系: 存在しない `memoryId` → ホームにフォールバック
- 異常系: `memoryId` なし → 通常のホーム起動
