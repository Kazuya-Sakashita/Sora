import { generateText } from "@/lib/ai"
import prisma from "@/lib/prisma"

export type NotificationType = "ONE_MONTH" | "THREE_MONTHS" | "ONE_YEAR"

const TYPE_LABEL: Record<NotificationType, string> = {
  ONE_MONTH: "1ヶ月前",
  THREE_MONTHS: "3ヶ月前",
  ONE_YEAR: "1年前",
}

export async function generateOnThisDayText(
  petName: string,
  memory: { title: string; description?: string | null; moodTag?: string | null },
  type: NotificationType,
  isRainbowBridge: boolean
): Promise<string> {
  const label = TYPE_LABEL[type]
  const moodText = memory.moodTag ? `（気持ち：${memory.moodTag}）` : ""
  const descText = memory.description ? `\n内容：${memory.description.slice(0, 100)}` : ""

  const styleInstruction = isRainbowBridge
    ? "懐かしむ語り口で、「残してくれてよかった」という気持ちが伝わるように書く。悲しみを煽らず、温かく。"
    : "ほっこりとした語り口で、記録を続けたくなるように書く。"

  const prompt = `ペット名「${petName}」の記録を振り返る通知文を1〜2行で書いてください。
タイトル：${memory.title}${descText}${moodText}
いつの記録：${label}の今日

ルール：
- ${styleInstruction}
- 絵文字禁止
- 「天国」「虹の橋」「乗り越える」禁止
- 「ペット名と〇〇でしたね」の形式を意識する
- 50字以内`

  return generateText(prompt, 100)
}

export async function scheduleMemoryNotifications(
  memoryId: string,
  petId: string,
  memoryDate: Date
): Promise<void> {
  const schedules: { type: NotificationType; scheduledAt: Date }[] = [
    {
      type: "ONE_MONTH",
      scheduledAt: new Date(memoryDate.getFullYear(), memoryDate.getMonth() + 1, memoryDate.getDate()),
    },
    {
      type: "THREE_MONTHS",
      scheduledAt: new Date(memoryDate.getFullYear(), memoryDate.getMonth() + 3, memoryDate.getDate()),
    },
    {
      type: "ONE_YEAR",
      scheduledAt: new Date(memoryDate.getFullYear() + 1, memoryDate.getMonth(), memoryDate.getDate()),
    },
  ]

  await prisma.memoryNotification.createMany({
    data: schedules.map((s) => ({
      memoryId,
      petId,
      scheduledAt: s.scheduledAt,
      type: s.type,
    })),
    skipDuplicates: true,
  })
}
