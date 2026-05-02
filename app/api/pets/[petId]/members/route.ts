import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"

type Params = { params: Promise<{ petId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const { petId } = await params
  const pet = await prisma.pet.findFirst({ where: { id: petId, userId: user.id } })
  if (!pet) return problem(404, "Not Found")

  const members = await prisma.petMember.findMany({
    where: { petId },
    include: { user: { select: { id: true, email: true } } },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({
    items: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email,
      role: m.role.toLowerCase(),
      joinedAt: m.createdAt.toISOString(),
    })),
  })
}
