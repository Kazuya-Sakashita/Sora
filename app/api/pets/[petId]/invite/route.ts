import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"

type Params = { params: Promise<{ petId: string }> }

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://app.sora.jp"
}

export async function POST(_request: Request, { params }: Params) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const { petId } = await params
  const pet = await prisma.pet.findFirst({ where: { id: petId, userId: user.id } })
  if (!pet) return problem(404, "Not Found")

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  // Upsert invite — one active token per pet
  await prisma.petInvite.deleteMany({ where: { petId } })
  const invite = await prisma.petInvite.create({
    data: { petId, expiresAt },
  })

  const inviteUrl = `${getAppUrl()}/invite?token=${invite.token}`
  return NextResponse.json({ url: inviteUrl, expiresAt: expiresAt.toISOString() })
}
