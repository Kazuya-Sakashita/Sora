# API駆動開発ガイド

## 原則

`openapi.yaml` がすべての仕様のソース・オブ・トゥルース。  
コードよりyamlが先。yamlがなければAPIは存在しない。

---

## API変更時の必須手順

```
1. openapi.yaml を更新（エンドポイント/スキーマ/エラー）
2. pnpm tsc --noEmit で型エラーがないか確認
3. API実装（route.ts）
4. フロント実装（app-context.tsx / コンポーネント）
5. テスト追加・実行（pnpm test）
6. ブラウザ動作確認
```

**この順序を守らない実装はレビューで差し戻す。**

---

## 必ずOpenAPIを更新する変更

| 変更種別 | 例 |
|---------|-----|
| エンドポイント追加 | `POST /api/pets/:petId/invite` |
| リクエスト変更 | bodyフィールド追加・削除 |
| レスポンス変更 | フィールド追加（`role`, `broughtAt`等） |
| エラーコード変更 | 402 → 403 等 |
| 認証要件変更 | public → 要認証 等 |

---

## フロント型ルール

### 現状（手動同期）
- `lib/app-context.tsx` に手書き型が存在
- openapi.yaml の変更後は手書き型を手動で更新すること
- ISSUE-038 完了後は自動生成に移行予定

### 確認ポイント
- `Pet` 型: `role`, `broughtAt`, `status` フィールドがyamlと一致しているか
- `Memory` 型: `category`, `moodTag` の lowercase変換が一致しているか
- APIレスポンスの `items` 配列構造がyamlと一致しているか

---

## テスト方針

### 必須テスト（PRマージ前）
1. **型チェック**: `pnpm tsc --noEmit`
2. **単体テスト**: `pnpm test`（vitest）
3. **ブラウザ確認**: 正常系・エラー系の目視確認

### 推奨テスト（ISSUE-039実装後）
4. **スキーマ検証**: APIレスポンスがyaml定義と一致することをvitest + zodで検証

---

## 現在の既知乖離（ISSUE-037対応待ち）

以下はopenapi.yamlに未定義だが実装済み：

- `GET /api/pets` — 一覧取得（`role`フィールド付き）
- `POST /api/pets/:petId/invite`
- `GET/DELETE /api/pets/:petId/members`
- `POST /api/invite/accept`
- `POST/GET /api/billing/*`
- `GET /api/pets/:petId/report`
- `GET /api/og`
- `POST /api/push/*`
- `GET /api/share/:memoryId`

Pet レスポンスの未定義フィールド: `broughtAt`, `role`

---

## PRチェックリスト

→ `docs/PR_CHECKLIST.md` 参照
