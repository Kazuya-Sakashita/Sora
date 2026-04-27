import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"

type Params = { params: Promise<{ petId: string }> }

async function verifyPetOwner(petId: string, userId: string) {
  return prisma.pet.findFirst({ where: { id: petId, userId } })
}

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

export async function GET(request: Request, { params }: Params) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const { petId } = await params
  const pet = await verifyPetOwner(petId, user.id)
  if (!pet) return problem(404, "Not Found")

  const url = new URL(request.url)
  const category = url.searchParams.get("category")
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 100)
  const offset = parseInt(url.searchParams.get("offset") ?? "0")

  const where = {
    petId,
    ...(category ? { category: category.toUpperCase() as never } : {}),
  }

  const [items, total] = await Promise.all([
    prisma.memory.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.memory.count({ where }),
  ])

  return NextResponse.json({ items: items.map(toMemoryResponse), total })
}

export async function POST(request: Request, { params }: Params) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const { petId } = await params
  const pet = await verifyPetOwner(petId, user.id)
  if (!pet) return problem(404, "Not Found")

  const body = await request.json().catch(() => null)
  if (!body || !body.title || !body.date) {
    return problem(400, "Bad Request", "title と date は必須です")
  }

  const memory = await prisma.memory.create({
    data: {
      petId,
      title: body.title,
      description: body.description ?? null,
      date: new Date(body.date),
      category: body.category?.toUpperCase() ?? "OTHER",
      moodTag: body.moodTag?.toUpperCase() ?? null,
      photoUrls: body.photoUrls ?? [],
    },
  })

  return NextResponse.json(toMemoryResponse(memory), { status: 201 })
}
