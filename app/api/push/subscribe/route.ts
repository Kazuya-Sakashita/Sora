import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"
import { applyRateLimit } from "@/lib/ratelimit"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const body = await request.json().catch(() => null)
  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
    return problem(400, "Bad Request", "endpoint と keys が必須です")
  }

  const subscription = await prisma.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    update: { p256dh: body.keys.p256dh, auth: body.keys.auth },
    create: {
      userId: user.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
    },
  })

  return NextResponse.json({ id: subscription.id }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const body = await request.json().catch(() => null)
  if (!body?.endpoint) return problem(400, "Bad Request", "endpoint が必須です")

  await prisma.pushSubscription.deleteMany({
    where: { endpoint: body.endpoint, userId: user.id },
  })

  return new NextResponse(null, { status: 204 })
}
