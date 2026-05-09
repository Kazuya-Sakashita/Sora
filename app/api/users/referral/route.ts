import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

// GET — 自分のreferralCodeを取得（なければ生成）
export async function GET() {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  let dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { referralCode: true },
  })
  if (!dbUser) return problem(404, "User not found")

  if (!dbUser.referralCode) {
    // 衝突回避のため最大3回リトライ
    let code: string | null = null
    for (let i = 0; i < 3; i++) {
      const candidate = generateCode()
      const existing = await prisma.user.findUnique({ where: { referralCode: candidate } })
      if (!existing) { code = candidate; break }
    }
    if (!code) return problem(500, "Failed to generate referral code")

    dbUser = await prisma.user.update({
      where: { id: user.id },
      data: { referralCode: code },
      select: { referralCode: true },
    })
  }

  // 招待した人数を集計
  const invitedCount = await prisma.user.count({ where: { referredBy: user.id } })

  return NextResponse.json({
    referralCode: dbUser.referralCode,
    invitedCount,
  })
}

// POST — 招待経由登録時にreferredByを記録
export async function POST(request: Request) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const body = await request.json().catch(() => ({}))
  const { referralCode } = body as { referralCode?: string }
  if (!referralCode) return problem(400, "referralCode is required")

  const referrer = await prisma.user.findUnique({ where: { referralCode } })
  if (!referrer) return problem(404, "Invalid referral code")
  if (referrer.id === user.id) return problem(400, "Cannot use own referral code")

  // 既に referredBy が設定されている場合はスキップ
  const current = await prisma.user.findUnique({ where: { id: user.id }, select: { referredBy: true } })
  if (current?.referredBy) return NextResponse.json({ ok: true })

  await prisma.user.update({
    where: { id: user.id },
    data: { referredBy: referrer.id },
  })

  return NextResponse.json({ ok: true })
}
