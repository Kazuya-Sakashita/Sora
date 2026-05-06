# ISSUE-068: conversationToneをチャットAPIのシステムプロンプトに反映する

name: ISSUE-068
type: bug
priority: Critical
status: open

---

## 背景

`settings.tsx` にはAIの語り口を選択できるUI（`conversationTone`）が実装されており、「やさしく寄り添う」「短く・静かに」などを選べる。しかしこの値は `app-context.tsx` の state に保存されるのみで、`POST /api/pets/{petId}/chat` ルートには一切渡されていない。ユーザーは「自分好みに設定した」と思っているのに、AIの返答は常に同じ語り口になる。

## 問題

`lib/app-context.tsx` の `conversationTone` が `chat/route.ts` の `systemPrompt` に組み込まれていない。設定UIが機能しているように見えるが実際は空振りしている。

## 目的

settings で選択した語り口がチャットのAI返答に反映されるようにする。ユーザーが「自分に合う話し方をしてもらえている」と感じられる設計にする。

## スコープ

### フロントエンド（chat.tsx）

- `conversationTone` を `useApp()` から取得
- `POST /api/pets/{petId}/chat` のリクエストボディに `tone: conversationTone` を追加

### API（chat/route.ts）

- `ChatInputSchema`（`lib/schemas.ts`）に `tone` フィールドを追加（optional string, max 50文字）
- システムプロンプトの末尾に語り口指示を追加：
  - `"やさしく寄り添う"` → 現状維持（デフォルト）
  - `"短く・静かに"` → 「返答は1〜2文で、短く静かに」
  - `"淡々と・感情を抑えて"` → 「感情的な表現を避け、事実を穏やかに受け止める語り口で」

### openapi.yaml

- `POST /api/pets/{petId}/chat` の requestBody に `tone` フィールドを追記

## やらないこと

- settings画面のtone選択肢の変更
- tone以外のAIパーソナライゼーション
- toneのDB保存（localStorageで十分）

## 受け入れ条件

- [ ] 「短く・静かに」選択時、AIの返答が1〜2文程度になる
- [ ] `tone` フィールドが未送信の場合はデフォルト語り口で動作する
- [ ] `pnpm tsc --noEmit` 通過
- [ ] `pnpm test` 全通過
- [ ] gstackで動作確認済み
