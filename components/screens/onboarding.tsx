"use client"

import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"

export function OnboardingScreen() {
  const { setCurrentScreen } = useApp()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center">
      {/* Soft rainbow arc */}
      <div className="absolute top-0 left-0 right-0 h-[200px] overflow-hidden opacity-40">
        <svg viewBox="0 0 400 200" className="w-full h-full" preserveAspectRatio="xMidYMin slice">
          <defs>
            <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffd6e0" stopOpacity="0.5" />
              <stop offset="25%" stopColor="#ffe4c9" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#fff5cc" stopOpacity="0.3" />
              <stop offset="75%" stopColor="#d4f0d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#d4e5f7" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <path
            d="M-50,200 Q200,-50 450,200"
            fill="none"
            stroke="url(#rainbow)"
            strokeWidth="60"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="relative z-10 max-w-sm mx-auto">
        {/* Brand image */}
        <div className="mb-10">
          <img
            src="/sora-brand-sunrise.png"
            alt="Sora"
            className="w-40 h-40 mx-auto object-contain drop-shadow-md"
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-medium text-foreground/90 mb-4 tracking-wide">
          そばにいるよ、いつでも。
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground text-base leading-relaxed mb-16">
          大切な思い出と、<br />ゆっくり向き合うための場所です
        </p>

        {/* CTA Buttons */}
        <div className="space-y-4">
          <Button
            onClick={() => setCurrentScreen("profile-create")}
            className="w-full h-14 rounded-2xl bg-primary/80 hover:bg-primary/90 text-primary-foreground font-medium text-base shadow-lg shadow-primary/10 transition-all"
          >
            はじめる
          </Button>
          
          <button
            onClick={() => setCurrentScreen("home")}
            className="w-full h-12 text-muted-foreground/70 text-sm hover:text-muted-foreground transition-colors"
          >
            あとで
          </button>
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/30 to-transparent" />
    </div>
  )
}
