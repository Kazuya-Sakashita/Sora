# ISSUE-067: ことば画面の保存をlocalStorageで永続化する

name: ISSUE-067
type: bug
priority: Critical
status: done

---

## 背景

`letter.tsx` の「保存する」ボタンは存在するが、`savedLetters` は `useState` のみで管理されている。ナビゲーションやリロードで保存した手紙が全て消える。グリーフケアのAIが記録から生成した「言葉」は、ユーザーにとって感情的に最も価値の高いコンテンツ。それが保存できないのはSoraの核心約束への裏切りになる。

## 問題

```tsx
const [savedLetters, setSavedLetters] = useState<string[]>([])
```

保存ボタンを押してもデータは画面遷移で消える。「保存した」という操作に対して何も残らない。

## 目的

保存した手紙をlocalStorageに永続化し、次回「ことば」を開いたときに読み返せるようにする。

## スコープ

- `sora:letters-{petId}` キーでlocalStorageに配列として保存
- マウント時（pet.id変化時）にlocalStorageから復元
- 保存時・削除時に同期
- 保存済み手紙に削除ボタン追加（保存リストが増えていくため）
- 保存失敗（storage full等）はサイレントに無視

## やらないこと

- 手紙のDBへの永続化
- 手紙のエクスポート・シェア
- 保存数の上限設定（最大20件程度をsliceで管理）

## 受け入れ条件

- [ ] 保存した手紙がリロード後も「保存した言葉」セクションに表示される
- [ ] 別ペットに切り替えると別の履歴が表示される
- [ ] 保存済み手紙を削除できる
- [ ] `pnpm tsc --noEmit` 通過
- [ ] `pnpm test` 全通過
- [ ] gstackで動作確認済み
