"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Bookmark, RefreshCw } from "lucide-react"

const letters = [
  `いつもそばにいてくれてありがとう。
あなたと過ごした時間は、ずっと大切なままです。`,
  `あなたがくれたあたたかさは、
今もわたしの心の中にあります。`,
  `一緒に見た景色、一緒に過ごした時間。
それはずっと、消えない宝物。`,
  `会いたいと思う気持ち、
それはあなたを大切に想っている証拠です。`,
  `あなたがいてくれた日々は、
何にも代えがたい贈り物でした。`,
]

export function LetterScreen() {
  const { setCurrentScreen, pet } = useApp()
  const [currentLetter, setCurrentLetter] = useState<string | null>(null)
  const [savedLetters, setSavedLetters] = useState<string[]>([])
  const [isAnimating, setIsAnimating] = useState(false)

  const generateLetter = () => {
    setIsAnimating(true)
    setTimeout(() => {
      const randomLetter = letters[Math.floor(Math.random() * letters.length)]
      setCurrentLetter(randomLetter)
      setIsAnimating(false)
    }, 800)
  }

  const saveLetter = () => {
    if (currentLetter && !savedLetters.includes(currentLetter)) {
      setSavedLetters(prev => [...prev, currentLetter])
    }
  }

  return (
    <div className="min-h-screen pb-safe">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/30 backdrop-blur-xl border-b border-white/40">
        <div className="px-4 pt-safe">
          <div className="h-14 flex items-center gap-4">
            <button 
              onClick={() => setCurrentScreen("home")}
              className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center text-muted-foreground"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="flex-1 font-medium text-foreground/90">ことば</h1>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 space-y-8">
        {/* Intro */}
        <div className="text-center">
          <p className="text-muted-foreground text-sm leading-relaxed">
            思い出から、やさしい言葉を届けます
          </p>
        </div>

        {/* Letter Display */}
        {currentLetter ? (
          <GlassCard className="relative overflow-hidden">
            {/* Decorative top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            
            <div className={`py-8 px-4 transition-opacity duration-500 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
              {pet && (
                <p className="text-sm text-primary/60 mb-6 text-center">
                  {pet.name}より
                </p>
              )}
              <p className="text-center text-foreground/80 leading-loose whitespace-pre-line text-base">
                {currentLetter}
              </p>
            </div>

            {/* Decorative bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
          </GlassCard>
        ) : (
          <GlassCard className="py-16">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <span className="text-2xl">✉️</span>
              </div>
              <p className="text-muted-foreground text-sm">
                ボタンを押すと<br />やさしい言葉が届きます
              </p>
            </div>
          </GlassCard>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {currentLetter ? (
            <>
              <div className="flex gap-3">
                <Button
                  onClick={saveLetter}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border-white/60 bg-white/50 hover:bg-white/70"
                >
                  <Bookmark size={18} className="mr-2" />
                  保存する
                </Button>
                <Button
                  onClick={generateLetter}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border-white/60 bg-white/50 hover:bg-white/70"
                >
                  <RefreshCw size={18} className="mr-2" />
                  もう一度読む
                </Button>
              </div>
            </>
          ) : (
            <Button
              onClick={generateLetter}
              className="w-full h-14 rounded-2xl bg-primary/80 hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/10"
            >
              手紙を受け取る
            </Button>
          )}
        </div>

        {/* Saved Letters */}
        {savedLetters.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground/70">保存した手紙</h3>
            {savedLetters.map((letter, index) => (
              <GlassCard key={index} className="py-4">
                <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-line">
                  {letter}
                </p>
              </GlassCard>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
