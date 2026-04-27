import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"

type Params = { params: Promise<{ petId: string; scheduleId: string }> }

export async function DELETE(_request: Request, { params }: Params) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const { petId, scheduleId } = await params

  const schedule = await prisma.schedule.findFirst({
    where: { id: scheduleId, petId, pet: { userId: user.id } },
  })
  if (!schedule) return problem(404, "Not Found")

  await prisma.schedule.delete({ where: { id: scheduleId } })
  return new NextResponse(null, { status: 204 })
}
