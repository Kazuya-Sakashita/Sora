export type PhotobookItem = {
  id: string
  title: string
  date: string
  photoUrl: string | null
  moodTag: string | null
}

export type PhotobookData = {
  petName: string
  petPhotoUrl: string | null
  year: number
  month: number
  monthLabel: string
  items: PhotobookItem[]
}

type RawMemory = {
  id: string
  title: string
  date: string
  photoUrls: string[]
  moodTag: string | null
}

export function buildPhotobookData(
  pet: { name: string; photoUrl: string | null },
  memories: RawMemory[],
  year: number,
  month: number
): PhotobookData {
  const items = memories
    .filter((m) => {
      const d = new Date(m.date)
      return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((m) => ({
      id: m.id,
      title: m.title,
      date: m.date,
      photoUrl: m.photoUrls[0] ?? null,
      moodTag: m.moodTag,
    }))

  return {
    petName: pet.name,
    petPhotoUrl: pet.photoUrl,
    year,
    month,
    monthLabel: `${year}年${month}月`,
    items,
  }
}
