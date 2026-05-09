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

  const [memory, totalCount] = await Promise.all([
    prisma.memory.findFirst({
      where: { id: memoryId, petId },
      select: { title: true, description: true, moodTag: true, date: true, photoUrls: true },
    }),
    prisma.memory.count({ where: { petId } }),
  ])
  if (!memory) return problem(404, "Not Found")

  const pet = access.pet
  const isRainbowBridge = pet.status === "RAINBOW_BRIDGE"
  const hasPhoto = Array.isArray(memory.photoUrls) && memory.photoUrls.length > 0

  const moodMap: Record<string, string> = {
    HAPPY: "うれしそう", CALM: "おだやか", FUN: "楽しそう",
    WORRIED: "心配そう", LOVING: "愛おしい",
    SAD: "悲しい", LONELY: "さみしい", GRATEFUL: "ありがたい",
  }
  const mood = memory.moodTag ? (moodMap[memory.moodTag] ?? "") : ""

  const milestones = [10, 50, 100, 200, 500]
  const countHint = milestones.includes(totalCount)
    ? `これは${pet.name}との${totalCount}件目の記録です。`
    : ""

  const photoHint = hasPhoto
    ? "この記録には写真が添えられています。"
    : "この記録はテキストのみです。"

  const toneGuide = isRainbowBridge
    ? `${pet.name}はすでに虹の橋を渡りました。応答は懐かしむトーンで過去形を基本とし、「今日もここに来てくれた」という静かな受容を込めてください。励まし・前を向くよう促す言葉は絶対に使わないでください。`
    : `${pet.name}はまだ一緒に生活しています。穏やかで温かい語り口で、記録した今日を肯定してください。`

  const prompt = `あなたはペット記録アプリ「Sora」のAIです。飼い主が${pet.name}との記録を残しました。

【記録の内容】
タイトル：${memory.title}${memory.description ? `\n詳細：${memory.description}` : ""}${mood ? `\n気持ち：${mood}` : ""}
${photoHint}
${countHint}

【トーンの指針】
${toneGuide}

【返答のルール】
- 1〜3文以内（短いほど良い）
- タイトルや内容の具体的な言葉を必ず1語以上使うこと
- 絵文字・「！」禁止
- 疑問文は1文まで（なければ不要）
- 「すばらしい」「すごいですね」などの過度な賞賛禁止
- 「記録してくれてありがとう」などの定型文禁止
- 「頑張って」「前を向いて」「大丈夫」などの励まし禁止
- 日本語のみ`

  try {
    const reaction = await generateText(prompt, 180)
    return NextResponse.json({ reaction })
  } catch {
    return problem(500, "Internal Server Error", "AIリアクションの生成に失敗しました")
  }
}
