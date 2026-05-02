import type { Feeling } from "@/lib/app-context"

export const MOOD_TAGS = ["happy", "calm", "fun", "worried", "loving"] as const
export type MoodTag = (typeof MOOD_TAGS)[number]

export const MOOD_INFO: Record<MoodTag, { label: string; emoji: string; color: string }> = {
  happy:   { label: "うれしい", emoji: "🥰", color: "#F09090" },
  calm:    { label: "おだやか", emoji: "😌", color: "#90B4E8" },
  fun:     { label: "笑った",   emoji: "😄", color: "#F0C870" },
  worried: { label: "心配",     emoji: "😟", color: "#B890E0" },
  loving:  { label: "愛おしい", emoji: "💝", color: "#F090B8" },
}

export type TrendPoint = {
  dateKey: string
  label: string
  happy: number
  calm: number
  fun: number
  worried: number
  loving: number
}

function toDateKey(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function buildDailyTrend(feelings: Feeling[], today: Date = new Date()): TrendPoint[] {
  const todayKey = toDateKey(today)
  const points: TrendPoint[] = []

  for (let i = 29; i >= 0; i--) {
    const d = new Date(`${todayKey}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() - i)
    const key = toDateKey(d)
    const label = `${d.getUTCMonth() + 1}/${d.getUTCDate()}`

    const dayFeelings = feelings.filter((f) => f.date === key)
    points.push({
      dateKey: key,
      label,
      happy:   dayFeelings.filter((f) => f.tag === "happy").length,
      calm:    dayFeelings.filter((f) => f.tag === "calm").length,
      fun:     dayFeelings.filter((f) => f.tag === "fun").length,
      worried: dayFeelings.filter((f) => f.tag === "worried").length,
      loving:  dayFeelings.filter((f) => f.tag === "loving").length,
    })
  }
  return points
}

export function buildWeeklySummary(feelings: Feeling[], today: Date = new Date()): string | null {
  const todayKey = toDateKey(today)
  const weekStartDate = new Date(`${todayKey}T00:00:00Z`)
  weekStartDate.setUTCDate(weekStartDate.getUTCDate() - 6)
  const weekStartKey = toDateKey(weekStartDate)

  const weekFeelings = feelings.filter(
    (f) => f.date >= weekStartKey && f.date <= todayKey
  )
  if (weekFeelings.length < 3) return null

  const counts: Record<string, number> = {}
  for (const f of weekFeelings) {
    counts[f.tag] = (counts[f.tag] ?? 0) + 1
  }

  const topTag = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
  if (!topTag) return null

  const info = MOOD_INFO[topTag as MoodTag]
  if (!info) return null

  return `今週は${info.emoji} ${info.label}が多かったです`
}
