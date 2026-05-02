"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import type { FeelingTag } from "@/lib/api-types"
import { GlassCard } from "@/components/glass-card"
import { MoodTrendChart } from "@/components/mood-trend-chart"
import { ArrowLeft, Check, TrendingUp } from "lucide-react"
import { buildDailyTrend, buildWeeklySummary, MOOD_TAGS, MOOD_INFO } from "@/lib/mood-trend"

const feelingOptions: { emoji: string; label: string; tag: FeelingTag }[] = [
  { emoji: "🥰", label: "うれしい", tag: "happy" },
  { emoji: "😌", label: "おだやか", tag: "calm" },
  { emoji: "😄", label: "笑った", tag: "fun" },
  { emoji: "😟", label: "心配", tag: "worried" },
  { emoji: "💝", label: "愛おしい", tag: "loving" },
]

export function FeelingsScreen() {
  const { setCurrentScreen, feelings, addFeeling } = useApp()
  const [tab, setTab] = useState<"record" | "trend">("record")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const today = new Date()
  const trendData = buildDailyTrend(feelings, today)
  const weeklySummary = buildWeeklySummary(feelings, today)
  const totalInLast30 = trendData.reduce(
    (acc, d) => acc + MOOD_TAGS.reduce((s, t) => s + d[t], 0),
    0
  )

  const handleSelectFeeling = async (tag: FeelingTag) => {
    setSelectedTag(tag)
    try {
      await addFeeling({
        tag,
        date: today.toISOString().split("T")[0],
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
              aria-label="ホームへ戻る"
              onClick={() => setCurrentScreen("home")}
              className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center text-muted-foreground"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="flex-1 font-medium text-foreground/90">いまの気持ち</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 pb-3">
            <button
              onClick={() => setTab("record")}
              className={`flex-1 h-9 rounded-xl text-sm font-medium transition-colors ${
                tab === "record"
                  ? "bg-white/70 text-foreground/90 shadow-sm"
                  : "text-muted-foreground hover:bg-white/40"
              }`}
            >
              記録する
            </button>
            <button
              onClick={() => setTab("trend")}
              className={`flex-1 h-9 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                tab === "trend"
                  ? "bg-white/70 text-foreground/90 shadow-sm"
                  : "text-muted-foreground hover:bg-white/40"
              }`}
            >
              <TrendingUp size={14} />
              トレンド
            </button>
          </div>
        </div>
      </header>

      {/* Record Tab */}
      {tab === "record" && (
        <main className="px-6 py-8 space-y-8">
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

          {showConfirmation && (
            <GlassCard className="bg-linear-to-br from-white/60 to-accent/10 border-accent/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-center text-foreground/70 leading-relaxed">
                その気持ち、大切にしていいんですよ
              </p>
            </GlassCard>
          )}

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
      )}

      {/* Trend Tab */}
      {tab === "trend" && (
        <main className="px-4 py-6 space-y-5">
          {totalInLast30 < 5 ? (
            <GlassCard className="py-12 flex flex-col items-center gap-4 text-center">
              <span className="text-4xl">📊</span>
              <div className="space-y-1">
                <p className="font-medium text-foreground/70">もっと記録するとトレンドが見えます</p>
                <p className="text-sm text-muted-foreground">あと {5 - totalInLast30} 件記録してみましょう</p>
              </div>
            </GlassCard>
          ) : (
            <>
              {/* Weekly Summary */}
              {weeklySummary && (
                <GlassCard className="py-4 text-center">
                  <p className="text-sm font-medium text-foreground/80">{weeklySummary}</p>
                </GlassCard>
              )}

              {/* Tag Filters */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`h-8 px-3 rounded-full text-xs font-medium transition-colors ${
                    selectedTag === null
                      ? "bg-foreground/15 text-foreground/80"
                      : "bg-white/60 text-muted-foreground hover:bg-white/80"
                  }`}
                >
                  すべて
                </button>
                {MOOD_TAGS.map((tag) => {
                  const info = MOOD_INFO[tag]
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      className={`h-8 px-3 rounded-full text-xs font-medium transition-colors ${
                        selectedTag === tag
                          ? "text-foreground/80"
                          : "bg-white/60 text-muted-foreground hover:bg-white/80"
                      }`}
                      style={selectedTag === tag ? { backgroundColor: `${info.color}40` } : undefined}
                    >
                      {info.emoji} {info.label}
                    </button>
                  )
                })}
              </div>

              {/* Chart */}
              <GlassCard className="py-4 px-2">
                <p className="text-xs text-muted-foreground px-2 mb-3">過去30日の気持ち記録</p>
                <MoodTrendChart data={trendData} selectedTag={selectedTag} />
              </GlassCard>
            </>
          )}
        </main>
      )}
    </div>
  )
}
