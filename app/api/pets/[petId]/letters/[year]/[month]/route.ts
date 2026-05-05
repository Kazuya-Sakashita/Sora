import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"
import { getPetAccess } from "@/lib/pet-access"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ petId: string; year: string; month: string }> }
) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const { petId, year, month } = await params
  const yearNum = parseInt(year, 10)
  const monthNum = parseInt(month, 10)

  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return problem(400, "Invalid year or month")
  }

  const access = await getPetAccess(petId, user.id)
  if (!access) return problem(404, "Not Found")

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { plan: true } })
  if (!dbUser || dbUser.plan !== "PLUS") return problem(403, "Sora+ required")

  const letter = await prisma.monthlyLetter.findUnique({
    where: { petId_year_month: { petId, year: yearNum, month: monthNum } },
  })
  if (!letter) return problem(404, "Not Found")

  return NextResponse.json({ letter })
}
