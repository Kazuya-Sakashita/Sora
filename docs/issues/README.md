# ISSUE一覧

最終更新: 2026-04-28

## 現在のISSUE

| # | タイトル | 優先度 | ステータス |
|---|---------|--------|----------|
| [001](ISSUE-001-data-persistence.md) | データ永続化がない（リロードで全データ消える） | 🔴 critical | done |
| [006](ISSUE-006-app-title-metadata.md) | アプリタイトルが「ペットロスヒーリング」でロス後専用に見える | 🔴 critical | done |
| [007](ISSUE-007-profile-create-past-tense.md) | プロフィール登録のコピーが過去形でロス後前提になっている | 🔴 critical | done |
| [011](ISSUE-011-days-counter.md) | 「今日で〇〇日目」カウンターをホーム画面に実装する | 🔴 critical | done |
| [012](ISSUE-012-supabase-auth.md) | Supabase認証基盤を実装する | 🔴 critical | done |
| [003](ISSUE-003-onboarding-tone.md) | オンボーディングを新しく迎えたペットのオーナー向けに全面再設計する | 🟠 high | done |
| [004](ISSUE-004-home-greeting-copy.md) | ホーム画面を「今日で〇〇日目」カウンター中心に全面再設計する | 🟠 high | done |
| [008](ISSUE-008-feelings-options-postloss-only.md) | 気持ち記録の選択肢がロス後ユーザー専用でしか使えない | 🟠 high | open |
| [009](ISSUE-009-letter-hardcoded-pet-voice.md) | 手紙画面をPhase 3まで非表示化し、倫理NGの「ペット視点」を除去する | 🟠 high | open |
| [013](ISSUE-013-photo-upload-storage.md) | 写真アップロードをSupabase Storageで実装する | 🟠 high | open |
| [014](ISSUE-014-timeline-ux.md) | タイムライン画面を写真主体のUXに改善する | 🟠 high | open |
| [002](ISSUE-002-schedule-screen-missing.md) | 予定管理画面が未実装 | 🟡 medium | open |
| [005](ISSUE-005-timeline-empty-state.md) | タイムラインの空状態設計が不足 | 🟡 medium | open |
| [010](ISSUE-010-chat-prompts-postloss-only.md) | チャット画面をPhase 3まで非表示化する | 🟡 medium | open |
| [015](ISSUE-015-record-completion-feedback.md) | 記録完了後の達成フィードバックを実装する | 🟡 medium | open |
| [016](ISSUE-016-settings-professional-resource.md) | 設定画面に専門家リソースへのリンクを追加する | 🟡 medium | open |
| [017](ISSUE-017-design-system.md) | デザインシステムを新パレット・フォントに刷新する | 🟠 high | done |

---

## 実装フェーズと対応ISSUE

### MVP フェーズ（今すぐ着手）

優先して対応するISSUEと着手順:

```
Step 1: ISSUE-006, 007（コピー修正・即時対応）
Step 2: ISSUE-012（Supabase認証基盤 ← 最重要インフラ）
Step 3: ISSUE-001（データ永続化 ← ISSUE-012完了後）
Step 4: ISSUE-013（写真アップロード ← ISSUE-012完了後）
Step 5: ISSUE-003, 004, 008, 009, 010, 011（UI・UX修正）
Step 6: ISSUE-014, 015, 005（仕上げ）
```

### Phase 1後半（MVP完了後）

- ISSUE-002（予定管理画面）
- ISSUE-016（設定画面の専門家リソース）

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
ISSUE-017-monthly-story.md
ISSUE-018-happiness-dashboard.md
```

### ファイル作成手順

1. `docs/ai-driven-development/issue-template.md` をコピーする
2. `docs/issues/ISSUE-XXX-title.md` として保存する
3. このREADMEのテーブルに追記する（優先度順に挿入）

---

## 優先度の定義

| 記号 | 優先度 | 判断基準 |
|------|--------|---------|
| 🔴 | critical | アプリが機能しない・データが消える・クラッシュする・MVPの日常利用フックがない |
| 🟠 | high | MVPの中心機能が欠けている・UXが大きく損なわれる・倫理設計の問題 |
| 🟡 | medium | UX改善・感情設計の改善・Phase 1後半の機能 |
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
