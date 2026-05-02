import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"

type Params = { params: Promise<{ petId: string; memberId: string }> }

export async function DELETE(_request: Request, { params }: Params) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const { petId, memberId } = await params
  const pet = await prisma.pet.findFirst({ where: { id: petId, userId: user.id } })
  if (!pet) return problem(404, "Not Found")

  const member = await prisma.petMember.findFirst({ where: { id: memberId, petId } })
  if (!member) return problem(404, "Not Found")

  await prisma.petMember.delete({ where: { id: memberId } })
  return new NextResponse(null, { status: 204 })
}
