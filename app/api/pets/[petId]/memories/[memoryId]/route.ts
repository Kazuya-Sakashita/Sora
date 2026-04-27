import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"

type Params = { params: Promise<{ petId: string; memoryId: string }> }

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
