import type { Memory, Feeling } from "@/lib/app-context"

const MOOD_LABEL: Record<string, string> = {
  happy: "うれしい 🥰",
  calm: "おだやか 😌",
  fun: "笑った 😄",
  worried: "心配 😟",
  loving: "愛おしい 💝",
}

export type MonthSummary = {
  month: number // 1-12
  label: string // "1月"
  memoryCount: number
  photoCount: number
  topMoodLabel: string | null
}

export type ReportData = {
  petName: string
  petPhotoUrl: string | null
  year: number
  totalMemories: number
  totalPhotos: number
  months: MonthSummary[]
  featuredMemories: Array<{
    title: string
    date: string
    photoUrl: string | null
  }>
}

export function buildReportData(
  pet: { name: string; photoUrl: string | null },
  memories: Memory[],
  feelings: Feeling[],
  year: number
): ReportData {
  const yearMemories = memories.filter(
    (m) => new Date(`${m.date}T00:00:00Z`).getUTCFullYear() === year
  )
  const yearFeelings = feelings.filter(
    (f) => new Date(`${f.date}T00:00:00Z`).getUTCFullYear() === year
  )

  const months: MonthSummary[] = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const mems = yearMemories.filter(
      (m) => new Date(`${m.date}T00:00:00Z`).getUTCMonth() + 1 === month
    )
    const feels = yearFeelings.filter(
      (f) => new Date(`${f.date}T00:00:00Z`).getUTCMonth() + 1 === month
    )

    const tagCounts: Record<string, number> = {}
    for (const f of feels) tagCounts[f.tag] = (tagCounts[f.tag] ?? 0) + 1
    const topTag =
      Object.keys(tagCounts).length > 0
        ? Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0][0]
        : null

    return {
      month,
      label: `${month}月`,
      memoryCount: mems.length,
      photoCount: mems.reduce((acc, m) => acc + m.photoUrls.length, 0),
      topMoodLabel: topTag ? (MOOD_LABEL[topTag] ?? topTag) : null,
    }
  })

  const featured = yearMemories
    .filter((m) => m.photoUrls.length > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)
    .map((m) => ({ title: m.title, date: m.date, photoUrl: m.photoUrls[0] }))

  return {
    petName: pet.name,
    petPhotoUrl: pet.photoUrl,
    year,
    totalMemories: yearMemories.length,
    totalPhotos: yearMemories.reduce((acc, m) => acc + m.photoUrls.length, 0),
    months,
    featuredMemories: featured,
  }
}
