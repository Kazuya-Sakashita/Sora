"use client"

import { useState } from "react"
import { X } from "lucide-react"

const OPTIONS = [
  { value: "very_disappointed", label: "とても残念" },
  { value: "somewhat_disappointed", label: "少し残念" },
  { value: "not_disappointed", label: "特に困らない" },
] as const

type Answer = (typeof OPTIONS)[number]["value"]

interface Props {
  onClose: () => void
}

export function PmfSurveyModal({ onClose }: Props) {
  const [selected, setSelected] = useState<Answer | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!selected) return
    localStorage.setItem("sora:pmf-answer", selected)
    localStorage.setItem("sora:pmf-answered-at", new Date().toISOString())
    setSubmitted(true)
    setTimeout(onClose, 2200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-2 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-white/96 backdrop-blur-xl border border-white/70 shadow-2xl p-6 space-y-5 animate-in slide-in-from-bottom-4 duration-300">

        {submitted ? (
          <div className="py-4 text-center space-y-2">
            <p className="text-2xl">🙏</p>
            <p className="text-sm font-medium text-foreground/80">教えてくれてありがとうございます</p>
            <p className="text-xs text-muted-foreground">フィードバックはSoraをより良くするために使います</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground/85 leading-snug">
                  Soraが使えなくなったら、どう感じますか？
                </p>
                <p className="text-xs text-muted-foreground">1分で答えられます</p>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center text-muted-foreground shrink-0"
                aria-label="閉じる"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelected(opt.value)}
                  className={`w-full h-12 rounded-2xl text-sm font-medium border transition-all text-left px-4 ${
                    selected === opt.value
                      ? "bg-primary/10 border-primary/30 text-foreground/85"
                      : "bg-white/60 border-white/50 text-foreground/70 hover:bg-white/80"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!selected}
              className="w-full h-11 rounded-2xl bg-primary/90 text-primary-foreground text-sm font-medium disabled:opacity-40 transition-opacity"
            >
              送信する
            </button>
          </>
        )}
      </div>
    </div>
  )
}
