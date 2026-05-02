# ISSUE-044: マイルストーン当日のSNSシェア強化

name: ISSUE-044
type: feature
priority: Medium
status: open

---

## 概要

マイルストーンオーバーレイに「シェアする」ボタンを追加し、感情的ピークでのバイラル拡散を促す。

## 背景

100日・1年・誕生日などの節目は SNS シェア意欲が最も高い瞬間。現状はモーダルを閉じるだけで終わり、口コミ獲得チャネルとして機能していない。

## 目的

- Sora 認知の自然拡散（Referral）
- Sora+ ユーザーが記念カード画像付きでシェアすることで、Plus の価値を外部に見せる

## スコープ

- `home.tsx` のマイルストーンオーバーレイに「シェアする」ボタンを追加
  - `navigator.share` が使える場合（モバイル）：`navigator.share({ title, text, url })`
  - 使えない場合：Twitter/X intent URL を別タブで開く
    - URL：`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
  - シェアテキスト自動生成：`${pet.name}と今日で${label} ${emoji} #Sora #ペット記録`
  - Sora+ ユーザーかつ記念カードダウンロード済み：`navigator.share` に `files` を渡してカード画像を添付（対応ブラウザのみ）
- ボタン配置：「記念カードを保存する」と「今日の思い出を残す」の間
- `Share2` アイコン（lucide）使用

## 非スコープ

- Instagram・LINE など他SNS対応
- シェア数の計測・ダッシュボード

## API変更

- なし

## 受け入れ条件

- [ ] シェアボタンが表示される
- [ ] タップでネイティブシェートまたは Twitter が開く
- [ ] シェアテキストにペット名・記念日ラベルが含まれる
- [ ] `pnpm tsc --noEmit` 通過

## テスト観点

- UI動作: navigator.share が呼ばれる（または Twitter URL が開く）
- 正常系: シェアテキストにペット名・ラベルが含まれる
