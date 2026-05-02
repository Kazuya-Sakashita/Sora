import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { GET } from "@/app/api/push/weekly/route"
import { NextRequest } from "next/server"

vi.mock("@/lib/prisma", () => ({
  default: {
    pushSubscription: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/push-server", () => ({
  webpush: {
    sendNotification: vi.fn().mockResolvedValue(undefined),
  },
}))

import prisma from "@/lib/prisma"
import { webpush } from "@/lib/push-server"

function makeRequest(secret?: string) {
  const headers: Record<string, string> = {}
  if (secret) headers["authorization"] = `Bearer ${secret}`
  return new NextRequest("http://localhost/api/push/weekly", { headers })
}

function makeSubscription(petName: string, dates: string[]) {
  return {
    id: "sub1",
    endpoint: "https://push.example.com/endpoint",
    p256dh: "key",
    auth: "auth",
    user: {
      pets: [{ name: petName, memories: dates.map((d) => ({ date: d })) }],
    },
  }
}

describe("GET /api/push/weekly", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-04T08:00:00Z")) // 月曜（UTC）
    process.env.CRON_SECRET = ""
  })

  afterEach(() => vi.useRealTimers())

  it("CRON_SECRET が設定されていて認証ヘッダーなしなら 401", async () => {
    process.env.CRON_SECRET = "secret123"
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it("CRON_SECRET が一致すれば通過する", async () => {
    process.env.CRON_SECRET = "secret123"
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([])
    const res = await GET(makeRequest("secret123"))
    expect(res.status).toBe(200)
  })

  it("先週の記録が1件以上ある場合は「n件記録」通知", async () => {
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([
      makeSubscription("モモ", ["2026-04-27", "2026-04-28"]) as never,
    ])
    await GET(makeRequest())
    expect(webpush.sendNotification).toHaveBeenCalledOnce()
    const payload = JSON.parse(vi.mocked(webpush.sendNotification).mock.calls[0][1] as string)
    expect(payload.body).toContain("2件記録しました")
  })

  it("先週0件かつストリーク>0なら復帰通知", async () => {
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([
      makeSubscription("モモ", ["2026-05-03"]) as never,
    ])
    await GET(makeRequest())
    const payload = JSON.parse(vi.mocked(webpush.sendNotification).mock.calls[0][1] as string)
    expect(payload.body).toContain("ストリークが途切れる前に")
  })

  it("先週0件かつストリーク=0なら一般通知", async () => {
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([
      makeSubscription("モモ", []) as never,
    ])
    await GET(makeRequest())
    const payload = JSON.parse(vi.mocked(webpush.sendNotification).mock.calls[0][1] as string)
    expect(payload.body).toContain("モモの今週を残しませんか")
  })

  it("送信失敗したエンドポイントを削除する", async () => {
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([
      makeSubscription("モモ", []) as never,
    ])
    vi.mocked(webpush.sendNotification).mockRejectedValueOnce(new Error("Gone"))
    await GET(makeRequest())
    expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
      where: { endpoint: { in: ["https://push.example.com/endpoint"] } },
    })
  })
})
