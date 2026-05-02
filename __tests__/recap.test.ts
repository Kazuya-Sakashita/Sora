import { describe, it, expect, vi, afterEach } from "vitest"
import { isRecapWindow, getLastMonth, buildMonthlyRecap } from "@/lib/recap"
import type { Memory, Feeling } from "@/lib/app-context"

afterEach(() => vi.useRealTimers())

function setToday(utcDateStr: string) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(`${utcDateStr}T10:00:00Z`))
}

function mem(overrides: Partial<Memory> = {}): Memory {
  return {
    id: "m1",
    date: "2026-04-15",
    title: "公園散歩",
    description: "",
    category: "OTHER",
    photoUrls: [],
    moodTag: null,
    createdAt: "2026-04-15T00:00:00Z",
    ...overrides,
  }
}

describe("isRecapWindow", () => {
  it("1日はウィンドウ内", () => {
    setToday("2026-05-01")
    expect(isRecapWindow()).toBe(true)
  })

  it("7日はウィンドウ内", () => {
    setToday("2026-05-07")
    expect(isRecapWindow()).toBe(true)
  })

  it("8日はウィンドウ外", () => {
    setToday("2026-05-08")
    expect(isRecapWindow()).toBe(false)
  })

  it("月末はウィンドウ外", () => {
    setToday("2026-04-30")
    expect(isRecapWindow()).toBe(false)
  })

  it("引数で日付を渡せる", () => {
    expect(isRecapWindow(new Date("2026-05-03T00:00:00Z"))).toBe(true)
    expect(isRecapWindow(new Date("2026-05-10T00:00:00Z"))).toBe(false)
  })
})

describe("getLastMonth", () => {
  it("5月のとき先月は4月を返す", () => {
    const result = getLastMonth(new Date("2026-05-03T00:00:00Z"))
    expect(result).toEqual({ year: 2026, month: 4 })
  })

  it("1月のとき先月は前年12月を返す", () => {
    const result = getLastMonth(new Date("2026-01-05T00:00:00Z"))
    expect(result).toEqual({ year: 2025, month: 12 })
  })

  it("12月のとき先月は11月を返す", () => {
    const result = getLastMonth(new Date("2026-12-01T00:00:00Z"))
    expect(result).toEqual({ year: 2026, month: 11 })
  })
})

describe("buildMonthlyRecap", () => {
  const today = new Date("2026-05-03T10:00:00Z")

  it("先月の記録が0件のとき null を返す", () => {
    const result = buildMonthlyRecap([], [], today)
    expect(result).toBeNull()
  })

  it("今月・他月の記録は含めず先月のみ集計する", () => {
    const memories: Memory[] = [
      mem({ id: "1", date: "2026-04-10" }),
      mem({ id: "2", date: "2026-03-15" }),
      mem({ id: "3", date: "2026-05-01" }),
    ]
    const result = buildMonthlyRecap(memories, [], today)
    expect(result?.memoryCount).toBe(1)
  })

  it("label が正しいフォーマットで返る", () => {
    const memories: Memory[] = [mem({ id: "1", date: "2026-04-10" })]
    const result = buildMonthlyRecap(memories, [], today)
    expect(result?.label).toBe("2026年4月")
  })

  it("year / month が正しく返る", () => {
    const memories: Memory[] = [mem({ id: "1", date: "2026-04-10" })]
    const result = buildMonthlyRecap(memories, [], today)
    expect(result?.year).toBe(2026)
    expect(result?.month).toBe(4)
  })

  it("photoCount が合計される", () => {
    const memories: Memory[] = [
      mem({ id: "1", date: "2026-04-10", photoUrls: ["a.jpg", "b.jpg"] }),
      mem({ id: "2", date: "2026-04-20", photoUrls: ["c.jpg"] }),
    ]
    const result = buildMonthlyRecap(memories, [], today)
    expect(result?.photoCount).toBe(3)
  })

  it("photoUrls がない場合 photoCount は 0", () => {
    const memories: Memory[] = [mem({ id: "1", date: "2026-04-10", photoUrls: [] })]
    const result = buildMonthlyRecap(memories, [], today)
    expect(result?.photoCount).toBe(0)
  })

  it("topMoodTag に最頻気持ちタグの日本語ラベルが入る", () => {
    const memories: Memory[] = [
      mem({ id: "1", date: "2026-04-01", moodTag: "happy" }),
      mem({ id: "2", date: "2026-04-02", moodTag: "happy" }),
      mem({ id: "3", date: "2026-04-03", moodTag: "calm" }),
    ]
    const result = buildMonthlyRecap(memories, [], today)
    expect(result?.topMoodTag).toBe("うれしい")
  })

  it("moodTag が全て null のとき topMoodTag は null", () => {
    const memories: Memory[] = [
      mem({ id: "1", date: "2026-04-01", moodTag: null }),
    ]
    const result = buildMonthlyRecap(memories, [], today)
    expect(result?.topMoodTag).toBeNull()
  })

  it("coverPhotoUrl に最初の写真付き記録のURLが入る", () => {
    const memories: Memory[] = [
      mem({ id: "1", date: "2026-04-20", photoUrls: ["later.jpg"] }),
      mem({ id: "2", date: "2026-04-05", photoUrls: ["first.jpg"] }),
      mem({ id: "3", date: "2026-04-01", photoUrls: [] }),
    ]
    const result = buildMonthlyRecap(memories, [], today)
    expect(result?.coverPhotoUrl).toBe("first.jpg")
  })

  it("写真が一枚もないとき coverPhotoUrl は null", () => {
    const memories: Memory[] = [
      mem({ id: "1", date: "2026-04-10", photoUrls: [] }),
    ]
    const result = buildMonthlyRecap(memories, [], today)
    expect(result?.coverPhotoUrl).toBeNull()
  })

  it("1月のとき前年12月の記録を集計する", () => {
    const jan = new Date("2026-01-03T10:00:00Z")
    const memories: Memory[] = [
      mem({ id: "1", date: "2025-12-25" }),
      mem({ id: "2", date: "2026-01-01" }),
    ]
    const result = buildMonthlyRecap(memories, [], jan)
    expect(result?.memoryCount).toBe(1)
    expect(result?.label).toBe("2025年12月")
  })
})
