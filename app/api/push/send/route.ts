import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { problem } from "@/lib/auth"
import { webpush } from "@/lib/push-server"

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${cronSecret}`) {
      return problem(401, "Unauthorized")
    }
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    include: {
      user: {
        include: {
          pets: { orderBy: { createdAt: "asc" }, take: 1 },
        },
      },
    },
  })

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const petName = sub.user.pets[0]?.name ?? "あなたの大切な子"
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: "Sora",
          body: `${petName}との今日を残しませんか`,
          url: "/",
        })
      )
    })
  )

  const succeeded = results.filter((r) => r.status === "fulfilled").length
  const failed = results.filter((r) => r.status === "rejected").length

  if (failed > 0) {
    const failedEndpoints = subscriptions
      .filter((_, i) => results[i].status === "rejected")
      .map((s) => s.endpoint)
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: failedEndpoints } },
    })
  }

  return NextResponse.json({ sent: succeeded, removed: failed })
}
