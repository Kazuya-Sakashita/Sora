# ISSUE-093: ペットプロフィールを設定画面から編集できるようにする

name: ISSUE-093
type: improvement
priority: Medium
status: done

---

## 背景

ペットプロフィール（名前・種類・誕生日・性格・好きなものなど）は初回登録時にしか入力できない。ISSUE-090 で `birthDate` と `species` の収集フィールドが追加されるが、既存ユーザーが後から入力・修正する手段がない。

また、名前の誤字やお迎え日の入力ミスも修正できない。

## 問題

```
// settings.tsx — ペット情報の編集セクションが存在しない
// 種類・誕生日は ISSUE-090 で登録できるようになるが、後から変更できない
```

## 目的

設定画面からペットの基本情報をいつでも編集できるようにする。

## スコープ

- `components/screens/settings.tsx` に「ペット情報」編集セクションを追加:
  - 現在の値を初期値として表示
  - 編集可能フィールド: `name`、`birthDate`、`species`、`broughtAt`、`nickname`、`personality`、`favorites`
  - `photoUrl` は任意で差し替え可能（SupabaseStorage upload）
  - 保存: `PATCH /api/pets/{petId}` 呼び出し

- `app/api/pets/[petId]/route.ts` に `PATCH` を追加:
  - 認証・ペットアクセス確認
  - 部分更新対応
  - `openapi.yaml` に追記

- `app-context.tsx`:
  - `updatePet(input: Partial<PetInput>): Promise<void>` を追加
  - `pet` ステートを更新

## やらないこと

- ペットの削除（リスクが高く別ISSUEで検討）
- 複数ペット間の切り替えUI改善

## 受け入れ条件

- [ ] 設定画面にペット情報編集セクションが表示される
- [ ] 名前・種類・誕生日・お迎え日を変更して保存できる
- [ ] 保存後に即座にホームなどで変更が反映される
- [ ] 認証なし → 401、他ユーザーのペット → 403/404
- [ ] `pnpm tsc --noEmit` 通過
- [ ] `pnpm test` 全通過

## 確認観点

- 設定画面が縦に長くなりすぎないか（折り畳みセクション推奨）
- 保存失敗時にエラーが表示されるか
