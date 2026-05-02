import { NextResponse } from "next/server"

export type Plan = "FREE" | "PLUS"

export function requirePlus(plan: Plan): NextResponse | null {
  if (plan !== "PLUS") {
    return NextResponse.json(
      { type: "https://sora.app/errors/payment-required", title: "Payment Required", status: 402, detail: "Sora+ が必要です" },
      { status: 402 }
    )
  }
  return null
}
