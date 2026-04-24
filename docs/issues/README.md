# ISSUE一覧

最終更新: 2026-04-24

## 現在のISSUE

| # | タイトル | 優先度 | ステータス |
|---|---------|--------|----------|
| [001](ISSUE-001-data-persistence.md) | データ永続化がない（リロードで全データ消える） | 🔴 critical | open |
| [006](ISSUE-006-app-title-metadata.md) | アプリタイトルが「ペットロスヒーリング」でロス後専用に見える | 🔴 critical | open |
| [007](ISSUE-007-profile-create-past-tense.md) | プロフィール登録のコピーが過去形でロス後前提になっている | 🔴 critical | open |
| [002](ISSUE-002-schedule-screen-missing.md) | 予定管理画面が未実装 | 🟠 high | open |
| [003](ISSUE-003-onboarding-tone.md) | オンボーディングがペットロス専用に見える可能性 | 🟠 high | open |
| [008](ISSUE-008-feelings-options-postloss-only.md) | 気持ち記録の選択肢がロス後ユーザー専用でしか使えない | 🟠 high | open |
| [009](ISSUE-009-letter-hardcoded-pet-voice.md) | 手紙がハードコードテンプレート＋ペット視点で倫理・品質に問題 | 🟠 high | open |
| [004](ISSUE-004-home-greeting-copy.md) | ホームのグリーティング文言が生前利用に違和感 | 🟡 medium | open |
| [005](ISSUE-005-timeline-empty-state.md) | タイムラインの空状態設計が不足 | 🟡 medium | open |
| [010](ISSUE-010-chat-prompts-postloss-only.md) | チャットのクイックプロンプトがロス後ユーザー専用 | 🟡 medium | open |

---

## ISSUE作成ルール

### いつ作るか

- 評価・レビューで問題を発見したとき
- 機能追加・改善のアイデアが出たとき
- バグを発見したとき

### 命名規則

```
ISSUE-{3桁連番}-{kebab-case-title}.md

例:
ISSUE-006-photo-upload.md
ISSUE-007-ai-chat-placeholder.md
```

### ファイル作成手順

1. `docs/ai-driven-development/issue-template.md` をコピーする
2. `docs/issues/ISSUE-XXX-title.md` として保存する
3. このREADMEのテーブルに追記する（優先度順に挿入）

---

## 優先度の定義

| 記号 | 優先度 | 判断基準 |
|------|--------|---------|
| 🔴 | critical | アプリが機能しない・データが消える・クラッシュする |
| 🟠 | high | MVPの中心機能が欠けている・UXが大きく損なわれる |
| 🟡 | medium | UX改善・感情設計の改善・軽微な問題 |
| ⚪ | low | 将来対応でよい・Phase 2以降 |

---

## ステータス管理

| ステータス | 意味 | 次のアクション |
|-----------|------|--------------|
| `open` | 未着手 | 優先度順に着手する |
| `in_progress` | 対応中 | 完了したら done に更新 |
| `done` | 完了・検証済み | READMEのステータスも更新 |
| `wont_fix` | 対応しない | ISSUE本文に理由を明記 |

---

## 完了条件（全ISSUEに共通）

ISSUEは以下をすべて満たしてから `done` にする。

- [ ] 意図した変更が動作している（ブラウザ確認）
- [ ] コンソールにエラーが出ていない
- [ ] 変更画面以外のナビゲーションが壊れていない
- [ ] ISSUE本文の「完了条件」チェックリストを完了した

---

## 検証ログの残し方

ISSUEファイルの末尾に以下を追記する。

```markdown
## 検証ログ

- 確認日時: 2026-04-XX HH:MM
- 確認環境: Chrome / iPhone Safari 等
- 確認内容: [動作確認した内容]
- 問題なし / 問題あり（→ ISSUE-XXX に派生）
```
