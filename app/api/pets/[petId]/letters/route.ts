import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"
import { getPetAccess } from "@/lib/pet-access"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ petId: string }> }
) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const { petId } = await params
  const access = await getPetAccess(petId, user.id)
  if (!access) return problem(404, "Not Found")

  const letters = await prisma.monthlyLetter.findMany({
    where: { petId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: { id: true, year: true, month: true, generatedAt: true },
  })

  return NextResponse.json({ letters })
}
