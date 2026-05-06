# ISSUE-072: 直近の気持ち記録をチャットAPIのコンテキストに渡す

name: ISSUE-072
type: improvement
priority: High
status: done

---

## 背景

Soraは記録時に気持ちタグ（`feelings`）を収集している。しかしチャットAPI（`POST /api/pets/{petId}/chat`）のシステムプロンプトにこの情報は一切渡されていない。ユーザーが「さみしい」「ありがとう」と気持ちを記録していても、AIはその文脈を知らずに返答する。

直近の気持ちが分かれば、AIは「最近さみしさを感じているんですね」と文脈に沿った応答ができ、「自分のことを分かってくれている」体験が生まれる。

## 問題

```tsx
// chat.tsx — conversationToneは送るが、feelingsは送っていない
const response = await fetch(...)
body: JSON.stringify({ messages: apiMessages, tone: conversationTone })
// ↑ feelingsコンテキストが欠落
```

```ts
// chat/route.ts — システムプロンプトにfeelings情報がない
const systemPrompt = `あなたはSoraです...`
// ↑ 直近気持ちタグが未参照
```

## 目的

直近3件分の気持ちタグ（例: `["さみしい", "ありがとう", "しあわせ"]`）をチャットAPIに渡し、AIが感情的文脈を踏まえた応答を返せるようにする。

## スコープ

### フロントエンド（chat.tsx）

- `feelings` を `useApp()` から取得
- 直近3件の `feelings.emotion`（または相当するフィールド）を配列で収集
- `POST /api/pets/{petId}/chat` のリクエストボディに `recentFeelings: string[]` を追加

### API（chat/route.ts）

- `ChatInputSchema` に `recentFeelings: z.array(z.string()).max(5).optional()` を追加
- システムプロンプトに以下を挿入:
  ```
  ユーザーの最近の気持ち: {recentFeelings.join("、")}
  返答の際、これらの気持ちを背景として自然に踏まえてください。感情を直接言及しなくてよい。
  ```
- `recentFeelings` が空・未送信の場合は現状のプロンプトのまま

### lib/schemas.ts

- `ChatInputSchema` に `recentFeelings` フィールドを追加

### openapi.yaml

- `POST /api/pets/{petId}/chat` の requestBody に `recentFeelings` フィールドを追記

## やらないこと

- feelings APIの変更
- feelings画面のUI変更
- 気持ちデータのAI要約・グラフ化

## 受け入れ条件

- [ ] chat.tsxが直近3件のfeelingsをAPIに送る
- [ ] APIシステムプロンプトにrecentFeelingsが含まれる
- [ ] recentFeelingsが空の場合でもチャットが正常動作する
- [ ] `pnpm tsc --noEmit` 通過
- [ ] `pnpm test` 全通過
- [ ] openapi.yamlが更新されている

## 確認観点

- ユーザーの感情データを適切に扱っている（過度に言及しない）
- AIが感情に寄り添いすぎず、押しつけにならない
- 既存チャット機能を壊していない
