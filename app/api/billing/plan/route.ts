import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

export async function GET() {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { plan: true },
  })

  return NextResponse.json({ plan: dbUser?.plan ?? "FREE" })
}
