import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { problem } from "@/lib/auth"
import { webpush } from "@/lib/push-server"
import { calcStreak } from "@/lib/streak"

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${cronSecret}`) return problem(401, "Unauthorized")
  }

  // 先週（月〜日）の範囲を UTC で計算
  const now = new Date()
  const dayOfWeek = now.getUTCDay() // 0=Sun
  const endOfLastWeek = new Date(now)
  endOfLastWeek.setUTCDate(now.getUTCDate() - dayOfWeek)
  endOfLastWeek.setUTCHours(0, 0, 0, 0)
  const startOfLastWeek = new Date(endOfLastWeek)
  startOfLastWeek.setUTCDate(endOfLastWeek.getUTCDate() - 7)

  const gteStr = startOfLastWeek.toISOString().split("T")[0]
  const lteStr = new Date(endOfLastWeek.getTime() - 1).toISOString().split("T")[0]

  const subscriptions = await prisma.pushSubscription.findMany({
    include: {
      user: {
        include: {
          pets: {
            take: 1,
            orderBy: { createdAt: "asc" },
            include: { memories: { select: { date: true }, orderBy: { date: "desc" } } },
          },
        },
      },
    },
  })

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pet = sub.user.pets[0]
      const petName = pet?.name ?? "あなたの大切な子"
      const allDates = (pet?.memories ?? []).map((m) =>
        m.date instanceof Date ? m.date.toISOString().split("T")[0] : String(m.date)
      )

      const weekCount = allDates.filter((d) => d >= gteStr && d <= lteStr).length
      const streak = calcStreak(allDates)

      let body: string
      if (weekCount >= 1) {
        body = `先週は${weekCount}件記録しました🎉 今週も続けましょう`
      } else if (streak > 0) {
        body = `ストリークが途切れる前に、今日記録しませんか🔥`
      } else {
        body = `${petName}の今週を残しませんか`
      }

      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: "Sora", body, url: "/" })
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
