# ISSUE-018: デイリーリマインダー（Web Push通知）を実装する

## 基本情報

| 項目 | 内容 |
|------|------|
| 優先度 | critical |
| ステータス | open |
| 関連画面 | 設定画面、ホーム画面 |
| 関連ファイル | `public/sw.js`（新規）, `components/screens/settings.tsx`, Supabase Edge Functions |

## 問題の概要

再訪問経路がゼロ。アプリを閉じたユーザーを呼び戻す仕組みが存在しない。D7継続率15%以下が予測される。

## 期待する動作

- 初回ログイン後、通知許可を求める（設定画面から）
- 毎朝8時に「{pet.name}との今日を残しませんか」をプッシュ送信
- 通知タップでアプリが開く
- 設定画面でON/OFF切り替え可能

## 実装方針

1. `public/sw.js` にService Worker登録
2. Web Push API でブラウザ通知購読
3. 購読情報をSupabaseのpush_subscriptionsテーブルに保存
4. Supabase Edge Functions + pg_cron で毎朝8時にWeb Push送信

## 完了条件

- [ ] 通知許可ダイアログが表示される
- [ ] 毎朝8時に通知が届く
- [ ] 通知をタップするとアプリが開く
- [ ] 設定画面でON/OFF切り替えできる
- [ ] ステータスを done に更新した
