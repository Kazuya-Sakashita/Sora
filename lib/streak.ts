function toDateKey(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  const d = String(date.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function prevDay(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return toDateKey(d)
}

/**
 * memories の date 配列（"YYYY-MM-DD"）から連続記録日数を返す。
 * 今日または昨日が最新記録の場合のみカウント（途切れたらリセット）。
 */
export function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0

  const recorded = new Set(dates)
  const todayKey = toDateKey(new Date())
  const yesterdayKey = prevDay(todayKey)

  if (!recorded.has(todayKey) && !recorded.has(yesterdayKey)) return 0

  let streak = 0
  let cursor = recorded.has(todayKey) ? todayKey : yesterdayKey

  while (recorded.has(cursor)) {
    streak++
    cursor = prevDay(cursor)
  }

  return streak
}

export const STREAK_MILESTONES = [7, 30, 100] as const

export function getMilestoneMessage(streak: number): string | null {
  if (streak === 100) return "🌟 100日連続記録達成！すごい積み重ねです"
  if (streak === 30) return "✨ 30日連続記録！一ヶ月間続けられました"
  if (streak === 7) return "🎉 7日連続記録！一週間続きました"
  return null
}
