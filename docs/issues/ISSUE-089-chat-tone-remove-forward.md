# ISSUE-089: チャットtoneから「少し前を向く言葉もほしい」を削除する

name: ISSUE-089
type: bug
priority: High
status: open

---

## 背景

ISSUE-086 のスコープのうち、tone selector の変更部分を独立したISSUEとして分離する。
チャットの tone 選択肢「少し前を向く言葉もほしい」は、AIが悲嘆ユーザーの回復方向を操作する構造になっており、倫理的に問題がある。

## 問題

```tsx
// 現在のtone選択肢（chat.tsx内またはsettings.tsx内）
"やさしく寄り添う" | "思い出を一緒に振り返る" | "少し前を向く言葉もほしい"
//                                                 ↑ AIが「回復方向」を担う設計
```

```ts
// route.ts — 対応するシステムプロンプト分岐
: tone === "少し前を向く言葉もほしい"
? "- 悲しみを受け止めつつ、ごく穏やかに次の一歩を感じさせる言葉を添える（押しつけ禁止）"
// ↑「押しつけ禁止」と書いてあっても、ユーザーが「前向き誘導」を要求できる構造は残る
```

## 目的

AIが悲嘆ユーザーの感情方向を変えようとしない設計にする。tone は「どう記憶を語るか」のスタイル選択であり、「どこへ向かうか」の方向選択であってはならない。

## スコープ

### 1. tone 選択肢から削除
- `components/screens/settings.tsx`（または tone 選択 UI を持つファイル）から「少し前を向く言葉もほしい」を削除
- 残す選択肢: `"やさしく寄り添う"` と `"思い出を一緒に振り返る"`

### 2. localStorage の既存値をフォールバック処理
- `lib/app-context.tsx` の `setConversationTone` 初期化時:
  - 保存済みの値が削除した選択肢の場合 → `"やさしく寄り添う"` にリセット
  ```ts
  const VALID_TONES = ["やさしく寄り添う", "思い出を一緒に振り返る"]
  const saved = typeof window !== "undefined" ? localStorage.getItem("sora:conversation-tone") : null
  const initial = saved && VALID_TONES.includes(saved) ? saved : "やさしく寄り添う"
  ```

### 3. route.ts のシステムプロンプト分岐を削除
- `app/api/pets/[petId]/chat/route.ts` の toneInstruction から該当分岐を削除
- 残す分岐: `"思い出を一緒に振り返る"` の場合のみ明示、それ以外はデフォルト（寄り添う語り口）

## やらないこと

- tone 選択 UI 自体の廃止
- チャット機能の変更

## 受け入れ条件

- [ ] 「少し前を向く言葉もほしい」が設定画面・tone選択UIから消えている
- [ ] 既存ユーザーの localStorage に古い値が残っていても正常動作する
- [ ] route.ts に削除したtoneへの分岐が残っていない
- [ ] 残る2つのtoneでチャットが正常動作する
- [ ] `pnpm tsc --noEmit` 通過
- [ ] `pnpm test` 全通過

## 確認観点

- 倫理的に問題のあるtoneが完全に除去されている
- 残る設定値のフォールバックが安全
- 既存ユーザーへの影響が最小限
