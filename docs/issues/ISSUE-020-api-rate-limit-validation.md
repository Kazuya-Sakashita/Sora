# ISSUE-020: APIレート制限とinputバリデーションを実装する

## 基本情報

| 項目 | 内容 |
|------|------|
| 優先度 | high |
| ステータス | done |
| 関連画面 | なし（APIレイヤー） |
| 関連ファイル | `middleware.ts`, `app/api/**`, `lib/auth.ts` |

## 問題の概要

レート制限なし＋photoUrls外部URL注入可能＋入力長未検証。Supabase無料枠（Storage 1GB）が意図せず枯渇するリスクがある。

## 期待する動作

- 同一IPから10req/min超でAPIが429を返す
- photoUrlsに自社Supabase Storage以外のURLを含む場合400エラー
- title/descriptionが定義長を超えた場合400エラー

## 実装方針

1. `@upstash/ratelimit` + `@upstash/redis` を Vercel Middleware に追加
2. `lib/validate.ts` に入力長チェック関数を追加
3. 各POSTルートに `validatePhotoUrls()` を追加

```ts
// photoUrls検証
const STORAGE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
if (photoUrls?.some(url => !url.startsWith(STORAGE_HOST))) {
  return problem(400, "Invalid photo URL")
}
```

## 完了条件

- [ ] レート制限超過で429が返る
- [ ] 外部photoUrls で400が返る
- [ ] 長すぎるtitleで400が返る
- [ ] 正常リクエストへの影響なし確認
- [ ] ステータスを done に更新した
