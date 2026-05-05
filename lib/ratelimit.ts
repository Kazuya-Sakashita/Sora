import { NextRequest, NextResponse } from "next/server"

let limiter: { limit: (id: string) => Promise<{ success: boolean }> } | null = null
let chatLimiter: { limit: (id: string) => Promise<{ success: boolean }> } | null = null

function getLimiter() {
  if (limiter) return limiter
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  const { Ratelimit } = require("@upstash/ratelimit")
  const { Redis } = require("@upstash/redis")
  limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    prefix: "sora:rl",
  })
  return limiter
}

function getChatLimiter() {
  if (chatLimiter) return chatLimiter
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  const { Ratelimit } = require("@upstash/ratelimit")
  const { Redis } = require("@upstash/redis")
  chatLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "sora:chat:rl",
  })
  return chatLimiter
}

export async function applyRateLimit(req: NextRequest): Promise<NextResponse | null> {
  if (process.env.NODE_ENV === "development") return null

  const rl = getLimiter()
  if (!rl) return null

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anonymous"
  const { success } = await rl.limit(ip)
  if (!success) {
    return NextResponse.json(
      { type: "https://sora.app/errors/too-many-requests", title: "Too Many Requests", status: 429 },
      { status: 429 }
    )
  }
  return null
}

export async function applyChatRateLimit(userId: string): Promise<NextResponse | null> {
  if (process.env.NODE_ENV === "development") return null

  const rl = getChatLimiter()
  if (!rl) return null

  const { success } = await rl.limit(userId)
  if (!success) {
    return NextResponse.json(
      { type: "https://sora.app/errors/too-many-requests", title: "少し待ってから、もう一度試してみてください", status: 429 },
      { status: 429 }
    )
  }
  return null
}
