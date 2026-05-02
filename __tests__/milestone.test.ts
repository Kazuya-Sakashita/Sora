import { describe, it, expect, vi, afterEach } from "vitest"
import { getTodayMilestone } from "@/lib/milestone"

function setToday(utcDateStr: string) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(`${utcDateStr}T10:00:00Z`))
}

afterEach(() => vi.useRealTimers())

const pet = (overrides: Partial<{ name: string; broughtAt: string | null; birthDate: string | null }> = {}) => ({
  name: "ポチ",
  broughtAt: null,
  birthDate: null,
  ...overrides,
})

describe("getTodayMilestone — 日数節目", () => {
  it("100日目に days マイルストーンを返す", () => {
    setToday("2026-05-10")
    // broughtAt = 99日前 → 100日目
    const start = new Date("2026-05-10T00:00:00Z")
    start.setUTCDate(start.getUTCDate() - 99)
    const broughtAt = start.toISOString().split("T")[0]
    const result = getTodayMilestone(pet({ broughtAt }))
    expect(result?.type).toBe("days")
    expect(result?.label).toContain("100日")
  })

  it("365日目に days マイルストーンを返す", () => {
    setToday("2026-05-10")
    const start = new Date("2026-05-10T00:00:00Z")
    start.setUTCDate(start.getUTCDate() - 364)
    const broughtAt = start.toISOString().split("T")[0]
    const result = getTodayMilestone(pet({ broughtAt }))
    expect(result?.type).toBe("days")
    expect(result?.label).toContain("1年")
  })

  it("1000日目に days マイルストーンを返す", () => {
    setToday("2026-05-10")
    const start = new Date("2026-05-10T00:00:00Z")
    start.setUTCDate(start.getUTCDate() - 999)
    const broughtAt = start.toISOString().split("T")[0]
    const result = getTodayMilestone(pet({ broughtAt }))
    expect(result?.type).toBe("days")
    expect(result?.label).toContain("1000日")
    expect(result?.emoji).toBe("🌟")
  })

  it("節目以外の日数では null を返す", () => {
    setToday("2026-05-10")
    // 50日目
    const start = new Date("2026-05-10T00:00:00Z")
    start.setUTCDate(start.getUTCDate() - 49)
    const broughtAt = start.toISOString().split("T")[0]
    expect(getTodayMilestone(pet({ broughtAt }))).toBeNull()
  })

  it("broughtAt が null なら null を返す", () => {
    setToday("2026-05-10")
    expect(getTodayMilestone(pet({ broughtAt: null }))).toBeNull()
  })
})

describe("getTodayMilestone — 誕生日", () => {
  it("誕生日当日に birthday マイルストーンを返す", () => {
    setToday("2026-05-02")
    const result = getTodayMilestone(pet({ birthDate: "2023-05-02" }))
    expect(result?.type).toBe("birthday")
    expect(result?.emoji).toBe("🎂")
    expect(result?.label).toContain("誕生日")
  })

  it("年齢がメッセージに含まれる", () => {
    setToday("2026-05-02")
    const result = getTodayMilestone(pet({ birthDate: "2022-05-02" }))
    expect(result?.message).toContain("4歳")
  })

  it("誕生日でない日は null を返す", () => {
    setToday("2026-05-03")
    expect(getTodayMilestone(pet({ birthDate: "2023-05-02" }))).toBeNull()
  })

  it("同年の誕生日（生まれた当日）は対象外", () => {
    setToday("2026-05-02")
    expect(getTodayMilestone(pet({ birthDate: "2026-05-02" }))).toBeNull()
  })
})

describe("getTodayMilestone — お迎え記念日", () => {
  it("お迎え記念日当日に anniversary マイルストーンを返す", () => {
    setToday("2026-05-02")
    const result = getTodayMilestone(pet({ broughtAt: "2024-05-02" }))
    expect(result?.type).toBe("anniversary")
    expect(result?.emoji).toBe("🏠")
    expect(result?.label).toContain("お迎え記念日")
  })

  it("年数がメッセージに含まれる", () => {
    setToday("2026-05-02")
    const result = getTodayMilestone(pet({ broughtAt: "2023-05-02" }))
    expect(result?.message).toContain("3年")
  })

  it("お迎え当日（同年）は対象外", () => {
    setToday("2026-05-02")
    expect(getTodayMilestone(pet({ broughtAt: "2026-05-02" }))).toBeNull()
  })

  it("記念日でない日は null を返す", () => {
    setToday("2026-05-10")
    expect(getTodayMilestone(pet({ broughtAt: "2024-05-02" }))).toBeNull()
  })
})

describe("getTodayMilestone — 優先順位", () => {
  it("日数節目と誕生日が重なった場合は日数節目を優先する", () => {
    setToday("2026-05-10")
    const start = new Date("2026-05-10T00:00:00Z")
    start.setUTCDate(start.getUTCDate() - 99)
    const broughtAt = start.toISOString().split("T")[0]
    const result = getTodayMilestone(pet({ broughtAt, birthDate: "2023-05-10" }))
    expect(result?.type).toBe("days")
  })
})
