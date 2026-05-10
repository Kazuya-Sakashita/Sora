"use client"

import { useState } from "react"
import { Sparkles, Loader2, X, Check } from "lucide-react"

type Props = {
  onClose: () => void
  featureName?: string
  isRainbowBridge?: boolean
}

const FREE_LIMITS = [
  { label: "写真", free: "1ペット50枚", plus: "無制限" },
  { label: "AIの手紙", free: "月1通", plus: "月4通" },
  { label: "感情トレンド", free: "直近3ヶ月", plus: "全期間" },
  { label: "メモリアルブック", free: "プレビューのみ", plus: "生成・ダウンロード" },
  { label: "あの子らしさ記録", free: "3項目まで", plus: "5項目すべて" },
  { label: "公開プロフィール", free: "なし", plus: "あり" },
]

export function UpgradeModal({ onClose, featureName, isRainbowBridge }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month")

  const handleCheckout = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval: billingInterval }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setIsLoading(false)
    }
  }

  const monthlyPrice = process.env.NEXT_PUBLIC_PRICE_MONTHLY ?? "480"
  const yearlyPrice = process.env.NEXT_PUBLIC_PRICE_YEARLY

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-white/97 backdrop-blur-xl border border-white/60 shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
              <Sparkles size={18} className="text-amber-500" />
            </div>
            <div>
              <h2 className="font-bold text-foreground/90 text-base leading-tight">Sora+</h2>
              <p className="text-xs text-muted-foreground leading-tight">
                {featureName
                  ? `${featureName}は Sora+ 機能です`
                  : "大切な記録を、完全に残すために"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-muted-foreground hover:bg-black/10 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Rainbow Bridge special message */}
        {isRainbowBridge && (
          <div className="mx-6 mb-3 px-4 py-3 rounded-2xl bg-primary/5 border border-primary/10">
            <p className="text-xs text-primary/70 leading-relaxed">
              虹の橋を渡ったばかりの方には、最初の1ヶ月を無料でお試しいただけます。
              記録を続けることが、あの子への一番の供養になりますように。
            </p>
          </div>
        )}

        {/* Feature comparison table */}
        <div className="px-6 pb-2">
          <div className="rounded-2xl overflow-hidden border border-black/5">
            <div className="grid grid-cols-3 bg-black/3 px-3 py-2">
              <span className="text-xs text-muted-foreground font-medium">機能</span>
              <span className="text-xs text-muted-foreground font-medium text-center">無料</span>
              <span className="text-xs text-amber-600 font-semibold text-center">Sora+</span>
            </div>
            {FREE_LIMITS.map(({ label, free, plus }, i) => (
              <div
                key={label}
                className={`grid grid-cols-3 px-3 py-2 items-center ${i % 2 === 0 ? "bg-white" : "bg-black/1"}`}
              >
                <span className="text-xs text-foreground/70 font-medium">{label}</span>
                <span className="text-xs text-muted-foreground text-center">{free}</span>
                <div className="flex items-center justify-center gap-1">
                  <Check size={11} className="text-amber-500 shrink-0" />
                  <span className="text-xs text-amber-700 font-medium">{plus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interval toggle */}
        {yearlyPrice && (
          <div className="px-6 pt-3">
            <div className="flex rounded-2xl bg-black/5 p-1">
              <button
                onClick={() => setBillingInterval("month")}
                className={`flex-1 h-9 rounded-xl text-sm font-medium transition-colors ${
                  billingInterval === "month"
                    ? "bg-white text-foreground/85 shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                月払い
              </button>
              <button
                onClick={() => setBillingInterval("year")}
                className={`flex-1 h-9 rounded-xl text-sm font-medium transition-colors relative ${
                  billingInterval === "year"
                    ? "bg-white text-foreground/85 shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                年払い
                <span className="ml-1 text-[10px] text-amber-500 font-bold">お得</span>
              </button>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="px-6 pt-3 pb-6 space-y-2">
          <button
            onClick={handleCheckout}
            disabled={isLoading}
            className="w-full h-12 rounded-2xl bg-amber-400/90 hover:bg-amber-400 text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : billingInterval === "year" && yearlyPrice ? (
              `年額 ¥${yearlyPrice} で始める（月換算 ¥${Math.round(Number(yearlyPrice) / 12)}）`
            ) : (
              `月額 ¥${monthlyPrice} で始める`
            )}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            いつでもキャンセルできます
          </p>
        </div>
      </div>
    </div>
  )
}
