import type { Metadata } from "next"
import { notFound } from "next/navigation"

type ShareMemory = {
  id: string
  title: string
  description: string | null
  date: string
  petName: string
  petPhotoUrl: string | null
  photoUrl: string | null
}

async function fetchShareMemory(memoryId: string): Promise<ShareMemory | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  try {
    const res = await fetch(`${baseUrl}/api/share/${memoryId}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

type Props = { params: Promise<{ memoryId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { memoryId } = await params
  const memory = await fetchShareMemory(memoryId)
  if (!memory) return { title: "Sora" }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const ogImageUrl = new URL("/api/og", baseUrl)
  ogImageUrl.searchParams.set("title", memory.title)
  ogImageUrl.searchParams.set("date", memory.date)
  ogImageUrl.searchParams.set("petName", memory.petName)
  if (memory.photoUrl) ogImageUrl.searchParams.set("photoUrl", memory.photoUrl)

  return {
    title: `${memory.petName}との思い出 — ${memory.title} | Sora`,
    description: memory.description ?? `${memory.petName}との大切な思い出`,
    openGraph: {
      title: memory.title,
      description: memory.description ?? `${memory.petName}との大切な思い出`,
      images: [{ url: ogImageUrl.toString(), width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: memory.title,
      description: memory.description ?? `${memory.petName}との大切な思い出`,
      images: [ogImageUrl.toString()],
    },
  }
}

export default async function SharePage({ params }: Props) {
  const { memoryId } = await params
  const memory = await fetchShareMemory(memoryId)
  if (!memory) notFound()

  const dateLabel = new Date(`${memory.date}T00:00:00Z`).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EEE4] to-[#EDD9B5] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="rounded-3xl overflow-hidden bg-white/70 backdrop-blur-xl border border-white/60 shadow-2xl">
          {memory.photoUrl ? (
            <img
              src={memory.photoUrl}
              alt={memory.title}
              className="w-full aspect-4/3 object-cover"
            />
          ) : (
            <div className="w-full aspect-4/3 bg-gradient-to-br from-[#F0E6D8] to-[#E8D5B0] flex items-center justify-center">
              <span className="text-7xl opacity-40">🐾</span>
            </div>
          )}

          <div className="p-6 space-y-3">
            <p className="text-sm font-medium text-[#A07840]">{memory.petName}との思い出</p>
            <h1 className="text-xl font-bold text-[#3D2B1F] leading-snug">{memory.title}</h1>
            {memory.description && (
              <p className="text-sm text-[#6B5040] leading-relaxed">{memory.description}</p>
            )}
            <p className="text-xs text-[#A08060]">{dateLabel}</p>
          </div>
        </div>

        {/* App badge */}
        <div className="mt-6 text-center space-y-1">
          <p className="text-sm font-semibold text-[#A07840] tracking-wide">Sora</p>
          <p className="text-xs text-[#A08060]">ペットとの毎日を残す場所</p>
        </div>
      </div>
    </div>
  )
}
