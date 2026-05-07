# ISSUE-090: ペット登録フォームに誕生日・種類フィールドを追加する

name: ISSUE-090
type: bug
priority: Critical
status: done

---

## 背景

`lib/milestone.ts` に誕生日マイルストーンの判定ロジック（`getTodayMilestone` の `pet.birthDate` ブランチ）が実装済みである。しかし `components/screens/profile-create.tsx` の登録フォームに `birthDate` フィールドが存在しないため、データが一切収集されておらず、誕生日機能が完全な dead code になっている。

同様に `species`（犬・猫・うさぎ等）も profile-create に入力フィールドがなく、チャット API のシステムプロンプトが常に「種類：ペット」と固定される問題が生じている。

```tsx
// profile-create.tsx — これらのフィールドが存在しない
const [formData, setFormData] = useState({
  name: "",
  nickname: "",
  personality: "",
  favorites: "",
  broughtAt: "",
  // birthDate: "" ← 存在しない
  // species: ""   ← 存在しない
})
```

## 問題

- 誕生日マイルストーン（`milestone.ts` Line 54〜62）が入力データなしで永遠に発動しない
- チャット AI が「{pet.name}は犬です」と正確に話しかけられない
- お迎え記念日と誕生日の通知も発火しない

## 目的

ペット登録時に `birthDate`（誕生日）と `species`（種類）を収集できるようにし、既存の誕生日マイルストーン・AIプロンプト機能を正常に動作させる。

## スコープ

- `components/screens/profile-create.tsx` を更新:
  - `formData` に `birthDate: ""` と `species: ""` を追加
  - 誕生日フィールド: `<Input type="date" />` 任意項目、ラベル「誕生日（任意）」
  - 種類フィールド: セレクト or ボタン選択
    - 選択肢: 犬 (`dog`) / 猫 (`cat`) / うさぎ (`rabbit`) / 鳥 (`bird`) / その他 (`other`)
  - `createPet` 呼び出し時に `birthDate` / `species` を渡す
- `lib/schemas.ts` の `PetInputSchema` に `species` が存在するか確認・追加
- フォームの表示位置: `broughtAt` の下に `birthDate`、`species` を `broughtAt` の上または下

## やらないこと

- 既存ペットの retroactive な誕生日設定（プロフィール編集は ISSUE-093 で対応）
- 種類のカスタム入力
- 年齢の自動計算表示

## 受け入れ条件

- [ ] プロフィール作成フォームに種類選択と誕生日入力が表示される
- [ ] 両フィールドともに任意（未入力でも登録できる）
- [ ] 種類を犬で登録すると、チャットAPIのシステムプロンプトに「種類：犬」が含まれる
- [ ] 誕生日を登録した当日、ホームに誕生日カードが表示される（`getTodayMilestone` が機能する）
- [ ] `pnpm tsc --noEmit` 通過
- [ ] `pnpm test` 全通過

## 確認観点

- フォームが long になりすぎない（任意フィールドは折り畳みより最初から表示が望ましい）
- 誕生日フィールドは mobile の date picker で操作しやすいか
