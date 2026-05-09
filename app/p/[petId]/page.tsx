import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Image from "next/image"
import prisma from "@/lib/prisma"

type Props = { params: Promise<{ petId: string }> }

async function getPet(petId: string) {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: {
      id: true,
      name: true,
      nickname: true,
      species: true,
      photoUrl: true,
      broughtAt: true,
      status: true,
      publicProfile: true,
      memories: {
        orderBy: { date: "desc" },
        take: 3,
        select: { id: true, title: true, date: true, photoUrls: true },
      },
      _count: { select: { memories: true } },
    },
  })
  if (!pet || !pet.publicProfile) return null
  return pet
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { petId } = await params
  const pet = await getPet(petId)
  if (!pet) return { title: "Not Found" }

  const description = `${pet.name}との${pet._count.memories}件の思い出を記録中`
  return {
    title: `${pet.name} — Sora`,
    description,
    openGraph: {
      title: `${pet.name}の記録 — Sora`,
      description,
      images: pet.photoUrl ? [{ url: pet.photoUrl, width: 1200, height: 630 }] : [],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${pet.name}の記録 — Sora`,
      description,
      images: pet.photoUrl ? [pet.photoUrl] : [],
    },
  }
}

const SPECIES_LABEL: Record<string, string> = {
  dog: "犬",
  cat: "猫",
  rabbit: "うさぎ",
  bird: "鳥",
  other: "その他",
}

function formatDate(d: Date) {
  return d.toISOString().split("T")[0].replace(/-/g, "/")
}

export default async function PublicPetPage({ params }: Props) {
  const { petId } = await params
  const pet = await getPet(petId)
  if (!pet) notFound()

  const broughtAtStr = pet.broughtAt ? pet.broughtAt.toISOString().split("T")[0] : null
  const daysCount = broughtAtStr
    ? Math.floor((Date.now() - new Date(broughtAtStr).getTime()) / 86_400_000)
    : null
  const species = pet.species ? SPECIES_LABEL[pet.species.toLowerCase()] ?? null : null
  const isRainbow = pet.status === "RAINBOW_BRIDGE"

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      {/* Header */}
      <header className="px-4 pt-8 pb-4 text-center">
        <p className="text-sm font-medium text-sky-400 tracking-widest">Sora</p>
        <p className="text-xs text-muted-foreground mt-0.5">ペットとの毎日を残す場所</p>
      </header>

      <main className="max-w-md mx-auto px-4 pb-16 space-y-6">
        {/* Pet card */}
        <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl overflow-hidden">
          {/* Photo */}
          <div className="relative w-full aspect-square bg-sky-50">
            {pet.photoUrl ? (
              <Image
                src={pet.photoUrl}
                alt={pet.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🐾</div>
            )}
            {isRainbow && (
              <div className="absolute top-3 right-3 bg-white/80 backdrop-blur rounded-full px-3 py-1 text-xs font-medium text-purple-500">
                🌈 虹の橋へ
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-6 space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground/90">{pet.name}</h1>
              {(pet.nickname || species) && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {[pet.nickname, species].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              {daysCount !== null && (
                <div className="rounded-2xl bg-sky-50 p-3 text-center">
                  <p className="text-2xl font-bold text-sky-500">{daysCount.toLocaleString("ja-JP")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">いっしょに過ごした日</p>
                </div>
              )}
              <div className="rounded-2xl bg-amber-50 p-3 text-center">
                <p className="text-2xl font-bold text-amber-500">{pet._count.memories.toLocaleString("ja-JP")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">件の思い出</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent memories */}
        {pet.memories.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground/60 px-1">最近の思い出</h2>
            <div className="space-y-2">
              {pet.memories.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-2xl bg-white/80 backdrop-blur border border-white/60 shadow-sm p-4"
                >
                  {m.photoUrls[0] ? (
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                      <Image src={m.photoUrls[0]} alt={m.title} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0 text-xl">
                      📝
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground/80 truncate">{m.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(m.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-3xl bg-gradient-to-br from-sky-400 to-blue-500 p-6 text-center text-white space-y-3 shadow-lg shadow-sky-200">
          <p className="text-lg font-bold">あなたも記録を始めませんか</p>
          <p className="text-sm opacity-85 leading-relaxed">
            ペットとの毎日の小さな瞬間が、<br />
            ずっと大切な思い出になる。
          </p>
          <a
            href="https://sora-app.jp"
            className="block w-full h-12 rounded-2xl bg-white text-sky-500 font-semibold text-sm flex items-center justify-center shadow"
          >
            Soraで記録をはじめる →
          </a>
        </div>

        <p className="text-center text-xs text-muted-foreground pb-4">
          © Sora — ペットとの毎日を残す場所
        </p>
      </main>
    </div>
  )
}
