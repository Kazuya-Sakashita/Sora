# ISSUE-027: 思い出シェア機能（OGP画像生成）

name: ISSUE-027
type: feature
priority: High
status: open

---

## 概要

個別の思い出記録を「Soraカード」画像として書き出し、SNSシェアできるようにする。

## 背景

シェア経路がゼロのため、新規ユーザーはApp Store検索のみで獲得できない。ペット写真のシェアは高エンゲージメントコンテンツであり、バイラル獲得の最短ルート。

## 目的

シェアによるオーガニック獲得ループを作る（AARRR の Referral）。

## スコープ

- タイムラインの各記録カードに「シェア」ボタンを追加
- `app/api/og/route.ts` を作成し `@vercel/og` で OGP 画像を動的生成
  - 構成: 写真 + ペット名 + 記録日 + 「Sora」ロゴ
- `navigator.share()` でネイティブシェアシートを起動（未対応ブラウザはURLコピー）
- シェアURL: `https://app.sora.jp/share/{memoryId}` → OGP付き公開ページ
- `app/share/[memoryId]/page.tsx` に公開ビューを実装（未認証でも閲覧可）

## 非スコープ

- 月次まとめカードのシェア（別ISSUE）
- ダウンロード（PNG保存）

## 受け入れ条件

- [ ] 記録カードからシェアボタンが押せる
- [ ] OGP画像が正しく生成される（写真・ペット名・日付）
- [ ] `navigator.share()` でシェアシートが開く
- [ ] 未認証ユーザーが公開URLにアクセスして記録を閲覧できる
