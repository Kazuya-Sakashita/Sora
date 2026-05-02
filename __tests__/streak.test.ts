import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { calcStreak, getMilestoneMessage } from "@/lib/streak"

function setToday(dateStr: string) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(`${dateStr}T10:00:00Z`))
}

describe("calcStreak", () => {
  afterEach(() => vi.useRealTimers())

  it("記録がない場合は 0 を返す", () => {
    setToday("2026-05-02")
    expect(calcStreak([])).toBe(0)
  })

  it("今日だけ記録があれば 1 を返す", () => {
    setToday("2026-05-02")
    expect(calcStreak(["2026-05-02"])).toBe(1)
  })

  it("今日と昨日の連続で 2 を返す", () => {
    setToday("2026-05-02")
    expect(calcStreak(["2026-05-01", "2026-05-02"])).toBe(2)
  })

  it("3日連続で 3 を返す", () => {
    setToday("2026-05-05")
    expect(calcStreak(["2026-05-03", "2026-05-04", "2026-05-05"])).toBe(3)
  })

  it("昨日まで連続していれば今日未記録でも続く", () => {
    setToday("2026-05-05")
    // 今日（05-05）は記録なし、昨日（05-04）まで3日連続
    expect(calcStreak(["2026-05-02", "2026-05-03", "2026-05-04"])).toBe(3)
  })

  it("一日おきはストリークにならない", () => {
    setToday("2026-05-05")
    expect(calcStreak(["2026-05-03", "2026-05-05"])).toBe(1)
  })

  it("今日も昨日も記録がなければ 0 を返す", () => {
    setToday("2026-05-10")
    expect(calcStreak(["2026-05-07", "2026-05-08"])).toBe(0)
  })

  it("同じ日付が重複していても正しくカウントする", () => {
    setToday("2026-05-03")
    expect(calcStreak(["2026-05-01", "2026-05-01", "2026-05-02", "2026-05-03"])).toBe(3)
  })

  it("100日連続で 100 を返す（計算精度確認）", () => {
    setToday("2026-05-05")
    const dates: string[] = []
    for (let i = 99; i >= 0; i--) {
      const d = new Date("2026-05-05T10:00:00Z")
      d.setDate(d.getDate() - i)
      dates.push(d.toISOString().split("T")[0])
    }
    expect(calcStreak(dates)).toBe(100)
  })
})

describe("getMilestoneMessage", () => {
  it("7日で節目メッセージを返す", () => {
    expect(getMilestoneMessage(7)).toContain("7日")
  })

  it("30日で節目メッセージを返す", () => {
    expect(getMilestoneMessage(30)).toContain("30日")
  })

  it("100日で節目メッセージを返す", () => {
    expect(getMilestoneMessage(100)).toContain("100日")
  })

  it("節目以外では null を返す", () => {
    expect(getMilestoneMessage(1)).toBeNull()
    expect(getMilestoneMessage(10)).toBeNull()
    expect(getMilestoneMessage(50)).toBeNull()
  })
})
