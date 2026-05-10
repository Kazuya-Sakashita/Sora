"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import type { FeelingTag } from "@/lib/api-types"
import { GlassCard } from "@/components/glass-card"
import { MoodTrendChart } from "@/components/mood-trend-chart"
import { ArrowLeft, Check, Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { buildDailyTrend, buildWeeklySummary, MOOD_TAGS, MOOD_INFO } from "@/lib/mood-trend"

const aliveFeelingOptions: { emoji: string; label: string; tag: FeelingTag }[] = [
  { emoji: "🥰", label: "うれしい", tag: "happy" },
  { emoji: "😌", label: "おだやか", tag: "calm" },
  { emoji: "😄", label: "笑った", tag: "fun" },
  { emoji: "😟", label: "心配", tag: "worried" },
  { emoji: "💝", label: "愛おしい", tag: "loving" },
]

const rainbowFeelingOptions: { emoji: string; label: string; tag: FeelingTag }[] = [
  { emoji: "😢", label: "悲しい", tag: "sad" },
  { emoji: "😔", label: "つらい", tag: "hard" },
  { emoji: "😌", label: "おだやか", tag: "calm" },
  { emoji: "💝", label: "愛おしい", tag: "loving" },
  { emoji: "😶", label: "よくわからない", tag: "numb" },
]

export function FeelingsScreen() {
  const { setCurrentScreen, feelings, addFeeling, pet } = useApp()
  const feelingOptions = pet?.status === "rainbow_bridge" ? rainbowFeelingOptions : aliveFeelingOptions
  const [tab, setTab] = useState<"record" | "trend">("record")
  const [selectedTag, setSelectedTag] = useState<FeelingTag | null>(null)
  const [memoText, setMemoText] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showTrendDetail, setShowTrendDetail] = useState(false)
  const [daysSinceTransition, setDaysSinceTransition] = useState<number | null>(null)

  const today = new Date()
  const trendData = buildDailyTrend(feelings, today)
  const weeklySummary = buildWeeklySummary(feelings, today)
  const totalInLast30 = trendData.reduce(
    (acc, d) => acc + MOOD_TAGS.reduce((s, t) => s + d[t], 0),
    0
  )

  // ISSUE-111: monthly feeling summary
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  const thisMonthFeelings = feelings.filter((f) => (f.date ?? "").startsWith(currentMonthStr))
  const monthTagCounts = thisMonthFeelings.reduce<Record<string, number>>((acc, f) => {
    if (f.tag) acc[f.tag] = (acc[f.tag] ?? 0) + 1
    return acc
  }, {})
  const topThreeTags = Object.entries(monthTagCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const topTag = topThreeTags[0]?.[0] ?? null
  const topCount = topThreeTags[0]?.[1] ?? 0
  const isRB = pet?.status === "rainbow_bridge"

  const monthlySummaryText = (() => {
    if (!topTag || topCount === 0) return null
    const labels: Record<string, string> = {
      happy: "うれしい", calm: "おだやか", fun: "たのしい", worried: "心配", loving: "愛おしい",
      sad: "悲しい", hard: "つらい", numb: "よくわからない",
    }
    const label = labels[topTag] ?? topTag
    if (isRB) {
      return `今月は${label}な気持ちの日が${topCount}日ありました。それでよかったと思います。`
    }
    return `今月は${label}な日が${topCount}日ありました。${pet?.name ?? ""}との時間が、そのまま記録されています。`
  })()

  // days since Rainbow Bridge transition
  const rbDays = (() => {
    if (!pet || !isRB) return null
    const stored = typeof window !== "undefined" ? localStorage.getItem(`sora:loss-transition-${pet.id}`) : null
    if (!stored) return null
    return Math.round((Date.now() - parseInt(stored, 10)) / (24 * 60 * 60 * 1000))
  })()

  const handleSelectTag = (tag: FeelingTag) => {
    setSelectedTag(tag)
    setShowConfirmation(false)
  }

  const handleSaveFeeling = async () => {
    if (!selectedTag || isSaving) return
    setIsSaving(true)
    try {
      await addFeeling({
        tag: selectedTag,
        memo: memoText.trim() || undefined,
        date: today.toISOString().split("T")[0],
      })
      setMemoText("")
      setSelectedTag(null)
      setShowConfirmation(true)
      setTimeout(() => setShowConfirmation(false), 3000)
    } catch {
      // silent
    } finally {
      setIsSaving(false)
    }
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
              <Sparkles size={14} />
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
                onClick={() => handleSelectTag(tag)}
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

          {/* Memo + Save (shown after tag selection) */}
          {selectedTag && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value.slice(0, 100))}
                placeholder="今日の気持ち、少し書いておきますか"
                rows={2}
                className="w-full resize-none rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 px-4 py-3 text-sm text-foreground/80 placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/30 focus:bg-white/70 transition-colors leading-relaxed"
              />
              {memoText.length > 80 && (
                <p className="text-xs text-muted-foreground text-right">{memoText.length}/100</p>
              )}
              <button
                onClick={handleSaveFeeling}
                disabled={isSaving}
                className="w-full h-12 rounded-2xl bg-primary/80 hover:bg-primary/90 text-primary-foreground font-medium text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : "この気持ちを残す"}
              </button>
            </div>
          )}

          {showConfirmation && (
            <GlassCard className="bg-linear-to-br from-white/60 to-accent/10 border-accent/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-center text-foreground/70 leading-relaxed">
                その気持ち、大切にしていいんですよ
              </p>
            </GlassCard>
          )}

          {feelings.length > 0 && (
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-medium text-foreground/70">感情の軌跡</h3>
              <div className="space-y-3">
                {feelings.slice(0, 30).map((feeling) => {
                  const option = feelingOptions.find((o) => o.tag === feeling.tag)
                  const d = new Date(feeling.date)
                  const isCurrentYear = d.getFullYear() === today.getFullYear()
                  const dateLabel = d.toLocaleDateString("ja-JP", {
                    year: isCurrentYear ? undefined : "numeric",
                    month: "long",
                    day: "numeric",
                  })
                  return (
                    <GlassCard key={feeling.id} className="py-3 flex items-start gap-4">
                      <span className="text-xl mt-0.5">{option?.emoji || "💭"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-foreground/80">{option?.label || feeling.tag}</p>
                          <p className="text-xs text-muted-foreground">{dateLabel}</p>
                        </div>
                        {feeling.memo && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                            {feeling.memo}
                          </p>
                        )}
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
              <span className="text-4xl">💭</span>
              <div className="space-y-1">
                <p className="font-medium text-foreground/70">もっと記録するとトレンドが見えます</p>
                <p className="text-sm text-muted-foreground">あと {5 - totalInLast30} 件記録してみましょう</p>
              </div>
            </GlassCard>
          ) : (
            <>
              {/* Monthly Text Summary (ISSUE-111) */}
              <GlassCard className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-primary/60">
                    {today.getMonth() + 1}月の気持ち
                  </p>
                  {isRB && rbDays !== null && (
                    <p className="text-xs text-muted-foreground">
                      あれから{rbDays}日が経ちました
                    </p>
                  )}
                </div>

                {/* Top 3 tag badges */}
                {topThreeTags.length > 0 ? (
                  <div className="flex gap-2 flex-wrap">
                    {topThreeTags.map(([tag, count], i) => {
                      const info = MOOD_INFO[tag as keyof typeof MOOD_INFO]
                      if (!info) return null
                      return (
                        <div
                          key={tag}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${info.color}${i === 0 ? "30" : "18"}`,
                            color: i === 0 ? "rgb(var(--foreground) / 0.8)" : "rgb(var(--muted-foreground))",
                          }}
                        >
                          <span>{info.emoji}</span>
                          <span>{info.label}</span>
                          <span className="opacity-60">{count}日</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">今月はまだ記録がありません</p>
                )}

                {/* Narrative */}
                {monthlySummaryText && (
                  <p className="text-sm text-foreground/80 leading-relaxed">{monthlySummaryText}</p>
                )}

                {/* RB quiet question */}
                {isRB && topTag && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    変わってきている感覚はありますか？
                  </p>
                )}

                {/* Weekly word */}
                {weeklySummary && !isRB && (
                  <p className="text-xs text-primary/60 border-t border-black/5 pt-3">{weeklySummary}</p>
                )}
              </GlassCard>

              {/* 詳細を見る accordion */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowTrendDetail((v) => !v)}
                  className="w-full h-10 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/60 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:bg-white/70 transition-colors"
                >
                  {showTrendDetail ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {showTrendDetail ? "閉じる" : "グラフで詳細を見る"}
                </button>

                {showTrendDetail && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
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
                  </div>
                )}
              </div>

              {/* Feelings History List */}
              {feelings.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-foreground/60 px-1">感情の軌跡</p>
                  {feelings.slice(0, 30).map((feeling) => {
                    const option = feelingOptions.find((o) => o.tag === feeling.tag)
                    const d = new Date(feeling.date)
                    const isCurrentYear = d.getFullYear() === today.getFullYear()
                    const dateLabel = d.toLocaleDateString("ja-JP", {
                      year: isCurrentYear ? undefined : "numeric",
                      month: "long",
                      day: "numeric",
                    })
                    return (
                      <GlassCard key={feeling.id} className="py-3 flex items-start gap-4">
                        <span className="text-xl mt-0.5">{option?.emoji || "💭"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-foreground/80">{option?.label || feeling.tag}</p>
                            <p className="text-xs text-muted-foreground">{dateLabel}</p>
                          </div>
                          {feeling.memo && (
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                              {feeling.memo}
                            </p>
                          )}
                        </div>
                      </GlassCard>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </main>
      )}
    </div>
  )
}
