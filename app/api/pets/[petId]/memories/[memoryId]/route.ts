import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"
import { parseBody } from "@/lib/validate"
import { MemoryPatchSchema } from "@/lib/schemas"

type Params = { params: Promise<{ petId: string; memoryId: string }> }

function toMemoryResponse(m: {
  id: string
  title: string
  description: string | null
  date: Date
  category: string
  moodTag: string | null
  photoUrls: string[]
  createdAt: Date
}) {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    date: m.date.toISOString().split("T")[0],
    category: m.category.toLowerCase(),
    moodTag: m.moodTag?.toLowerCase() ?? null,
    photoUrls: m.photoUrls,
    createdAt: m.createdAt.toISOString(),
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const { petId, memoryId } = await params

  const memory = await prisma.memory.findFirst({
    where: { id: memoryId, petId, pet: { userId: user.id } },
  })
  if (!memory) return problem(404, "Not Found")

  const parsed = await parseBody(MemoryPatchSchema, request)
  if (parsed.error) return parsed.error

  const { title, description, date, moodTag } = parsed.data

  const updated = await prisma.memory.update({
    where: { id: memoryId },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description: description ?? null } : {}),
      ...(date !== undefined ? { date: new Date(date) } : {}),
      ...(moodTag !== undefined ? { moodTag: moodTag !== null ? (moodTag.toUpperCase() as never) : null } : {}),
    },
  })

  return NextResponse.json(toMemoryResponse(updated))
}

export async function DELETE(_request: Request, { params }: Params) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const { petId, memoryId } = await params

  const memory = await prisma.memory.findFirst({
    where: { id: memoryId, petId, pet: { userId: user.id } },
  })
  if (!memory) return problem(404, "Not Found")

  await prisma.memory.delete({ where: { id: memoryId } })
  return new NextResponse(null, { status: 204 })
}
