export function calcDaysWith(broughtAt: string): number {
  const start = new Date(broughtAt)
  start.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = today.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return "おはようございます"
  if (hour >= 12 && hour < 18) return "こんにちは"
  return "こんばんは"
}
