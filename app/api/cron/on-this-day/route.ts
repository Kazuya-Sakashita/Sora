import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { problem } from "@/lib/auth"
import { webpush } from "@/lib/push-server"
import { generateOnThisDayText } from "@/lib/on-this-day"

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${cronSecret}`) return problem(401, "Unauthorized")
  }

  // 今日の範囲（UTC）
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

  // 今日が scheduledAt で未送信の通知を取得
  const pending = await prisma.memoryNotification.findMany({
    where: {
      scheduledAt: { gte: todayStart, lt: todayEnd },
      sentAt: null,
      pet: {
        user: { onThisDayEnabled: true },
      },
    },
    include: {
      memory: { select: { title: true, description: true, moodTag: true } },
      pet: {
        select: {
          name: true,
          status: true,
          userId: true,
        },
      },
    },
  })

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const notif of pending) {
    const subs = await prisma.pushSubscription.findMany({
      where: { userId: notif.pet.userId },
    })

    if (subs.length === 0) { skipped++; continue }

    try {
      const isRainbowBridge = notif.pet.status === "RAINBOW_BRIDGE"
      const body = await generateOnThisDayText(
        notif.pet.name,
        notif.memory,
        notif.type,
        isRainbowBridge
      )

      const pushResults = await Promise.allSettled(
        subs.map((sub) =>
          webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title: "Sora", body, url: `/?memoryId=${notif.memoryId}` })
          )
        )
      )

      const failedEndpoints = subs
        .filter((_, i) => pushResults[i].status === "rejected")
        .map((s) => s.endpoint)
      if (failedEndpoints.length > 0) {
        await prisma.pushSubscription.deleteMany({
          where: { endpoint: { in: failedEndpoints } },
        })
      }

      await prisma.memoryNotification.update({
        where: { id: notif.id },
        data: { sentAt: new Date() },
      })

      sent++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ sent, skipped, failed })
}
