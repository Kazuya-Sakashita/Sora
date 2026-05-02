# ISSUE-023: alert()をインラインエラー表示に置換する

## 基本情報

| 項目 | 内容 |
|------|------|
| 優先度 | high |
| ステータス | done |
| 関連画面 | プロフィール登録画面、タイムライン画面 |
| 関連ファイル | `components/screens/profile-create.tsx`, `components/screens/timeline.tsx` |

## 問題の概要

写真アップロード失敗時に `alert()` を使用。ブラウザネイティブダイアログはSoraの感情設計と矛盾し、モバイルUXを著しく損なう。

## 期待する動作

- アップロード失敗時：写真ピッカーの下にインラインエラーメッセージを表示
- 赤テキスト（`text-destructive`）で控えめに表示
- 再試行可能（ボタンは引き続き押せる状態）
- `alert()` の呼び出しをゼロにする

## 実装方針

```tsx
const [uploadError, setUploadError] = useState<string | null>(null)
// alert() を削除し setUploadError(message) に変更
// JSX内で {uploadError && <p className="text-xs text-destructive">{uploadError}</p>} を表示
```

対象箇所：
- `profile-create.tsx` の `handlePhotoChange`
- `timeline.tsx` の `handlePhotoChange`

## 完了条件

- [ ] alert()の呼び出しがゼロになる
- [ ] エラーがインラインで表示される
- [ ] 10MB超ファイルでエラーメッセージが出る
- [ ] ステータスを done に更新した
