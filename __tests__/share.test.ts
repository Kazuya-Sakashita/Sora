import { describe, it, expect, vi, beforeEach } from "vitest"
import { shareMemory } from "@/lib/share"

const mockShare = vi.fn()
const mockWriteText = vi.fn()

// jsdom provides window.location.origin = "http://localhost:3000"
const BASE = "http://localhost:3000"

beforeEach(() => {
  mockShare.mockReset()
  mockWriteText.mockReset()
})

describe("shareMemory — navigator.share 対応ブラウザ", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", {
      share: mockShare,
      clipboard: { writeText: mockWriteText },
    })
  })

  it("share() が呼ばれ 'shared' を返す", async () => {
    mockShare.mockResolvedValueOnce(undefined)
    const result = await shareMemory("mem-123", "公園散歩")
    expect(result).toBe("shared")
    expect(mockShare).toHaveBeenCalledWith({
      title: "公園散歩",
      url: "http://localhost:3000/share/mem-123",
    })
  })

  it("share() がキャンセルされたとき clipboard にフォールバック", async () => {
    mockShare.mockRejectedValueOnce(new Error("AbortError"))
    mockWriteText.mockResolvedValueOnce(undefined)
    const result = await shareMemory("mem-123", "公園散歩")
    expect(result).toBe("copied")
    expect(mockWriteText).toHaveBeenCalledWith("http://localhost:3000/share/mem-123")
  })
})

describe("shareMemory — navigator.share 非対応ブラウザ", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: mockWriteText },
    })
  })

  it("clipboard.writeText を呼んで 'copied' を返す", async () => {
    mockWriteText.mockResolvedValueOnce(undefined)
    const result = await shareMemory("mem-456", "お散歩")
    expect(result).toBe("copied")
    expect(mockWriteText).toHaveBeenCalledWith("http://localhost:3000/share/mem-456")
  })

  it("シェアURLに正しい memoryId が含まれる", async () => {
    mockWriteText.mockResolvedValueOnce(undefined)
    await shareMemory("abc-def-123", "タイトル")
    expect(mockWriteText).toHaveBeenCalledWith(
      expect.stringContaining("/share/abc-def-123")
    )
  })
})
