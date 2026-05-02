import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { problem } from "@/lib/auth"

type Params = { params: Promise<{ memoryId: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  const { memoryId } = await params

  const memory = await prisma.memory.findUnique({
    where: { id: memoryId },
    include: { pet: { select: { name: true, photoUrl: true } } },
  })

  if (!memory) return problem(404, "Not Found")

  return NextResponse.json({
    id: memory.id,
    title: memory.title,
    description: memory.description,
    date: memory.date.toISOString().split("T")[0],
    petName: memory.pet.name,
    petPhotoUrl: memory.pet.photoUrl,
    photoUrl: memory.photoUrls[0] ?? null,
  })
}
