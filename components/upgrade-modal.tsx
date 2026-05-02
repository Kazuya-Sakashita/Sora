"use client"

import { useState } from "react"
import { Sparkles, Loader2, X } from "lucide-react"

type Props = {
  onClose: () => void
}

const BENEFITS = [
  "記録・写真が無制限",
  "年次メモリーレポート自動生成",
  "月別フォトブックPDF出力",
  "マイルストーン記念カード保存",
]

export function UpgradeModal({ onClose }: Props) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async (interval: "month" | "year") => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm rounded-3xl bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
              <Sparkles size={18} className="text-amber-500" />
            </div>
            <div>
              <h2 className="font-bold text-foreground/90 text-base">Sora+</h2>
              <p className="text-xs text-muted-foreground">大切な記録を、ずっと残せる</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-muted-foreground hover:bg-black/10 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Benefits */}
        <ul className="space-y-2">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm text-foreground/75">
              <span className="text-amber-400 text-base leading-none">✦</span>
              {b}
            </li>
          ))}
        </ul>

        {/* Free limit notice */}
        <p className="text-xs text-center text-muted-foreground bg-muted/30 rounded-xl py-2 px-3">
          無料プランの記録上限（50件）に達しました
        </p>

        {/* CTA */}
        <div className="space-y-2">
          <button
            onClick={() => handleCheckout("month")}
            disabled={isLoading}
            className="w-full h-12 rounded-2xl bg-amber-400/90 hover:bg-amber-400 text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : "月額 ¥480 で始める"}
          </button>
          <button
            onClick={() => handleCheckout("year")}
            disabled={isLoading}
            className="w-full h-11 rounded-2xl bg-amber-500/90 hover:bg-amber-500 text-white font-semibold text-sm transition-colors disabled:opacity-60 flex flex-col items-center justify-center leading-tight"
          >
            <span>年額 ¥4,300 で始める</span>
            <span className="text-[10px] opacity-80">月額換算 ¥358 · 約25%お得</span>
          </button>
        </div>
      </div>
    </div>
  )
}
