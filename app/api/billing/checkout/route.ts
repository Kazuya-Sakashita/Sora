import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"
import { getStripe } from "@/lib/stripe-server"

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const body = await request.json().catch(() => null)
  const interval: "month" | "year" = body?.interval === "year" ? "year" : "month"

  const priceId =
    interval === "year"
      ? process.env.STRIPE_PRICE_ID_YEARLY
      : process.env.STRIPE_PRICE_ID_MONTHLY

  if (!priceId) return problem(500, "Internal Server Error", "Price ID が設定されていません")

  const stripe = getStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  // 既存の Stripe Customer を再利用 or 新規作成
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeCustomerId: true },
  })

  let customerId = dbUser?.stripeCustomerId ?? undefined
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { userId: user.id } })
    customerId = customer.id
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/settings?canceled=1`,
    metadata: { userId: user.id },
  })

  return NextResponse.json({ url: session.url })
}
