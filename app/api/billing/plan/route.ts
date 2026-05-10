import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

export type PlanFeatures = {
  unlimitedPhotos: boolean
  monthlyLetters: number
  memorialBook: boolean
  allTimeTrend: boolean
  publicProfile: boolean
  personalityVaultItems: number
  priorityAI: boolean
}

function getPlanFeatures(plan: string): PlanFeatures {
  const isPlus = plan === "PLUS"
  return {
    unlimitedPhotos: isPlus,
    monthlyLetters: isPlus ? 4 : 1,
    memorialBook: isPlus,
    allTimeTrend: isPlus,
    publicProfile: isPlus,
    personalityVaultItems: isPlus ? 5 : 3,
    priorityAI: isPlus,
  }
}

export async function GET() {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { plan: true },
  })

  const plan = dbUser?.plan ?? "FREE"
  return NextResponse.json({ plan, planFeatures: getPlanFeatures(plan) })
}
