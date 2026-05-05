import { describe, it, expect, vi, beforeEach } from "vitest"

// --- モック ---
vi.mock("@/lib/ai", () => ({ generateText: vi.fn() }))
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
vi.mock("@/lib/ratelimit", () => ({ applyLetterRateLimit: vi.fn().mockResolvedValue(null) }))

import { POST } from "@/app/api/pets/[petId]/letter/generate/route"
import { generateText } from "@/lib/ai"
import { getAuthUser } from "@/lib/auth"
import { getPetAccess } from "@/lib/pet-access"
import prisma from "@/lib/prisma"

const mockUser = { id: "user-1", email: "test@example.com" }
const mockPet = { id: "pet-1", name: "ポチ", status: "RAINBOW_BRIDGE", species: "dog" }

function makeParams(petId: string) {
  return { params: Promise.resolve({ petId }) }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getAuthUser).mockResolvedValue({ user: mockUser as never, errorResponse: null })
  vi.mocked(getPetAccess).mockResolvedValue({ pet: mockPet as never } as never)
  vi.mocked(prisma.memory.findMany).mockResolvedValue([])
})

describe("POST /api/pets/[petId]/letter/generate", () => {
  it("ロスケアペットで手紙を生成して返す", async () => {
    vi.mocked(generateText).mockResolvedValue("あなたとの日々は大切な宝物です。")

    const res = await POST(new Request("http://localhost"), makeParams("pet-1"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.content).toBe("あなたとの日々は大切な宝物です。")
  })

  it("思い出記録がプロンプトに含まれる", async () => {
    vi.mocked(prisma.memory.findMany).mockResolvedValue([
      { title: "公園の散歩", description: "楽しかった", moodTag: "HAPPY", date: new Date("2026-04-01") } as never,
    ])
    vi.mocked(generateText).mockResolvedValue("テスト")

    await POST(new Request("http://localhost"), makeParams("pet-1"))

    const [prompt] = vi.mocked(generateText).mock.calls[0]
    expect(prompt).toContain("公園の散歩")
    expect(prompt).toContain("ポチ")
  })

  it("未認証の場合 401 を返す", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      user: null as never,
      errorResponse: Response.json({}, { status: 401 }) as never,
    })

    const res = await POST(new Request("http://localhost"), makeParams("pet-1"))
    expect(res.status).toBe(401)
  })

  it("ペットが見つからない場合 404 を返す", async () => {
    vi.mocked(getPetAccess).mockResolvedValue(null)

    const res = await POST(new Request("http://localhost"), makeParams("pet-1"))
    expect(res.status).toBe(404)
  })

  it("RAINBOW_BRIDGE 以外のペットは 403 を返す", async () => {
    vi.mocked(getPetAccess).mockResolvedValue({ pet: { ...mockPet, status: "ALIVE" } as never } as never)

    const res = await POST(new Request("http://localhost"), makeParams("pet-1"))
    expect(res.status).toBe(403)
  })

  it("AI 生成失敗時に 500 を返す", async () => {
    vi.mocked(generateText).mockRejectedValue(new Error("AI error"))

    const res = await POST(new Request("http://localhost"), makeParams("pet-1"))
    expect(res.status).toBe(500)
  })

  it("max_tokens に 300 を渡す", async () => {
    vi.mocked(generateText).mockResolvedValue("テスト")

    await POST(new Request("http://localhost"), makeParams("pet-1"))

    const [, maxTokens] = vi.mocked(generateText).mock.calls[0]
    expect(maxTokens).toBe(300)
  })
})
