import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { problem } from "@/lib/auth"

type Params = { params: Promise<{ petId: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { petId } = await params

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

  if (!pet || !pet.publicProfile) return problem(404, "Not Found")

  const broughtAtStr = pet.broughtAt ? pet.broughtAt.toISOString().split("T")[0] : null
  const daysCount = broughtAtStr
    ? Math.floor((Date.now() - new Date(broughtAtStr).getTime()) / 86_400_000)
    : null

  return NextResponse.json({
    id: pet.id,
    name: pet.name,
    nickname: pet.nickname,
    species: pet.species?.toLowerCase() ?? null,
    photoUrl: pet.photoUrl,
    broughtAt: broughtAtStr,
    daysCount,
    status: pet.status.toLowerCase(),
    memoryCount: pet._count.memories,
    recentMemories: pet.memories.map((m) => ({
      id: m.id,
      title: m.title,
      date: m.date.toISOString().split("T")[0],
      coverPhotoUrl: m.photoUrls[0] ?? null,
    })),
  })
}
