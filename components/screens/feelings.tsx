"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { GlassCard } from "@/components/glass-card"
import { ArrowLeft, Check } from "lucide-react"

const feelingOptions = [
  { emoji: "😊", label: "うれしい", tag: "happy" },
  { emoji: "🌿", label: "おだやか", tag: "calm" },
  { emoji: "😄", label: "笑った", tag: "fun" },
  { emoji: "💭", label: "心配", tag: "worried" },
  { emoji: "💝", label: "愛おしい", tag: "loving" },
]

export function FeelingsScreen() {
  const { setCurrentScreen, feelings, addFeeling } = useApp()
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleSelectFeeling = async (tag: string) => {
    setSelectedTag(tag)
    try {
      await addFeeling({
        tag,
        date: new Date().toISOString().split("T")[0],
      })
    } catch {
      // silent
    }
    setShowConfirmation(true)
    setTimeout(() => setShowConfirmation(false), 3000)
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
            <h1 className="flex-1 font-medium text-foreground/90">いまの気持ち</h1>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 space-y-8">
        {/* Feeling Selection */}
        <div className="space-y-4">
          {feelingOptions.map(({ emoji, label, tag }) => (
            <button
              key={tag}
              onClick={() => handleSelectFeeling(tag)}
              className={`w-full p-5 rounded-2xl flex items-center gap-4 transition-all ${
                selectedTag === tag
                  ? "bg-primary/15 border-2 border-primary/30"
                  : "bg-white/60 backdrop-blur-sm border border-white/50 hover:bg-white/80"
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="flex-1 text-left text-foreground/80 font-medium">{label}</span>
              {selectedTag === tag && (
                <div className="w-6 h-6 rounded-full bg-primary/80 flex items-center justify-center">
                  <Check size={14} className="text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Confirmation Message */}
        {showConfirmation && (
          <GlassCard className="bg-linear-to-br from-white/60 to-accent/10 border-accent/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-center text-foreground/70 leading-relaxed">
              その気持ち、大切にしていいんですよ
            </p>
          </GlassCard>
        )}

        {/* History */}
        {feelings.length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-medium text-foreground/70">これまでの気持ち</h3>
            <div className="space-y-3">
              {feelings.slice(0, 10).map((feeling) => {
                const option = feelingOptions.find((o) => o.tag === feeling.tag)
                return (
                  <GlassCard key={feeling.id} className="py-4 flex items-center gap-4">
                    <span className="text-xl">{option?.emoji || "💭"}</span>
                    <div className="flex-1">
                      <p className="text-sm text-foreground/80">{option?.label || feeling.tag}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(feeling.date).toLocaleDateString("ja-JP", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </GlassCard>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
