import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"

type Params = { params: Promise<{ petId: string }> }

async function verifyPetOwner(petId: string, userId: string) {
  return prisma.pet.findFirst({ where: { id: petId, userId } })
}

function toScheduleResponse(s: {
  id: string
  type: string
  title: string
  date: Date
  memo: string | null
  createdAt: Date
}) {
  return {
    id: s.id,
    type: s.type.toLowerCase(),
    title: s.title,
    date: s.date.toISOString().split("T")[0],
    memo: s.memo,
    createdAt: s.createdAt.toISOString(),
  }
}

export async function GET(request: Request, { params }: Params) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const { petId } = await params
  const pet = await verifyPetOwner(petId, user.id)
  if (!pet) return problem(404, "Not Found")

  const url = new URL(request.url)
  const from = url.searchParams.get("from")
  const to = url.searchParams.get("to")

  const where = {
    petId,
    ...(from || to
      ? {
          date: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.schedule.findMany({
      where,
      orderBy: { date: "asc" },
    }),
    prisma.schedule.count({ where }),
  ])

  return NextResponse.json({ items: items.map(toScheduleResponse), total })
}

export async function POST(request: Request, { params }: Params) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const { petId } = await params
  const pet = await verifyPetOwner(petId, user.id)
  if (!pet) return problem(404, "Not Found")

  const body = await request.json().catch(() => null)
  if (!body || !body.type || !body.title || !body.date) {
    return problem(400, "Bad Request", "type, title, date は必須です")
  }

  const schedule = await prisma.schedule.create({
    data: {
      petId,
      type: body.type.toUpperCase(),
      title: body.title,
      date: new Date(body.date),
      memo: body.memo ?? null,
    },
  })

  return NextResponse.json(toScheduleResponse(schedule), { status: 201 })
}
