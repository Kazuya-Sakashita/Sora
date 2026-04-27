# ISSUE-017: デザインシステムを新パレット・フォントに刷新する

## 基本情報

| 項目 | 内容 |
|------|------|
| 優先度 | high |
| ステータス | done |
| 関連画面 | 全画面 |
| 関連ファイル | `app/globals.css`, `app/layout.tsx`, `components/sky-background.tsx` |

## 問題の概要

現行デザインがピンク・ラベンダー系カラーを多用しており、性別を問わない穏やかな世界観に合わない。フォントも Noto Sans JP で印象が普通すぎる。

## 新デザインシステム仕様

### カラーパレット

| 名前 | HEX | 用途 |
|------|-----|------|
| Sky Blue | #E8F4FF | 背景ベース |
| Twilight Blue | #D8E4F0 | セカンダリ・薄明 |
| Sage Mist | #E5EDE8 | アクセント・自然 |
| Warm Sand | #F0E6D8 | プライマリ CTA |
| Amber Light | #EDD9B5 | ハイライト |
| Deep Text | #4A5568 | テキスト |

禁止: ピンク・ラベンダー・パープル系

### フォント
- 本文: Zen Maru Gothic (400/500/700)
- 手書き特別テキスト: Klee One (400/600)

### 背景グラデーション
`linear-gradient(180deg, #E8F4FF 0%, #D8E4F0 40%, #F0E6D8 100%)`

## 完了条件

- [x] カラートークンが新パレットに更新された
- [x] ピンク・ラベンダー系が除去された
- [x] フォントが Zen Maru Gothic + Klee One になった
- [x] 背景グラデーションが新仕様になった
- [x] ステータスを done に更新した

## 検証ログ

- 確認日時: 2026-04-28
- 確認内容: globals.css カラートークン更新、layout.tsx フォント変更、sky-background.tsx グラデーション更新。TypeScript エラーなし。
- 問題なし
