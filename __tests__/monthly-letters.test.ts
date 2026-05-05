import { describe, it, expect, vi, beforeEach } from "vitest"

// --- モック ---
vi.mock("@/lib/ai", () => ({ generateText: vi.fn() }))

import { generateMonthlyLetter } from "@/lib/letter"
import { generateText } from "@/lib/ai"

const memories = [
  { title: "公園の散歩", description: "気持ちよかった", moodTag: "HAPPY", date: "2026-04-01" },
  { title: "トリミング", description: null, moodTag: "CALM", date: "2026-04-10" },
  { title: "おやつの時間", description: "大好きなジャーキー", moodTag: "FUN", date: "2026-04-20" },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe("generateMonthlyLetter", () => {
  it("Claude API を呼んで生成された文字列を返す", async () => {
    vi.mocked(generateText).mockResolvedValue("4月も一緒に過ごせましたね。Sora より")

    const result = await generateMonthlyLetter("ポチ", memories, 2026, 4)

    expect(result).toBe("4月も一緒に過ごせましたね。Sora より")
    expect(generateText).toHaveBeenCalledOnce()
  })

  it("プロンプトにペット名・年月・記録件数が含まれる", async () => {
    vi.mocked(generateText).mockResolvedValue("テスト")

    await generateMonthlyLetter("ポチ", memories, 2026, 4)

    const [prompt] = vi.mocked(generateText).mock.calls[0]
    expect(prompt).toContain("ポチ")
    expect(prompt).toContain("2026年4月")
    expect(prompt).toContain("3件")
  })

  it("プロンプトに記録のタイトルが含まれる", async () => {
    vi.mocked(generateText).mockResolvedValue("テスト")

    await generateMonthlyLetter("ポチ", memories, 2026, 4)

    const [prompt] = vi.mocked(generateText).mock.calls[0]
    expect(prompt).toContain("公園の散歩")
    expect(prompt).toContain("トリミング")
  })

  it("記録なし（空配列）でも呼び出せる", async () => {
    vi.mocked(generateText).mockResolvedValue("テスト")

    await expect(generateMonthlyLetter("ポチ", [], 2026, 4)).resolves.toBe("テスト")
  })

  it("max_tokens に 400 を渡す", async () => {
    vi.mocked(generateText).mockResolvedValue("テスト")

    await generateMonthlyLetter("ポチ", memories, 2026, 4)

    const [, maxTokens] = vi.mocked(generateText).mock.calls[0]
    expect(maxTokens).toBe(400)
  })
})
