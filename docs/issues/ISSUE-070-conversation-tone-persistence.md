# ISSUE-070: conversationToneをlocalStorageで永続化する

name: ISSUE-070
type: bug
priority: Critical
status: done

---

## 背景

ISSUE-068でconversationToneをチャットAPIのシステムプロンプトに反映することは完了した。しかし`app-context.tsx`の`conversationTone`は`useState("やさしく寄り添う")`のみで初期化されており、アプリ再起動・リロードのたびにデフォルト値にリセットされる。ユーザーが「思い出を一緒に振り返る」に設定しても、次回起動時には「やさしく寄り添う」に戻ってしまう。

## 問題

```tsx
// app-context.tsx
const [conversationTone, setConversationTone] = useState("やさしく寄り添う")
```

localStorage非保存。ISSUE-068でAPIへの反映は直したが、設定値の永続化が漏れていた。

## 目的

settings.tsxで選択した語り口が次回起動後も維持される。「自分のためにカスタマイズされたAI」という体験が毎回続くようにする。

## スコープ

- `app-context.tsx` の `setConversationTone` をラップし、実行時に `sora:conversation-tone` キーでlocalStorageに保存
- 初期値を `localStorage.getItem("sora:conversation-tone") ?? "やさしく寄り添う"` で復元
- 保存失敗（storage full等）はサイレントに無視

## やらないこと

- conversationToneのDB保存
- toneオプションの変更
- settings画面のUI変更

## 受け入れ条件

- [ ] settings.tsxで語り口変更後、リロード・再起動しても設定が維持される
- [ ] 未設定時は「やさしく寄り添う」がデフォルト
- [ ] `pnpm tsc --noEmit` 通過
- [ ] `pnpm test` 全通過
- [ ] 既存導線を壊していない

## 確認観点

- ユーザーの心を傷つけない
- Soraらしさを壊していない
- AI依存を強めすぎていない
- 既存機能を壊していない
