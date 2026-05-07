import { describe, it, expect, vi, beforeEach } from "vitest"
import type { NextRequest } from "next/server"

// --- モック ---
vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/stripe-server", () => ({
  getStripe: vi.fn(),
}))

import { POST } from "@/app/api/billing/webhook/route"
import { getStripe } from "@/lib/stripe-server"
import prisma from "@/lib/prisma"

const mockConstructEvent = vi.fn()

function makeRequest(body: string, sig: string | null): NextRequest {
  const headers = new Headers()
  if (sig !== null) headers.set("stripe-signature", sig)
  return new Request("http://localhost/api/billing/webhook", {
    method: "POST",
    headers,
    body,
  }) as unknown as NextRequest
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test")
  vi.mocked(getStripe).mockReturnValue({ webhooks: { constructEvent: mockConstructEvent } } as never)
  vi.mocked(prisma.user.update).mockResolvedValue({} as never)
  vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 1 } as never)
})

describe("POST /api/billing/webhook", () => {
  describe("署名検証", () => {
    it("stripe-signature ヘッダーがない場合 400 を返す", async () => {
      const res = await POST(makeRequest("{}", null))
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain("Missing")
    })

    it("STRIPE_WEBHOOK_SECRET が未設定の場合 400 を返す", async () => {
      vi.stubEnv("STRIPE_WEBHOOK_SECRET", "")
      const res = await POST(makeRequest("{}", "t=123,v1=abc"))
      expect(res.status).toBe(400)
    })

    it("署名検証失敗（constructEvent throws）で 400 を返す", async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error("No signatures found matching the expected signature")
      })

      const res = await POST(makeRequest("{}", "t=123,v1=invalid"))
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain("Invalid signature")
    })
  })

  describe("checkout.session.completed", () => {
    it("userId が metadata にあれば plan=PLUS に更新する", async () => {
      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            metadata: { userId: "user-1" },
            subscription: "sub_123",
          },
        },
      })

      const res = await POST(makeRequest("{}", "t=123,v1=valid"))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.received).toBe(true)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { plan: "PLUS", stripeSubscriptionId: "sub_123" },
      })
    })

    it("subscription が object 型の場合 stripeSubscriptionId を設定しない", async () => {
      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            metadata: { userId: "user-2" },
            subscription: { id: "sub_456" },
          },
        },
      })

      await POST(makeRequest("{}", "t=123,v1=valid"))

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-2" },
        data: { plan: "PLUS" },
      })
    })

    it("userId が metadata にない場合は DB 更新しない", async () => {
      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            metadata: {},
            subscription: null,
          },
        },
      })

      const res = await POST(makeRequest("{}", "t=123,v1=valid"))

      expect(res.status).toBe(200)
      expect(prisma.user.update).not.toHaveBeenCalled()
    })
  })

  describe("customer.subscription.deleted", () => {
    it("対応するユーザーの plan=FREE・stripeSubscriptionId=null に更新する", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.deleted",
        data: {
          object: { id: "sub_to_cancel" },
        },
      })

      const res = await POST(makeRequest("{}", "t=123,v1=valid"))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.received).toBe(true)
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: "sub_to_cancel" },
        data: { plan: "FREE", stripeSubscriptionId: null },
      })
    })
  })

  describe("customer.subscription.updated", () => {
    it("status=active のサブスクリプションは plan=PLUS に更新する", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: {
          object: { id: "sub_active", status: "active" },
        },
      })

      await POST(makeRequest("{}", "t=123,v1=valid"))

      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: "sub_active" },
        data: { plan: "PLUS" },
      })
    })

    it("status=trialing のサブスクリプションも plan=PLUS に更新する", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: {
          object: { id: "sub_trial", status: "trialing" },
        },
      })

      await POST(makeRequest("{}", "t=123,v1=valid"))

      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: "sub_trial" },
        data: { plan: "PLUS" },
      })
    })

    it("status=canceled のサブスクリプションは plan=FREE に更新する", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: {
          object: { id: "sub_canceled", status: "canceled" },
        },
      })

      await POST(makeRequest("{}", "t=123,v1=valid"))

      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: "sub_canceled" },
        data: { plan: "FREE" },
      })
    })
  })

  describe("未知のイベント", () => {
    it("未対応のイベントタイプは DB 更新せず 200 を返す", async () => {
      mockConstructEvent.mockReturnValue({
        type: "payment_intent.created",
        data: { object: {} },
      })

      const res = await POST(makeRequest("{}", "t=123,v1=valid"))

      expect(res.status).toBe(200)
      expect(prisma.user.update).not.toHaveBeenCalled()
      expect(prisma.user.updateMany).not.toHaveBeenCalled()
    })
  })
})
