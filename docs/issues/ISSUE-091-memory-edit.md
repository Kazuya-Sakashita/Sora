# ISSUE-091: 記録の編集機能を実装する

name: ISSUE-091
type: improvement
priority: High
status: open

---

## 背景

現在の `/api/pets/[petId]/memories/[memoryId]/route.ts` は DELETE ハンドラーのみを持ち、PATCH（更新）が未実装。タイムライン画面にも編集 UI がない。

記録を「削除して再投稿」しか修正手段がないため、タイトルの誤字・気持ちタグの付け忘れ・日付のずれを後から直せない。記録の信頼性と継続意欲を損なう。

## 問題

```ts
// app/api/pets/[petId]/memories/[memoryId]/route.ts
export async function DELETE(...) { ... }
// PATCH が存在しない
```

## 目的

記録済みの思い出のタイトル・説明・気持ちタグ・日付を後から修正できるようにする。

## スコープ

**API (`app/api/pets/[petId]/memories/[memoryId]/route.ts`)**:
- `PATCH` ハンドラーを追加
- 更新可能フィールド: `title`、`description`、`moodTag`、`date`
- 認証・ペットアクセス確認（既存の DELETE と同様）
- 部分更新: 指定されたフィールドのみ更新（undefined は無視）
- `openapi.yaml` に `PATCH /pets/{petId}/memories/{memoryId}` を追記

**UI (`components/screens/timeline.tsx`)**:
- 各記録カードに編集アイコン（Pencil）を追加
- タップで編集フォームをインライン展開（追加フォームと同じスタイル）
- 編集可能: title（Input）、description（Textarea）、moodTag（ボタン選択）、date
- 保存: `PATCH /api/pets/{petId}/memories/{memoryId}` 呼び出し
- 保存後: memories の該当エントリをインメモリ更新（再フェッチ不要）

**app-context**:
- `updateMemory(id: string, input: Partial<MemoryInput>): Promise<void>` を追加
- memories 配列を immutable に更新

## やらないこと

- 写真の差し替え（複雑度が高い、Phase 2 以降）
- 一括編集
- 編集履歴

## 受け入れ条件

- [ ] タイムライン画面の各記録に編集ボタンが表示される
- [ ] 編集フォームでタイトル・説明・気持ちタグ・日付を変更して保存できる
- [ ] 保存後に記録が更新された内容で即座に反映される
- [ ] 認証なしでのアクセスは 401
- [ ] 他のユーザーのペットの記録は更新できない（404）
- [ ] `pnpm tsc --noEmit` 通過
- [ ] `pnpm test` 全通過（PATCH ハンドラーのテストを追加）

## 確認観点

- 編集フォームが記録カード内に自然に展開されるか
- キャンセル操作が明確か（✕ボタン または「キャンセル」テキスト）
- 保存中のローディング状態が表示されるか
