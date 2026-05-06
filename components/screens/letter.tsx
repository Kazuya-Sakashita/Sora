"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/lib/app-context"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Bookmark, RefreshCw, Loader2, Trash2 } from "lucide-react"

export function LetterScreen() {
  const { setCurrentScreen, pet } = useApp()
  const [currentLetter, setCurrentLetter] = useState<string | null>(null)
  const [savedLetters, setSavedLetters] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pet) return
    try {
      const saved = localStorage.getItem(`sora:letters-${pet.id}`)
      if (saved) setSavedLetters(JSON.parse(saved))
    } catch { /* ignore corrupt data */ }
  }, [pet?.id])

  const persistLetters = (letters: string[]) => {
    if (!pet) return
    try {
      localStorage.setItem(`sora:letters-${pet.id}`, JSON.stringify(letters.slice(-20)))
    } catch { /* ignore storage full */ }
  }

  const generateLetter = async () => {
    if (!pet || isLoading) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/pets/${pet.id}/letter/generate`, { method: "POST" })
      if (res.status === 429) {
        setError("少し待ってから、もう一度試してみてください")
        return
      }
      if (!res.ok) {
        setError("手紙の生成に失敗しました。もう一度試してみてください")
        return
      }
      const data = await res.json()
      setCurrentLetter(data.content)
    } catch {
      setError("手紙の生成に失敗しました。もう一度試してみてください")
    } finally {
      setIsLoading(false)
    }
  }

  const saveLetter = () => {
    if (!currentLetter || savedLetters.includes(currentLetter)) return
    const next = [...savedLetters, currentLetter]
    setSavedLetters(next)
    persistLetters(next)
  }

  const deleteLetter = (index: number) => {
    const next = savedLetters.filter((_, i) => i !== index)
    setSavedLetters(next)
    persistLetters(next)
  }

  if (!pet || pet.status !== "rainbow_bridge") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center gap-6">
        <p className="text-4xl">🌱</p>
        <div className="space-y-2">
          <h2 className="font-medium text-foreground/85">まだこのことばはないかもしれない</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ことばは、記録を積み重ねた先に生まれます。<br />
            今は、毎日のできごとを残していく時間です。<br />
            {pet?.name}との記録が積み重なったとき、Soraがあなたへの言葉を作ります。
          </p>
        </div>
        <button
          onClick={() => setCurrentScreen("timeline")}
          className="text-sm text-primary/70 underline underline-offset-4"
        >
          今日の記録を残す
        </button>
      </div>
    )
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

        {/* Error */}
        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}

        {/* Letter Display */}
        {currentLetter ? (
          <GlassCard className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="py-8 px-4">
              <p className="text-center text-foreground/80 leading-loose whitespace-pre-line text-base">
                {currentLetter}
              </p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
          </GlassCard>
        ) : (
          <GlassCard className="py-16">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <span className="text-2xl">✉️</span>
              </div>
              <p className="text-muted-foreground text-sm">
                ボタンを押すと<br />思い出から紡いだ言葉が届きます
              </p>
            </div>
          </GlassCard>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {currentLetter ? (
            <div className="flex gap-3">
              <Button
                onClick={saveLetter}
                disabled={savedLetters.includes(currentLetter)}
                variant="outline"
                className="flex-1 h-12 rounded-xl border-white/60 bg-white/50 hover:bg-white/70 disabled:opacity-50"
              >
                <Bookmark size={18} className="mr-2" />
                {savedLetters.includes(currentLetter) ? "保存済み" : "保存する"}
              </Button>
              <Button
                onClick={generateLetter}
                disabled={isLoading}
                variant="outline"
                className="flex-1 h-12 rounded-xl border-white/60 bg-white/50 hover:bg-white/70"
              >
                {isLoading ? (
                  <Loader2 size={18} className="mr-2 animate-spin" />
                ) : (
                  <RefreshCw size={18} className="mr-2" />
                )}
                もう一度読む
              </Button>
            </div>
          ) : (
            <Button
              onClick={generateLetter}
              disabled={isLoading}
              className="w-full h-14 rounded-2xl bg-primary/80 hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/10"
            >
              {isLoading ? (
                <Loader2 size={20} className="mr-2 animate-spin" />
              ) : null}
              手紙を受け取る
            </Button>
          )}
        </div>

        {/* Monthly letter link */}
        <p className="text-center text-xs text-muted-foreground">
          毎月の記録から作る手紙は →{" "}
          <button
            onClick={() => setCurrentScreen("settings")}
            className="underline underline-offset-2"
          >
            設定から見る
          </button>
        </p>

        {/* Saved Letters */}
        {savedLetters.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground/70">保存した言葉</h3>
            {savedLetters.map((letter, index) => (
              <GlassCard key={index} className="py-4 relative">
                <button
                  onClick={() => deleteLetter(index)}
                  aria-label="削除"
                  className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground hover:bg-black/5 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
                <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-line pr-8">
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
