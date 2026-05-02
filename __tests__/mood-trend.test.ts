import { describe, it, expect, vi, afterEach } from "vitest"
import { buildDailyTrend, buildWeeklySummary } from "@/lib/mood-trend"
import type { Feeling } from "@/lib/app-context"

afterEach(() => vi.useRealTimers())

function feeling(overrides: Partial<Feeling> = {}): Feeling {
  return {
    id: "f1",
    tag: "happy",
    memo: null,
    date: "2026-05-01",
    createdAt: "2026-05-01T00:00:00Z",
    ...overrides,
  }
}

const TODAY = new Date("2026-05-02T10:00:00Z")

describe("buildDailyTrend", () => {
  it("30日分のデータを返す", () => {
    const result = buildDailyTrend([], TODAY)
    expect(result).toHaveLength(30)
  })

  it("最初のエントリは30日前の日付", () => {
    const result = buildDailyTrend([], TODAY)
    expect(result[0].dateKey).toBe("2026-04-03")
  })

  it("最後のエントリは今日の日付", () => {
    const result = buildDailyTrend([], TODAY)
    expect(result[29].dateKey).toBe("2026-05-02")
  })

  it("label が M/D 形式", () => {
    const result = buildDailyTrend([], TODAY)
    expect(result[29].label).toBe("5/2")
  })

  it("該当日のタグカウントが正しく集計される", () => {
    const feelings = [
      feeling({ date: "2026-05-02", tag: "happy" }),
      feeling({ id: "f2", date: "2026-05-02", tag: "happy" }),
      feeling({ id: "f3", date: "2026-05-02", tag: "calm" }),
    ]
    const result = buildDailyTrend(feelings, TODAY)
    const today = result[29]
    expect(today.happy).toBe(2)
    expect(today.calm).toBe(1)
    expect(today.fun).toBe(0)
    expect(today.worried).toBe(0)
    expect(today.loving).toBe(0)
  })

  it("範囲外の日付は集計されない", () => {
    const feelings = [
      feeling({ date: "2026-04-01", tag: "happy" }),
    ]
    const result = buildDailyTrend(feelings, TODAY)
    const total = result.reduce((acc, d) => acc + d.happy, 0)
    expect(total).toBe(0)
  })

  it("範囲内の複数日にまたがるデータを正しく分配する", () => {
    const feelings = [
      feeling({ id: "f1", date: "2026-04-03", tag: "calm" }),
      feeling({ id: "f2", date: "2026-05-01", tag: "loving" }),
    ]
    const result = buildDailyTrend(feelings, TODAY)
    expect(result[0].calm).toBe(1)
    expect(result[28].loving).toBe(1)
  })
})

describe("buildWeeklySummary", () => {
  it("記録が3件未満のとき null を返す", () => {
    const feelings = [
      feeling({ id: "f1", date: "2026-05-01", tag: "happy" }),
      feeling({ id: "f2", date: "2026-04-30", tag: "happy" }),
    ]
    expect(buildWeeklySummary(feelings, TODAY)).toBeNull()
  })

  it("最多タグの日本語ラベルと絵文字が含まれる", () => {
    const feelings = [
      feeling({ id: "f1", date: "2026-05-02", tag: "calm" }),
      feeling({ id: "f2", date: "2026-05-01", tag: "calm" }),
      feeling({ id: "f3", date: "2026-04-30", tag: "calm" }),
      feeling({ id: "f4", date: "2026-04-29", tag: "happy" }),
    ]
    const result = buildWeeklySummary(feelings, TODAY)
    expect(result).toContain("おだやか")
    expect(result).toContain("😌")
  })

  it("今週の範囲外のデータは無視される", () => {
    const feelings = [
      feeling({ id: "f1", date: "2026-04-20", tag: "worried" }),
      feeling({ id: "f2", date: "2026-04-21", tag: "worried" }),
      feeling({ id: "f3", date: "2026-04-22", tag: "worried" }),
      feeling({ id: "f4", date: "2026-05-02", tag: "happy" }),
      feeling({ id: "f5", date: "2026-05-01", tag: "happy" }),
      feeling({ id: "f6", date: "2026-04-30", tag: "happy" }),
    ]
    const result = buildWeeklySummary(feelings, TODAY)
    expect(result).toContain("うれしい")
    expect(result).not.toContain("心配")
  })

  it("テキストフォーマットが正しい", () => {
    const feelings = Array.from({ length: 4 }, (_, i) =>
      feeling({ id: `f${i}`, date: "2026-05-02", tag: "loving" })
    )
    const result = buildWeeklySummary(feelings, TODAY)
    expect(result).toBe("今週は💝 愛おしいが多かったです")
  })
})
