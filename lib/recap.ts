import type { Memory, Feeling } from "@/lib/app-context"

export type MonthlyRecap = {
  year: number
  month: number // 1-indexed (表示用)
  label: string // "2026年4月"
  memoryCount: number
  photoCount: number
  topMoodTag: string | null
  coverPhotoUrl: string | null
}

const MOOD_LABEL: Record<string, string> = {
  happy: "うれしい",
  calm: "おだやか",
  fun: "笑った",
  worried: "心配",
  loving: "愛おしい",
  lonely: "さみしい",
  sad: "かなしい",
  grateful: "感謝",
  anxious: "不安",
}

/**
 * 今日が毎月1〜7日かどうかを判定する。
 */
export function isRecapWindow(today: Date = new Date()): boolean {
  return today.getUTCDate() >= 1 && today.getUTCDate() <= 7
}

/**
 * 先月（UTC）の年・月（1-indexed）を返す。
 */
export function getLastMonth(today: Date = new Date()): { year: number; month: number } {
  const year = today.getUTCFullYear()
  const month = today.getUTCMonth() // 0-indexed
  if (month === 0) return { year: year - 1, month: 12 }
  return { year, month } // month は 1-indexed で返す（0-indexed の今月 = 先月の1-indexed）
}

/**
 * memories / feelings から先月の月次ふりかえりデータを生成する。
 * 先月の記録が0件の場合は null を返す。
 */
export function buildMonthlyRecap(
  memories: Memory[],
  _feelings: Feeling[],
  today: Date = new Date()
): MonthlyRecap | null {
  const { year, month } = getLastMonth(today)

  const lastMonthMemories = memories.filter((m) => {
    const d = new Date(`${m.date}T00:00:00Z`)
    return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month
  })

  if (lastMonthMemories.length === 0) return null

  const photoCount = lastMonthMemories.reduce((acc, m) => acc + m.photoUrls.length, 0)

  // 最多気持ちタグ（moodTag から集計）
  const tagCounts: Record<string, number> = {}
  for (const m of lastMonthMemories) {
    if (m.moodTag) tagCounts[m.moodTag] = (tagCounts[m.moodTag] ?? 0) + 1
  }
  const topMoodTag =
    Object.keys(tagCounts).length > 0
      ? Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0][0]
      : null

  // カバー写真: 先月最初の写真付き記録
  const coverPhotoUrl =
    lastMonthMemories
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .find((m) => m.photoUrls.length > 0)?.photoUrls[0] ?? null

  return {
    year,
    month,
    label: `${year}年${month}月`,
    memoryCount: lastMonthMemories.length,
    photoCount,
    topMoodTag: topMoodTag ? (MOOD_LABEL[topMoodTag] ?? topMoodTag) : null,
    coverPhotoUrl,
  }
}
