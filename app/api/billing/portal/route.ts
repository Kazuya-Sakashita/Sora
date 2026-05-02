import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"
import { getStripe } from "@/lib/stripe-server"

export async function POST() {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeCustomerId: true },
  })

  if (!dbUser?.stripeCustomerId) return problem(400, "Bad Request", "Stripe Customer が存在しません")

  const stripe = getStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  const session = await stripe.billingPortal.sessions.create({
    customer: dbUser.stripeCustomerId,
    return_url: `${appUrl}/settings`,
  })

  return NextResponse.json({ url: session.url })
}
