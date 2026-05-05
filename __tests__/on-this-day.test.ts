import { describe, it, expect, vi, beforeEach } from "vitest"

// --- モック ---
vi.mock("@/lib/ai", () => ({ generateText: vi.fn() }))
vi.mock("@/lib/prisma", () => ({
  default: {
    memoryNotification: {
      createMany: vi.fn().mockResolvedValue({ count: 3 }),
    },
  },
}))

import { generateOnThisDayText, scheduleMemoryNotifications } from "@/lib/on-this-day"
import { generateText } from "@/lib/ai"
import prisma from "@/lib/prisma"

const memory = {
  title: "公園の散歩",
  description: "たくさん走った",
  moodTag: "HAPPY",
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("generateOnThisDayText", () => {
  it("通常モードで通知文を生成する", async () => {
    vi.mocked(generateText).mockResolvedValue("1ヶ月前の今日、ポチと公園の散歩でしたね。")

    const result = await generateOnThisDayText("ポチ", memory, "ONE_MONTH", false)

    expect(result).toBe("1ヶ月前の今日、ポチと公園の散歩でしたね。")
    expect(generateText).toHaveBeenCalledOnce()
  })

  it("ロスケアモードでは専用の語り口を指示する", async () => {
    vi.mocked(generateText).mockResolvedValue("残してくれてよかった。")

    await generateOnThisDayText("ポチ", memory, "ONE_YEAR", true)

    const [prompt] = vi.mocked(generateText).mock.calls[0]
    expect(prompt).toContain("残してくれてよかった")
  })

  it("通常モードでは前向きな語り口を指示する", async () => {
    vi.mocked(generateText).mockResolvedValue("また行こうね。")

    await generateOnThisDayText("ポチ", memory, "ONE_MONTH", false)

    const [prompt] = vi.mocked(generateText).mock.calls[0]
    expect(prompt).toContain("記録を続けたくなる")
  })

  it("プロンプトにペット名・タイトルが含まれる", async () => {
    vi.mocked(generateText).mockResolvedValue("テスト")

    await generateOnThisDayText("ポチ", memory, "THREE_MONTHS", false)

    const [prompt] = vi.mocked(generateText).mock.calls[0]
    expect(prompt).toContain("ポチ")
    expect(prompt).toContain("公園の散歩")
    expect(prompt).toContain("3ヶ月前")
  })

  it("max_tokens に 100 を渡す", async () => {
    vi.mocked(generateText).mockResolvedValue("テスト")

    await generateOnThisDayText("ポチ", memory, "ONE_YEAR", false)

    const [, maxTokens] = vi.mocked(generateText).mock.calls[0]
    expect(maxTokens).toBe(100)
  })
})

describe("scheduleMemoryNotifications", () => {
  it("3件の通知をDBに登録する", async () => {
    const memoryDate = new Date("2026-01-15")
    await scheduleMemoryNotifications("mem-1", "pet-1", memoryDate)

    expect(prisma.memoryNotification.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ type: "ONE_MONTH" }),
          expect.objectContaining({ type: "THREE_MONTHS" }),
          expect.objectContaining({ type: "ONE_YEAR" }),
        ]),
      })
    )
  })

  it("1ヶ月後の日付が正しく計算される", async () => {
    const memoryDate = new Date("2026-01-15")
    await scheduleMemoryNotifications("mem-1", "pet-1", memoryDate)

    const callArg = vi.mocked(prisma.memoryNotification.createMany).mock.calls[0]?.[0]
    const data = Array.isArray(callArg?.data) ? callArg.data : []
    const oneMonth = data.find((d: { type: string }) => d.type === "ONE_MONTH")
    expect((oneMonth as { scheduledAt: Date })?.scheduledAt.getMonth()).toBe(1) // 2月 (0-indexed)
    expect((oneMonth as { scheduledAt: Date })?.scheduledAt.getDate()).toBe(15)
  })

  it("1年後の日付が正しく計算される", async () => {
    const memoryDate = new Date("2026-03-10")
    await scheduleMemoryNotifications("mem-1", "pet-1", memoryDate)

    const callArg = vi.mocked(prisma.memoryNotification.createMany).mock.calls[0]?.[0]
    const data = Array.isArray(callArg?.data) ? callArg.data : []
    const oneYear = data.find((d: { type: string }) => d.type === "ONE_YEAR")
    expect((oneYear as { scheduledAt: Date })?.scheduledAt.getFullYear()).toBe(2027)
    expect((oneYear as { scheduledAt: Date })?.scheduledAt.getMonth()).toBe(2) // 3月
    expect((oneYear as { scheduledAt: Date })?.scheduledAt.getDate()).toBe(10)
  })
})
