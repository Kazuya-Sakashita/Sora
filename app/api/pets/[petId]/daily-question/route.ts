import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"
import { getPetAccess } from "@/lib/pet-access"
import { generateText } from "@/lib/ai"

type Params = { params: Promise<{ petId: string }> }

const SPECIES_JA: Record<string, string> = {
  dog: "犬", cat: "猫", rabbit: "うさぎ", bird: "鳥", other: "ペット",
}

const MONTH_SEASON: Record<number, string> = {
  1: "冬", 2: "冬", 3: "春", 4: "春", 5: "春",
  6: "梅雨", 7: "夏", 8: "夏", 9: "秋", 10: "秋",
  11: "秋", 12: "冬",
}

function todayJST(): string {
  return new Date().toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-")
}

async function getCachedQuestion(petId: string, date: string): Promise<string | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  try {
    const res = await fetch(`${url}/get/sora:dq:${petId}:${date}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    return data.result ?? null
  } catch {
    return null
  }
}

async function setCachedQuestion(petId: string, date: string, question: string): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return
  try {
    // expire at end of day: 86400s is safe upper bound
    await fetch(`${url}/set/sora:dq:${petId}:${date}/${encodeURIComponent(question)}?ex=86400`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    // ignore cache write errors
  }
}

export async function GET(_req: Request, { params }: Params) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const { petId } = await params
  const access = await getPetAccess(petId, user.id)
  if (!access) return problem(404, "Not Found")

  const date = todayJST()
  const cached = await getCachedQuestion(petId, date)
  if (cached) {
    return NextResponse.json({ question: cached, generatedAt: date })
  }

  const pet = access.pet
  const speciesJa = pet.species ? (SPECIES_JA[pet.species] ?? "ペット") : "ペット"
  const month = new Date().getMonth() + 1
  const season = MONTH_SEASON[month] ?? ""

  const recentMemories = await prisma.memory.findMany({
    where: { petId, date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] } },
    orderBy: { date: "desc" },
    take: 5,
    select: { title: true },
  })

  const recentTitles = recentMemories.map((m) => `・${m.title}`).join("\n")
  const recentSection = recentTitles ? `\n直近の記録：\n${recentTitles}` : ""

  const prompt = `あなたはペット記録アプリ「Sora」のAIです。飼い主が今日の記録を残すきっかけを作る「今日の問いかけ」を1つ生成してください。

ペット名：${pet.name}
種類：${speciesJa}
季節：${season}${recentSection}

ルール：
- 1文のみ（20〜35文字）
- 「今日の${pet.name}は〜」や「${pet.name}と〜しましたか？」など自然な問いかけ
- 季節・直近の記録を参考にして具体性を持たせる
- 直近記録の繰り返しは避ける
- 絵文字禁止
- 日本語のみ
- 文末は「？」で終わる`

  const defaultQuestion = `今日の${pet.name}はどんな様子でしたか？`

  try {
    const question = await generateText(prompt, 80)
    const finalQuestion = question || defaultQuestion
    await setCachedQuestion(petId, date, finalQuestion)
    return NextResponse.json({ question: finalQuestion, generatedAt: date })
  } catch {
    return NextResponse.json({ question: defaultQuestion, generatedAt: date })
  }
}
