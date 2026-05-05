import { generateText } from "@/lib/ai"

type MemorySnippet = {
  title: string
  description?: string | null
  moodTag?: string | null
  date: string
}

export async function generateMonthlyLetter(
  petName: string,
  memories: MemorySnippet[],
  year: number,
  month: number
): Promise<string> {
  const memorySummary = memories
    .map((m) => {
      const parts = [`・${m.date} 「${m.title}」`]
      if (m.description) parts.push(`  ${m.description.slice(0, 80)}`)
      if (m.moodTag) parts.push(`  気持ち: ${m.moodTag}`)
      return parts.join("\n")
    })
    .join("\n")

  const prompt = `あなたはペットとの日々の記録を読んで、飼い主へ手紙を書くアシスタントです。
以下のルールを厳守してください。
- 200〜300字の手紙形式で書く
- ペット名「${petName}」と実際の記録内容を必ず含める
- 汎用的・テンプレート的な文言は使わない
- 絵文字は使わない
- 「天国」「虹の橋」「乗り越える」などの言葉は使わない
- 穏やかで温かい語り口
- 末尾は「Sora より」で終える

${year}年${month}月の記録（${memories.length}件）:
${memorySummary}

上記の記録をもとに、この月を振り返る手紙を書いてください。`

  return generateText(prompt, 400)
}
