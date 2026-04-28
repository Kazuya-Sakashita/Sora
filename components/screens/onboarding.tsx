"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"

const slides = [
  {
    emoji: "🐾",
    title: "ペットとの毎日を、\nずっと残せる場所。",
    description: "写真も、言葉も、気持ちも。\n今日から記録をはじめましょう。",
  },
  {
    emoji: "📖",
    title: "続けるほど、\n大切な物語になる。",
    description: "積み重ねた記録が、\nかけがえのないアルバムになります。",
  },
  {
    emoji: "🌿",
    title: "いつかのあなたを、\n今日の記録が支える。",
    description: "一緒にいる今を残すことが、\n未来の自分への贈り物になります。",
  },
]

export function OnboardingScreen() {
  const { setCurrentScreen } = useApp()
  const [current, setCurrent] = useState(0)
  const isLast = current === slides.length - 1

  const handleNext = () => {
    if (isLast) {
      setCurrentScreen("profile-create")
    } else {
      setCurrent((prev) => prev + 1)
    }
  }

  const slide = slides[current]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center">
      {/* Arc decoration — new palette */}
      <div className="absolute top-0 left-0 right-0 h-[200px] overflow-hidden opacity-35 pointer-events-none">
        <svg viewBox="0 0 400 200" className="w-full h-full" preserveAspectRatio="xMidYMin slice">
          <defs>
            <linearGradient id="arc" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#E8F4FF" stopOpacity="0.8" />
              <stop offset="40%"  stopColor="#D8E4F0" stopOpacity="0.6" />
              <stop offset="70%"  stopColor="#EDD9B5" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#F0E6D8" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <path
            d="M-50,200 Q200,-50 450,200"
            fill="none"
            stroke="url(#arc)"
            strokeWidth="70"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="relative z-10 max-w-sm mx-auto w-full">
        {/* Brand image */}
        <div className="mb-10">
          <img
            src="/sora-brand-sunrise.png"
            alt="Sora"
            className="w-36 h-36 mx-auto object-contain drop-shadow-md"
          />
        </div>

        {/* Slide content */}
        <div className="min-h-[160px] flex flex-col items-center justify-center mb-10">
          <div className="text-5xl mb-6">{slide.emoji}</div>
          <h1 className="text-xl font-medium text-foreground/90 mb-4 leading-snug whitespace-pre-line">
            {slide.title}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {slide.description}
          </p>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 h-2 bg-foreground/40"
                  : "w-2 h-2 bg-foreground/15"
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Button
            onClick={handleNext}
            className="w-full h-14 rounded-2xl text-foreground/80 font-medium text-base shadow-md transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #F0E6D8, #EDD9B5)" }}
          >
            {isLast ? "はじめる" : "次へ"}
          </Button>

          <button
            onClick={() => setCurrentScreen("profile-create")}
            className="w-full h-10 text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            スキップ
          </button>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
    </div>
  )
}
