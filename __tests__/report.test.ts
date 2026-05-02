import { describe, it, expect } from "vitest"
import { buildReportData } from "@/lib/report"
import type { Memory, Feeling } from "@/lib/app-context"

const pet = { name: "ポチ", photoUrl: null }

function mem(overrides: Partial<Memory> = {}): Memory {
  return {
    id: "m1",
    title: "お散歩",
    description: null,
    date: "2025-04-10",
    category: "other",
    moodTag: null,
    photoUrls: [],
    createdAt: "2025-04-10T00:00:00Z",
    ...overrides,
  }
}

function feel(overrides: Partial<Feeling> = {}): Feeling {
  return {
    id: "f1",
    tag: "happy",
    memo: null,
    date: "2025-04-10",
    createdAt: "2025-04-10T00:00:00Z",
    ...overrides,
  }
}

describe("buildReportData", () => {
  it("対象年の記録のみ集計する", () => {
    const memories = [
      mem({ id: "1", date: "2025-03-01" }),
      mem({ id: "2", date: "2024-12-31" }),
      mem({ id: "3", date: "2026-01-01" }),
    ]
    const result = buildReportData(pet, memories, [], 2025)
    expect(result.totalMemories).toBe(1)
  })

  it("totalPhotos が全写真を合計する", () => {
    const memories = [
      mem({ id: "1", date: "2025-04-01", photoUrls: ["a.jpg", "b.jpg"] }),
      mem({ id: "2", date: "2025-05-01", photoUrls: ["c.jpg"] }),
    ]
    const result = buildReportData(pet, memories, [], 2025)
    expect(result.totalPhotos).toBe(3)
  })

  it("months に 12 件返る", () => {
    const result = buildReportData(pet, [], [], 2025)
    expect(result.months).toHaveLength(12)
  })

  it("月別 memoryCount が正しく分配される", () => {
    const memories = [
      mem({ id: "1", date: "2025-03-10" }),
      mem({ id: "2", date: "2025-03-20" }),
      mem({ id: "3", date: "2025-07-01" }),
    ]
    const result = buildReportData(pet, memories, [], 2025)
    expect(result.months[2].memoryCount).toBe(2) // 3月 (index 2)
    expect(result.months[6].memoryCount).toBe(1) // 7月 (index 6)
    expect(result.months[0].memoryCount).toBe(0) // 1月
  })

  it("月別 topMoodLabel に日本語ラベルが入る", () => {
    const feelings = [
      feel({ id: "1", date: "2025-04-01", tag: "calm" }),
      feel({ id: "2", date: "2025-04-05", tag: "calm" }),
      feel({ id: "3", date: "2025-04-10", tag: "happy" }),
    ]
    const result = buildReportData(pet, [], feelings, 2025)
    expect(result.months[3].topMoodLabel).toContain("おだやか")
  })

  it("featuredMemories に写真付き記録が最大5件入る", () => {
    const memories = Array.from({ length: 8 }, (_, i) =>
      mem({ id: `m${i}`, date: `2025-0${(i % 9) + 1}-01`, photoUrls: [`photo${i}.jpg`] })
    )
    const result = buildReportData(pet, memories, [], 2025)
    expect(result.featuredMemories.length).toBeLessThanOrEqual(5)
  })

  it("写真なしの記録は featuredMemories に含まれない", () => {
    const memories = [
      mem({ id: "1", date: "2025-04-01", photoUrls: [] }),
      mem({ id: "2", date: "2025-05-01", photoUrls: ["a.jpg"] }),
    ]
    const result = buildReportData(pet, memories, [], 2025)
    expect(result.featuredMemories.every((m) => m.photoUrl !== null)).toBe(true)
  })

  it("year と petName が結果に含まれる", () => {
    const result = buildReportData({ name: "ミケ", photoUrl: null }, [], [], 2025)
    expect(result.year).toBe(2025)
    expect(result.petName).toBe("ミケ")
  })
})
