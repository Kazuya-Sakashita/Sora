import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"

export async function POST(request: Request) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const body = await request.json().catch(() => null)
  if (!body?.token) return problem(400, "Bad Request", "token は必須です")

  const invite = await prisma.petInvite.findUnique({ where: { token: body.token } })
  if (!invite) return problem(404, "Not Found", "招待リンクが見つかりません")
  if (invite.expiresAt < new Date()) return problem(410, "Gone", "招待リンクの有効期限が切れています")

  // OWNER は参加不要
  const pet = await prisma.pet.findFirst({ where: { id: invite.petId, userId: user.id } })
  if (pet) return NextResponse.json({ petId: invite.petId, alreadyOwner: true })

  // 既存メンバーはスキップ
  const existing = await prisma.petMember.findFirst({ where: { petId: invite.petId, userId: user.id } })
  if (existing) return NextResponse.json({ petId: invite.petId, alreadyMember: true })

  await prisma.petMember.create({
    data: { petId: invite.petId, userId: user.id, role: "MEMBER" },
  })

  return NextResponse.json({ petId: invite.petId }, { status: 201 })
}
