import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"
import { parseBody } from "@/lib/validate"
import { ScheduleInputSchema } from "@/lib/schemas"
import { getPetAccess } from "@/lib/pet-access"

type Params = { params: Promise<{ petId: string }> }

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
  if (!await getPetAccess(petId, user.id)) return problem(404, "Not Found")

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
  if (!await getPetAccess(petId, user.id)) return problem(404, "Not Found")

  const parsed = await parseBody(ScheduleInputSchema, request)
  if (parsed.error) return parsed.error
  const body = parsed.data

  const schedule = await prisma.schedule.create({
    data: {
      petId,
      type: body.type.toUpperCase() as never,
      title: body.title,
      date: new Date(body.date),
      memo: body.memo ?? null,
    },
  })

  return NextResponse.json(toScheduleResponse(schedule), { status: 201 })
}
