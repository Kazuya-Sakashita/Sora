import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"
import { validateLength } from "@/lib/validate"

type Params = { params: Promise<{ petId: string }> }

async function verifyPetOwner(petId: string, userId: string) {
  return prisma.pet.findFirst({ where: { id: petId, userId } })
}

function toFeelingResponse(f: {
  id: string
  tag: string
  memo: string | null
  date: Date
  createdAt: Date
}) {
  return {
    id: f.id,
    tag: f.tag.toLowerCase(),
    memo: f.memo,
    date: f.date.toISOString().split("T")[0],
    createdAt: f.createdAt.toISOString(),
  }
}

export async function GET(request: Request, { params }: Params) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const { petId } = await params
  const pet = await verifyPetOwner(petId, user.id)
  if (!pet) return problem(404, "Not Found")

  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "30"), 100)

  const [items, total] = await Promise.all([
    prisma.feeling.findMany({
      where: { petId },
      orderBy: { date: "desc" },
      take: limit,
    }),
    prisma.feeling.count({ where: { petId } }),
  ])

  return NextResponse.json({ items: items.map(toFeelingResponse), total })
}

export async function POST(request: Request, { params }: Params) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const { petId } = await params
  const pet = await verifyPetOwner(petId, user.id)
  if (!pet) return problem(404, "Not Found")

  const body = await request.json().catch(() => null)
  if (!body || !body.tag || !body.date) {
    return problem(400, "Bad Request", "tag と date は必須です")
  }

  const validationError = validateLength(body.memo, "memo", 500)
  if (validationError) {
    return problem(400, "Bad Request", validationError.message)
  }

  const feeling = await prisma.feeling.create({
    data: {
      petId,
      tag: body.tag.toUpperCase(),
      memo: body.memo ?? null,
      date: new Date(body.date),
    },
  })

  return NextResponse.json(toFeelingResponse(feeling), { status: 201 })
}
