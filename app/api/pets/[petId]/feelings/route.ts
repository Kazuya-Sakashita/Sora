import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"
import { parseBody } from "@/lib/validate"
import { FeelingInputSchema } from "@/lib/schemas"
import { getPetAccess } from "@/lib/pet-access"

type Params = { params: Promise<{ petId: string }> }

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
  if (!await getPetAccess(petId, user.id)) return problem(404, "Not Found")

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
  if (!await getPetAccess(petId, user.id)) return problem(404, "Not Found")

  const parsed = await parseBody(FeelingInputSchema, request)
  if (parsed.error) return parsed.error
  const body = parsed.data

  const feeling = await prisma.feeling.create({
    data: {
      petId,
      tag: body.tag.toUpperCase() as never,
      memo: body.memo ?? null,
      date: new Date(body.date),
    },
  })

  return NextResponse.json(toFeelingResponse(feeling), { status: 201 })
}
