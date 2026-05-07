import { describe, it, expect, vi, beforeEach } from "vitest"

// --- モック ---
vi.mock("@/lib/prisma", () => ({
  default: {
    memory: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    user: { findUnique: vi.fn() },
  },
}))
vi.mock("@/lib/auth", () => ({
  getAuthUser: vi.fn(),
  problem: vi.fn((status: number, _title: string, detail?: string) =>
    Response.json({ status, detail }, { status })
  ),
}))
vi.mock("@/lib/pet-access", () => ({ getPetAccess: vi.fn() }))
vi.mock("@/lib/validate", () => ({
  parseBody: vi.fn().mockResolvedValue({
    error: null,
    data: {
      title: "今日のポチ",
      date: "2026-05-08",
      category: "other",
      moodTag: "happy",
      photoUrls: [],
    },
  }),
}))
vi.mock("@/lib/schemas", () => ({ MemoryInputSchema: {} }))
vi.mock("@/lib/on-this-day", () => ({
  scheduleMemoryNotifications: vi.fn().mockResolvedValue(undefined),
}))

import { GET, POST } from "@/app/api/pets/[petId]/memories/route"
import { getAuthUser } from "@/lib/auth"
import { getPetAccess } from "@/lib/pet-access"
import { parseBody } from "@/lib/validate"
import prisma from "@/lib/prisma"

const mockUser = { id: "user-1", email: "test@example.com" }
const mockPet = { id: "pet-1", name: "ポチ", status: "ALIVE", species: "dog" }

const mockMemory = {
  id: "mem-1",
  title: "公園の散歩",
  description: "楽しかった",
  date: new Date("2026-05-08"),
  category: "OTHER",
  moodTag: "HAPPY",
  photoUrls: [],
  createdAt: new Date("2026-05-08T10:00:00Z"),
}

function makeParams(petId: string) {
  return { params: Promise.resolve({ petId }) }
}

function makeGetRequest(query = "") {
  return new Request(`http://localhost/api/pets/pet-1/memories${query}`)
}

function makePostRequest(body: object) {
  return new Request("http://localhost/api/pets/pet-1/memories", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

const defaultParsedBody = {
  error: null,
  data: {
    title: "今日のポチ",
    date: "2026-05-08",
    category: "other",
    moodTag: "happy",
    photoUrls: [],
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getAuthUser).mockResolvedValue({ user: mockUser as never, errorResponse: null })
  vi.mocked(getPetAccess).mockResolvedValue({ pet: mockPet as never } as never)
  vi.mocked(prisma.memory.findMany).mockResolvedValue([mockMemory as never])
  vi.mocked(prisma.memory.count).mockResolvedValue(1)
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "FREE" } as never)
  vi.mocked(prisma.memory.create).mockResolvedValue(mockMemory as never)
  vi.mocked(parseBody).mockResolvedValue(defaultParsedBody as never)
})

describe("GET /api/pets/[petId]/memories", () => {
  it("未認証の場合 401 を返す", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      user: null as never,
      errorResponse: Response.json({}, { status: 401 }) as never,
    })

    const res = await GET(makeGetRequest(), makeParams("pet-1"))
    expect(res.status).toBe(401)
  })

  it("ペットアクセス権がない場合 404 を返す", async () => {
    vi.mocked(getPetAccess).mockResolvedValue(null)

    const res = await GET(makeGetRequest(), makeParams("pet-1"))
    expect(res.status).toBe(404)
  })

  it("items と total を含むレスポンスを返す", async () => {
    const res = await GET(makeGetRequest(), makeParams("pet-1"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveProperty("items")
    expect(body).toHaveProperty("total")
    expect(body.total).toBe(1)
  })

  it("記録のレスポンス形式が正しい（moodTag が小文字）", async () => {
    const res = await GET(makeGetRequest(), makeParams("pet-1"))
    const body = await res.json()

    const item = body.items[0]
    expect(item.id).toBe("mem-1")
    expect(item.title).toBe("公園の散歩")
    expect(item.moodTag).toBe("happy")
    expect(item.category).toBe("other")
    expect(item.date).toBe("2026-05-08")
  })

  it("category クエリパラメータを where 条件に渡す", async () => {
    await GET(makeGetRequest("?category=diary"), makeParams("pet-1"))

    expect(prisma.memory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ category: "DIARY" }),
      })
    )
  })

  it("limit の上限は 100 件", async () => {
    await GET(makeGetRequest("?limit=999"), makeParams("pet-1"))

    expect(prisma.memory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    )
  })
})

describe("POST /api/pets/[petId]/memories", () => {
  it("未認証の場合 401 を返す", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({
      user: null as never,
      errorResponse: Response.json({}, { status: 401 }) as never,
    })

    const res = await POST(makePostRequest({}), makeParams("pet-1"))
    expect(res.status).toBe(401)
  })

  it("ペットアクセス権がない場合 404 を返す", async () => {
    vi.mocked(getPetAccess).mockResolvedValue(null)

    const res = await POST(makePostRequest({}), makeParams("pet-1"))
    expect(res.status).toBe(404)
  })

  it("バリデーションエラーがあれば error レスポンスを返す", async () => {
    vi.mocked(parseBody).mockResolvedValue({
      error: Response.json({ error: "invalid" }, { status: 400 }) as never,
      data: null as never,
    })

    const res = await POST(makePostRequest({}), makeParams("pet-1"))
    expect(res.status).toBe(400)
  })

  it("FREE プランで 50 件上限に達した場合 402 を返す", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "FREE" } as never)
    vi.mocked(prisma.memory.count).mockResolvedValue(50)

    const res = await POST(makePostRequest({}), makeParams("pet-1"))
    expect(res.status).toBe(402)
  })

  it("FREE プラン 49 件なら記録できる", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "FREE" } as never)
    vi.mocked(prisma.memory.count).mockResolvedValue(49)

    const res = await POST(makePostRequest({}), makeParams("pet-1"))
    expect(res.status).toBe(201)
  })

  it("PLUS プランは 50 件超えても記録できる", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "PLUS" } as never)
    vi.mocked(prisma.memory.count).mockResolvedValue(200)

    const res = await POST(makePostRequest({}), makeParams("pet-1"))
    expect(res.status).toBe(201)
  })

  it("正常作成時に 201 と記録データを返す", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "PLUS" } as never)

    const res = await POST(makePostRequest({}), makeParams("pet-1"))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.id).toBe("mem-1")
    expect(body.title).toBe("公園の散歩")
    expect(body.moodTag).toBe("happy")
  })

  it("prisma.memory.create が正しいデータで呼ばれる", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "PLUS" } as never)
    vi.mocked(parseBody).mockResolvedValue({
      error: null,
      data: {
        title: "今日のポチ",
        date: "2026-05-08",
        category: "diary",
        moodTag: "calm",
        description: "のんびりした日",
        photoUrls: ["https://example.com/photo.jpg"],
      },
    } as never)

    await POST(makePostRequest({}), makeParams("pet-1"))

    expect(prisma.memory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          petId: "pet-1",
          title: "今日のポチ",
          category: "DIARY",
          moodTag: "CALM",
        }),
      })
    )
  })
})
