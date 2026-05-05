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

  if (access.pet.status !== "RAINBOW_BRIDGE") return problem(403, "Forbidden")

  const rateLimitResponse = await applyLetterRateLimit(user.id)
  if (rateLimitResponse) return rateLimitResponse

  const recentMemories = await prisma.memory.findMany({
    where: { petId },
    orderBy: { date: "desc" },
    take: 5,
    select: { title: true, description: true, moodTag: true, date: true },
  })

  const memoryLines = recentMemories
    .map((m) => {
      const mood = m.moodTag ? `（${MOOD_JA[m.moodTag] ?? ""}）` : ""
      const desc = m.description ? ` — ${m.description.slice(0, 50)}` : ""
      const date = m.date.toISOString().split("T")[0]
      return `・${date} ${m.title}${mood}${desc}`
    })
    .join("\n")

  const memoriesSection = memoryLines
    ? `\n飼い主の思い出記録（直近5件）：\n${memoryLines}`
    : ""

  const prompt = `あなたはペット記録アプリ「Sora」のAIです。
大切な${access.pet.name}を見送った飼い主に、穏やかな手紙を書いてください。${memoriesSection}

手紙ルール：
- 150〜200字
- 手紙形式（「〇〇さんへ」などの書き出しは不要）
- 上記の思い出記録から具体的なエピソードを1〜2個取り上げる
- 汎用的な慰めの言葉（「立ち直れます」「天国で」など）禁止
- 絵文字禁止
- 命令形禁止
- 穏やか・問いかけベースの語り口
- 日本語のみ
- ペット視点での発言禁止

手紙本文のみ出力してください。`

  try {
    const content = await generateText(prompt, 300)
    return NextResponse.json({ content })
  } catch {
    return problem(500, "Internal Server Error", "手紙の生成に失敗しました")
  }
}
