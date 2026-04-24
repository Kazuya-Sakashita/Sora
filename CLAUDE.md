# Sora — Claude Code 開発ガイドライン

## プロジェクト概要

**Sora** はペットとの日々の思い出を記録し、その積み重ねが将来のグリーフケアへ自然につながるアプリ。
「管理ツール」でも「グリーフアプリ」でもない。**愛情の蓄積が未来の支えになる**体験を作る。

- 仕様書: `docs/specs/pet-memory-care-app-spec.md`
- ISSUE一覧: `docs/issues/README.md`
- API定義: `docs/api/openapi.yaml`

---

## 技術スタック

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **State:** React Context + localStorage（MVP）→ 将来API連携
- **Package manager:** pnpm

---

## 開発方針

### AI駆動 × API駆動

このプロジェクトは以下の2軸で開発する。

**AI駆動:** 評価 → ISSUE化 → 実装 → 検証 → 再評価のサイクルを回す  
**API駆動:** UIとデータ層をOpenAPIで定義し、契約ベースで実装する

### OpenAPI First

- APIの追加・変更は必ず `docs/api/openapi.yaml` を先に更新する
- フロント実装はOpenAPIの定義に従う
- 定義なしにAPIを実装・呼び出さない

---

## 実装前に必ずやること

1. `docs/issues/README.md` で未対応ISSUEを確認する
2. 対象ISSUEのステータスを `in_progress` に更新する
3. API変更を伴う場合は `docs/api/openapi.yaml` を先に更新する
4. 変更するファイルと影響範囲を1〜2行で示してから着手する

## 実装後に必ずやること

1. `pnpm dev` → ブラウザで動作確認
2. 変更画面以外のナビゲーションが壊れていないか確認
3. ISSUEのステータスを `done` に更新する

## 絶対にやってはいけないこと

- ISSUEなしに機能追加・大幅改変しない
- 複数ISSUEを同時に実装しない
- 動作確認せずにISSUEをcloseしない
- MVPスコープ外の機能を先取り実装しない
- OpenAPIを更新せずにAPIを追加・変更しない

---

## 評価フレームワーク

詳細: `docs/reviews/app-evaluation.md`

- **HEART評価** — 感情・継続・機能の質を評価
- **AARRR評価** — 成長・継続の視点で評価
- **技術評価** — 実装品質・パフォーマンス
- 評価結果は必ずISSUEに変換する

---

## ISSUE管理

詳細: `docs/issues/README.md`

- ファイル: `docs/issues/ISSUE-XXX-kebab-title.md`
- 優先度順: `critical` → `high` → `medium` → `low`
- ステータス: `open` → `in_progress` → `done`

---

## 感情設計ルール

このアプリはセンシティブ領域を扱う。コピー・演出に必ず配慮する。

- 「管理」より「残す」「大切にする」
- 命令形より問いかけ形
- NG: 「乗り越える」「立ち直る」「前を向いて」「天国で待っている」
- AIの言葉は短く・穏やか・問いかけベース

---

## MVP定義

1. ペットプロフィール登録
2. 思い出記録（写真＋メモ＋気持ちタグ）
3. タイムライン
4. 予定管理（通院・トリミング等）
5. データ永続化（localStorage）

**含めない:** AI会話実装・家族共有・フォトブック・健康グラフ
