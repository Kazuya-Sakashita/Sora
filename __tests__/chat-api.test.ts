import { describe, it, expect, vi, beforeEach } from "vitest"

// --- モック ---
vi.mock("@/lib/prisma", () => ({
  default: {
    memory: { findMany: vi.fn() },
  },
}))
vi.mock("@/lib/auth", () => ({
  getAuthUser: vi.fn(),
  problem: vi.fn((status: number, _title: string, detail?: string) =>
    Response.json({ status, detail }, { status })
  ),
}))
vi.mock("@/lib/pet-access", () => ({ getPetAccess: vi.fn() }))
vi.mock("@/lib/ai", () => ({ generateChat: vi.fn() }))
vi.mock("@/lib/ratelimit", () => ({ applyChatRateLimit: vi.fn().mockResolvedValue(null) }))
vi.mock("@/lib/validate", () => ({
  parseBody: vi.fn().mockResolvedValue({
    error: null,
    data: { messages: [], tone: "やさしく寄り添う", recentFeelings: [] },
  }),
}))
vi.mock("@/lib/schemas", () => ({ ChatInputSchema: {} }))

import { POST } from "@/app/api/pets/[petId]/chat/route"
import { generateChat } from "@/lib/ai"
import { getAuthUser } from "@/lib/auth"
import { getPetAccess } from "@/lib/pet-access"
import { parseBody } from "@/lib/validate"
import prisma from "@/lib/prisma"

const mockUser = { id: "user-1", email: "test@example.com" }
const mockPet = { id: "pet-1", name: "ポチ", status: "RAINBOW_BRIDGE", species: "dog" }

function makeParams(petId: string) {
  return { params: Promise.resolve({ petId }) }
}

function makeRequest(messages: Array<{ role: string; content: string }>, tone = "やさしく寄り添う") {
  return new Request("http://localhost/api/pets/pet-1/chat", {
    method: "POST",
    body: JSON.stringify({ messages, tone }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getAuthUser).mockResolvedValue({ user: mockUser as never, errorResponse: null })
  vi.mocked(getPetAccess).mockResolvedValue({ pet: mockPet as never } as never)
  vi.mocked(prisma.memory.findMany).mockResolvedValue([])
  vi.mocked(generateChat).mockResolvedValue("穏やかな返事です。")
})

describe("POST /api/pets/[petId]/chat", () => {
  describe("危機フレーズ検出", () => {
    it("「死にたい」を含むメッセージはClaudeを呼ばずにホットライン情報を返す", async () => {
      vi.mocked(parseBody).mockResolvedValue({
        error: null,
        data: {
          messages: [{ role: "user", content: "もう死にたいです" }],
          tone: "やさしく寄り添う",
          recentFeelings: [],
        },
      } as never)

      const res = await POST(makeRequest([]), makeParams("pet-1"))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.reply).toContain("よりそいホットライン")
      expect(generateChat).not.toHaveBeenCalled()
    })

    it("「消えてしまいたい」を含む場合もClaude不呼び出し", async () => {
      vi.mocked(parseBody).mockResolvedValue({
        error: null,
        data: {
          messages: [{ role: "user", content: "消えてしまいたい気持ちがある" }],
          tone: "やさしく寄り添う",
          recentFeelings: [],
        },
      } as never)

      const res = await POST(makeRequest([]), makeParams("pet-1"))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.reply).toContain("よりそいホットライン")
      expect(generateChat).not.toHaveBeenCalled()
    })

    it("「自殺」を含む場合もClaude不呼び出し", async () => {
      vi.mocked(parseBody).mockResolvedValue({
        error: null,
        data: {
          messages: [{ role: "user", content: "自殺を考えてしまう" }],
          tone: "やさしく寄り添う",
          recentFeelings: [],
        },
      } as never)

      const res = await POST(makeRequest([]), makeParams("pet-1"))

      expect(generateChat).not.toHaveBeenCalled()
    })

    it("通常の悲しみ表現はClaude APIを呼び出す", async () => {
      vi.mocked(parseBody).mockResolvedValue({
        error: null,
        data: {
          messages: [{ role: "user", content: "さみしいです" }],
          tone: "やさしく寄り添う",
          recentFeelings: [],
        },
      } as never)

      const res = await POST(makeRequest([]), makeParams("pet-1"))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(generateChat).toHaveBeenCalledOnce()
      expect(body.reply).toBe("穏やかな返事です。")
    })

    it("危機フレーズが会話履歴の途中にある場合も検出する", async () => {
      vi.mocked(parseBody).mockResolvedValue({
        error: null,
        data: {
          messages: [
            { role: "user", content: "ポチが恋しいです" },
            { role: "assistant", content: "大切な時間でしたね。" },
            { role: "user", content: "もう生きていたくない" },
          ],
          tone: "やさしく寄り添う",
          recentFeelings: [],
        },
      } as never)

      const res = await POST(makeRequest([]), makeParams("pet-1"))

      expect(generateChat).not.toHaveBeenCalled()
      const body = await res.json()
      expect(body.reply).toContain("よりそいホットライン")
    })
  })

  describe("認証・権限", () => {
    it("未認証の場合 401 を返す", async () => {
      vi.mocked(getAuthUser).mockResolvedValue({
        user: null as never,
        errorResponse: Response.json({}, { status: 401 }) as never,
      })

      const res = await POST(makeRequest([]), makeParams("pet-1"))
      expect(res.status).toBe(401)
    })

    it("ペットが存在しない場合 404 を返す", async () => {
      vi.mocked(getPetAccess).mockResolvedValue(null)

      const res = await POST(makeRequest([]), makeParams("pet-1"))
      expect(res.status).toBe(404)
    })

    it("alive ペットには 403 を返す（rainbow_bridge 以外禁止）", async () => {
      vi.mocked(getPetAccess).mockResolvedValue({
        pet: { ...mockPet, status: "ALIVE" } as never,
      } as never)

      const res = await POST(makeRequest([]), makeParams("pet-1"))
      expect(res.status).toBe(403)
    })
  })

  describe("正常系", () => {
    it("Claude からの返答を reply フィールドで返す", async () => {
      vi.mocked(parseBody).mockResolvedValue({
        error: null,
        data: {
          messages: [{ role: "user", content: "ポチのこと話したい" }],
          tone: "やさしく寄り添う",
          recentFeelings: [],
        },
      } as never)
      vi.mocked(generateChat).mockResolvedValue("ポチのことを聞かせてください。")

      const res = await POST(makeRequest([]), makeParams("pet-1"))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.reply).toBe("ポチのことを聞かせてください。")
    })

    it("Claude API 失敗時は 500 を返す", async () => {
      vi.mocked(parseBody).mockResolvedValue({
        error: null,
        data: {
          messages: [{ role: "user", content: "話したい" }],
          tone: "やさしく寄り添う",
          recentFeelings: [],
        },
      } as never)
      vi.mocked(generateChat).mockRejectedValue(new Error("API error"))

      const res = await POST(makeRequest([]), makeParams("pet-1"))
      expect(res.status).toBe(500)
    })

    it("思い出を一緒に振り返るトーンでも正常動作する", async () => {
      vi.mocked(parseBody).mockResolvedValue({
        error: null,
        data: {
          messages: [{ role: "user", content: "散歩の思い出" }],
          tone: "思い出を一緒に振り返る",
          recentFeelings: ["happy", "calm"],
        },
      } as never)

      const res = await POST(makeRequest([]), makeParams("pet-1"))
      expect(res.status).toBe(200)
      expect(generateChat).toHaveBeenCalledOnce()
    })
  })
})
