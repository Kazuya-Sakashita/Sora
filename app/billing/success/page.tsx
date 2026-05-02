"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, FileText, Download, Infinity } from "lucide-react"

const slides = [
  {
    emoji: "✨",
    title: "Sora+ へようこそ",
    body: "すべての機能が解放されました。\nペットとの日々を、もっと豊かに残しましょう。",
    cta: null,
  },
  {
    emoji: null,
    title: "使えるようになった機能",
    body: null,
    features: [
      { icon: BookOpen, label: "月別フォトブック", desc: "毎月の思い出をPDFに" },
      { icon: FileText, label: "年次メモリーレポート", desc: "1年間の記録を自動まとめ" },
      { icon: Download, label: "記念日カード保存", desc: "100日・誕生日を画像に" },
      { icon: Infinity, label: "無制限記録", desc: "50件の制限なし" },
    ],
    cta: null,
  },
  {
    emoji: "📷",
    title: "最初のフォトブックを\n作りましょう",
    body: "タイムラインから今月の写真を確認できます。",
    cta: "はじめる",
  },
]

export default function BillingSuccessPage() {
  const router = useRouter()
  const [slide, setSlide] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetch("/api/billing/plan")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.plan === "PLUS") {
          setReady(true)
        } else {
          router.replace("/")
        }
      })
      .catch(() => router.replace("/"))
  }, [router])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    )
  }

  const current = slides[slide]
  const isLast = slide === slides.length - 1

  function advance() {
    if (isLast) {
      router.replace("/")
    } else {
      setSlide((s) => s + 1)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-linear-to-br from-amber-50 via-white to-orange-50">
      <button
        onClick={() => router.replace("/")}
        className="absolute top-safe right-6 mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        スキップ
      </button>

      <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in-95 duration-300" key={slide}>
        {current.emoji && (
          <p className="text-center text-6xl">{current.emoji}</p>
        )}

        <div className="space-y-3 text-center">
          <h1 className="text-xl font-bold text-foreground/90 whitespace-pre-line leading-snug">
            {current.title}
          </h1>
          {current.body && (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {current.body}
            </p>
          )}
        </div>

        {current.features && (
          <div className="space-y-3">
            {current.features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 px-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/85">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={advance}
            className="w-full h-12 rounded-2xl bg-primary/80 hover:bg-primary/90 text-primary-foreground font-medium text-sm transition-colors"
          >
            {isLast ? (current.cta ?? "はじめる") : "次へ"}
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`block rounded-full transition-all duration-200 ${
                  i === slide ? "w-4 h-1.5 bg-primary/60" : "w-1.5 h-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
