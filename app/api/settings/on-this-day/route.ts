import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"

export async function GET(_req: NextRequest) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { onThisDayEnabled: true },
  })

  return NextResponse.json({ enabled: dbUser?.onThisDayEnabled ?? true })
}

export async function PATCH(req: NextRequest) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const body = await req.json().catch(() => null)
  if (typeof body?.enabled !== "boolean") {
    return problem(400, "Bad Request", "enabled は boolean 必須")
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { onThisDayEnabled: body.enabled },
  })

  return NextResponse.json({ enabled: body.enabled })
}
