import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { problem } from "@/lib/auth"
import { webpush } from "@/lib/push-server"
import { generateMonthlyLetter } from "@/lib/letter"

const MIN_MEMORIES = 3

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${cronSecret}`) return problem(401, "Unauthorized")
  }

  // 先月の年・月を計算
  const now = new Date()
  const targetDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const year = targetDate.getFullYear()
  const month = targetDate.getMonth() + 1 // 1-indexed

  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 1)

  // Sora+ ユーザーのペット一覧を取得
  const plusPets = await prisma.pet.findMany({
    where: { user: { plan: "PLUS" } },
    include: {
      memories: {
        where: { date: { gte: monthStart, lt: monthEnd } },
        select: { title: true, description: true, moodTag: true, date: true },
        orderBy: { date: "asc" },
      },
    },
  })

  let generated = 0
  let skipped = 0
  let failed = 0

  for (const pet of plusPets) {
    // 既に生成済みならスキップ
    const existing = await prisma.monthlyLetter.findUnique({
      where: { petId_year_month: { petId: pet.id, year, month } },
    })
    if (existing) { skipped++; continue }

    // 3件未満はスキップ
    if (pet.memories.length < MIN_MEMORIES) { skipped++; continue }

    try {
      const memories = pet.memories.map((m) => ({
        title: m.title,
        description: m.description,
        moodTag: m.moodTag,
        date: m.date.toISOString().split("T")[0],
      }))

      const content = await generateMonthlyLetter(pet.name, memories, year, month)

      const letter = await prisma.monthlyLetter.create({
        data: { petId: pet.id, year, month, content },
      })

      // プッシュ通知を送信
      const subs = await prisma.pushSubscription.findMany({
        where: { userId: pet.userId },
      })
      const notifyResults = await Promise.allSettled(
        subs.map((sub) =>
          webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({
              title: "Sora",
              body: `${pet.name}との今月のレターが届きました`,
              url: "/settings",
            })
          )
        )
      )

      // 失敗したサブスクリプションを削除
      const failedEndpoints = subs
        .filter((_, i) => notifyResults[i].status === "rejected")
        .map((s) => s.endpoint)
      if (failedEndpoints.length > 0) {
        await prisma.pushSubscription.deleteMany({
          where: { endpoint: { in: failedEndpoints } },
        })
      }

      await prisma.monthlyLetter.update({
        where: { id: letter.id },
        data: { notifiedAt: new Date() },
      })

      generated++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ year, month, generated, skipped, failed })
}
