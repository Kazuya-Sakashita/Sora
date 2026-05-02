import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getStripe } from "@/lib/stripe-server"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 })
  }

  const stripe = getStripe()
  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object
      const userId = session.metadata?.userId
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : null
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { plan: "PLUS", ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}) },
        })
      }
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object
      await prisma.user.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { plan: "FREE", stripeSubscriptionId: null },
      })
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object
      const isActive = ["active", "trialing"].includes(subscription.status)
      await prisma.user.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { plan: isActive ? "PLUS" : "FREE" },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
