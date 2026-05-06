import { describe, it, expect } from "vitest"
import { CRISIS_KEYWORDS } from "@/app/api/pets/[petId]/chat/route"

describe("CRISIS_KEYWORDS", () => {
  it("危機キーワードリストが定義されている", () => {
    expect(CRISIS_KEYWORDS.length).toBeGreaterThan(0)
  })

  it("「死にたい」がリストに含まれる", () => {
    expect(CRISIS_KEYWORDS).toContain("死にたい")
  })

  it("「消えてしまいたい」がリストに含まれる", () => {
    expect(CRISIS_KEYWORDS).toContain("消えてしまいたい")
  })

  it("「自殺」がリストに含まれる", () => {
    expect(CRISIS_KEYWORDS).toContain("自殺")
  })
})

describe("containsCrisisKeyword (via keyword match)", () => {
  const contains = (text: string) => CRISIS_KEYWORDS.some((kw) => text.includes(kw))

  it("危機フレーズを含む文を検出する", () => {
    expect(contains("もう死にたいです")).toBe(true)
    expect(contains("消えてしまいたい気持ちがある")).toBe(true)
    expect(contains("自殺を考えてしまう")).toBe(true)
  })

  it("通常の悲しみの表現は検出しない", () => {
    expect(contains("さみしいです")).toBe(false)
    expect(contains("会いたいな")).toBe(false)
    expect(contains("つらい")).toBe(false)
    expect(contains("悲しい")).toBe(false)
  })
})
