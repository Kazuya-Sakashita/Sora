import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"
import { getPetAccess } from "@/lib/pet-access"
import { generateText } from "@/lib/ai"

type Params = { params: Promise<{ petId: string; memoryId: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const { petId, memoryId } = await params
  const access = await getPetAccess(petId, user.id)
  if (!access) return problem(404, "Not Found")

  const memory = await prisma.memory.findFirst({
    where: { id: memoryId, petId },
    select: { title: true, description: true, moodTag: true, date: true },
  })
  if (!memory) return problem(404, "Not Found")

  const moodMap: Record<string, string> = {
    HAPPY: "うれしそう", CALM: "おだやか", FUN: "楽しそう",
    WORRIED: "心配", LOVING: "愛おしい",
  }
  const mood = memory.moodTag ? moodMap[memory.moodTag] ?? "" : ""
  const desc = memory.description ? `\n内容：${memory.description}` : ""

  const prompt = `あなたはペット記録アプリ「Sora」のAIです。飼い主が今日の記録を残しました。
ペット名：${access.pet.name}
タイトル：${memory.title}${desc}${mood ? `\n気持ち：${mood}` : ""}

この記録に対して、飼い主に短いひと言を返してください。

ルール：
- 2〜3文以内
- 穏やかで温かい語り口
- 絵文字・感嘆符・質問禁止
- 「素晴らしい」「すごい」などの過度な褒め言葉禁止
- 「残してくれてありがとう」などの定型文禁止
- 記録の内容に具体的に触れること
- 日本語のみ`

  try {
    const reaction = await generateText(prompt, 150)
    return NextResponse.json({ reaction })
  } catch {
    return problem(500, "Internal Server Error", "AIリアクションの生成に失敗しました")
  }
}
