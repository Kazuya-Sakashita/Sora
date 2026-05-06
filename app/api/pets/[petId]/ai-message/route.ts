import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"
import { getPetAccess } from "@/lib/pet-access"
import { generateText } from "@/lib/ai"
import { applyLetterRateLimit } from "@/lib/ratelimit"

type Params = { params: Promise<{ petId: string }> }

const MOOD_JA: Record<string, string> = {
  HAPPY: "うれしそう", CALM: "おだやか", FUN: "楽しそう", WORRIED: "心配", LOVING: "愛おしい",
}

export async function POST(_req: Request, { params }: Params) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const { petId } = await params
  const access = await getPetAccess(petId, user.id)
  if (!access) return problem(404, "Not Found")

  const rateLimitResponse = await applyLetterRateLimit(user.id)
  if (rateLimitResponse) return rateLimitResponse

  const recentMemories = await prisma.memory.findMany({
    where: { petId },
    orderBy: { date: "desc" },
    take: 5,
    select: { title: true, description: true, moodTag: true, date: true },
  })

  if (recentMemories.length < 3) {
    return problem(422, "Not enough memories", "記録が3件以上必要です")
  }

  const memoryLines = recentMemories
    .map((m) => {
      const mood = m.moodTag ? `（${MOOD_JA[m.moodTag] ?? ""}）` : ""
      const desc = m.description ? ` — ${m.description.slice(0, 40)}` : ""
      return `・${m.title}${mood}${desc}`
    })
    .join("\n")

  const now = new Date()
  const yearMonth = `${now.getFullYear()}年${now.getMonth() + 1}月`

  const prompt = `あなたはペット記録アプリ「Sora」のAIです。
飼い主が${yearMonth}に残した${access.pet.name}との記録を読みました。

直近の記録：
${memoryLines}

この記録を読んで感じたことを、50〜80字で短く伝えてください。

ルール：
- 記録の具体的なエピソードを1つ引用する
- やさしく・問いかけベースの語り口
- 絵文字・感嘆符禁止
- 「素晴らしい」などの過度な褒め言葉禁止
- 日本語のみ
- 本文のみ出力`

  try {
    const message = await generateText(prompt, 150)
    return NextResponse.json({ message })
  } catch {
    return problem(500, "Internal Server Error", "メッセージの生成に失敗しました")
  }
}
