import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"
import { getPetAccess } from "@/lib/pet-access"
import { generateChat } from "@/lib/ai"
import { applyChatRateLimit } from "@/lib/ratelimit"
import { parseBody } from "@/lib/validate"
import { ChatInputSchema } from "@/lib/schemas"

type Params = { params: Promise<{ petId: string }> }

const SPECIES_JA: Record<string, string> = {
  dog: "犬", cat: "猫", rabbit: "うさぎ", bird: "鳥", other: "ペット",
}

const MOOD_JA: Record<string, string> = {
  HAPPY: "うれしそう", CALM: "おだやか", FUN: "楽しそう", WORRIED: "心配", LOVING: "愛おしい",
}

export const CRISIS_KEYWORDS = [
  "死にたい", "死にたくなった", "死にたくなる",
  "消えてしまいたい", "消えたい", "消えてしまいたくなった",
  "もう生きていたくない", "生きていたくない", "生きたくない",
  "自分を傷つけたい", "傷つけたい", "自傷",
  "自殺",
]

const CRISIS_REPLY =
  "今、とても辛い気持ちなんですね。一人で抱えないでください。\nよりそいホットライン（0120-279-338）は24時間つながります。"

function containsCrisisKeyword(text: string): boolean {
  return CRISIS_KEYWORDS.some((kw) => text.includes(kw))
}

export async function POST(req: Request, { params }: Params) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const { petId } = await params
  const access = await getPetAccess(petId, user.id)
  if (!access) return problem(404, "Not Found")

  if (access.pet.status !== "RAINBOW_BRIDGE") return problem(403, "Forbidden")

  const rateLimitResponse = await applyChatRateLimit(user.id)
  if (rateLimitResponse) return rateLimitResponse

  const parsed = await parseBody(ChatInputSchema, req)
  if (parsed.error) return parsed.error

  const { messages, tone, recentFeelings } = parsed.data

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")
  if (lastUserMessage && containsCrisisKeyword(lastUserMessage.content)) {
    return NextResponse.json({ reply: CRISIS_REPLY })
  }

  const recentMemories = await prisma.memory.findMany({
    where: { petId },
    orderBy: { date: "desc" },
    take: 5,
    select: { title: true, description: true, moodTag: true },
  })

  const speciesJa = access.pet.species ? (SPECIES_JA[access.pet.species] ?? "ペット") : "ペット"

  let vaultSection = ""
  if (access.pet.personalityVault) {
    try {
      const vault = JSON.parse(access.pet.personalityVault) as Record<string, string>
      const lines = [
        vault.favoritePlace && `・好きな場所：${vault.favoritePlace}`,
        vault.favoriteThing && `・好きだったもの：${vault.favoriteThing}`,
        vault.habits && `・よくやっていた癖：${vault.habits}`,
        vault.favoriteExpression && `・好きな顔・表情：${vault.favoriteExpression}`,
        vault.dailyLife && `・日常のこと：${vault.dailyLife}`,
      ].filter(Boolean)
      if (lines.length > 0) {
        vaultSection = `\nこの子のこと（飼い主が記録した特徴）：\n${lines.join("\n")}`
      }
    } catch { /* vault is not valid JSON, skip */ }
  }

  const memoryLines = recentMemories
    .map((m) => {
      const mood = m.moodTag ? ` (${MOOD_JA[m.moodTag] ?? ""})` : ""
      const desc = m.description ? ` — ${m.description.slice(0, 50)}` : ""
      return `・${m.title}${mood}${desc}`
    })
    .join("\n")

  const recentSection = memoryLines
    ? `\n直近の思い出（参考にしてください）：\n${memoryLines}`
    : ""

  const feelingsSection = recentFeelings && recentFeelings.length > 0
    ? `\nユーザーの最近の気持ち: ${recentFeelings.join("、")}\n（これらを背景として自然に踏まえてください。感情を直接言及しなくてよい）`
    : ""

  const toneInstruction = tone === "思い出を一緒に振り返る"
    ? "- 思い出を一緒に振り返るように、具体的な記憶に寄り添いながら返す"
    : "- あたたかく、そっと支える語り口で返す"

  const systemPrompt = `あなたはペット記録アプリ「Sora」のAIです。
大切な${access.pet.name}を見送った飼い主が、思い出を穏やかに語れる場を作ってください。

ペット名：${access.pet.name}
種類：${speciesJa}${vaultSection}${recentSection}${feelingsSection}

会話ルール：
- 穏やか・寄り添う語り口（です・ます調）
- 絵文字・感嘆符禁止
- 「素晴らしい」「すごい」など過度な褒め言葉禁止
- ペット視点での発言禁止
- 必要以上に深掘りせず、話してくれたことを受け止める
- 2〜4文で返す
- 日本語のみ
${toneInstruction}`

  try {
    const reply = await generateChat(systemPrompt, messages.slice(-20))
    return NextResponse.json({ reply })
  } catch {
    return problem(500, "Internal Server Error", "AIの応答の生成に失敗しました")
  }
}
