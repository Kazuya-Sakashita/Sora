"use client"

import { useApp } from "@/lib/app-context"
import { GlassCard } from "@/components/glass-card"
import { Settings, BookOpen, Heart, CalendarDays, Mail, MessageCircle, Download, Loader2, Lock, Share2 } from "lucide-react"
import { calcDaysWith, getTimeGreeting } from "@/lib/date"
import { calcStreak, getMilestoneMessage } from "@/lib/streak"
import { getTodayMilestone } from "@/lib/milestone"
import { buildMonthlyRecap, isRecapWindow } from "@/lib/recap"
import { UpgradeModal } from "@/components/upgrade-modal"
import { useState, useEffect } from "react"

export function HomeScreen() {
  const { pet, memories, feelings, setCurrentScreen } = useApp()
  const greeting = getTimeGreeting()
  const days = pet?.broughtAt ? calcDaysWith(pet.broughtAt) : null
  const recentMemories = memories.slice(0, 3)
  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]
  const recordedToday = memories.find((m) => m.date === todayStr)
  const streak = calcStreak(memories.map((m) => m.date))
  const milestoneMessage = getMilestoneMessage(streak)
  const todayMilestone = pet ? getTodayMilestone(pet) : null
  const [milestoneDissmissed, setMilestoneDismissed] = useState(false)
  const [downloadingCard, setDownloadingCard] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [plan, setPlan] = useState<"FREE" | "PLUS" | null>(null)

  useEffect(() => {
    fetch("/api/billing/plan")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.plan) setPlan(d.plan) })
      .catch(() => {})
  }, [])

  async function handleDownloadMilestoneCard() {
    if (!todayMilestone || !pet) return
    setDownloadingCard(true)
    try {
      const planRes = await fetch("/api/billing/plan")
      const { plan } = await planRes.json()
      if (plan === "FREE") {
        setShowUpgradeModal(true)
        return
      }
      const params = new URLSearchParams({
        type: "milestone",
        label: todayMilestone.label,
        emoji: todayMilestone.emoji,
        petName: pet.name,
      })
      const res = await fetch(`/api/og?${params}`)
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `sora-milestone-${todayMilestone.label}.png`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloadingCard(false)
    }
  }

  const monthlyRecap = isRecapWindow(today) ? buildMonthlyRecap(memories, feelings, today) : null

  const onThisDay = memories
    .filter((m) => {
      const d = new Date(m.date)
      return (
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate() &&
        d.getFullYear() !== today.getFullYear()
      )
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null

  function onThisDayLabel(dateStr: string): string {
    const diff = today.getFullYear() - new Date(dateStr).getFullYear()
    return diff >= 1 ? `${diff}年前の今日` : "過去の今日"
  }

  return (
    <div className="min-h-screen pb-safe">
      {/* Milestone Overlay */}
      {todayMilestone && !milestoneDissmissed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="w-full max-w-sm rounded-3xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl p-8 space-y-5 text-center animate-in zoom-in-95 duration-300">
            <p className="text-6xl">{todayMilestone.emoji}</p>
            <div className="space-y-2">
              <p className="text-xs font-medium text-primary/60 tracking-wide uppercase">
                {todayMilestone.type === "days" && "記念日"}
                {todayMilestone.type === "birthday" && "お誕生日"}
                {todayMilestone.type === "anniversary" && "お迎え記念日"}
              </p>
              <h2 className="text-xl font-bold text-foreground/90">{todayMilestone.label}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{todayMilestone.message}</p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                onClick={handleDownloadMilestoneCard}
                disabled={downloadingCard}
                className="w-full h-11 rounded-2xl bg-amber-400/90 hover:bg-amber-400 text-white font-medium text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {downloadingCard ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Download size={15} />
                )}
                記念カードを保存する
              </button>
              <button
                onClick={() => {
                  const text = `${pet!.name}と今日で${todayMilestone.label} ${todayMilestone.emoji} #Sora #ペット記録`
                  if (typeof navigator !== "undefined" && navigator.share) {
                    navigator.share({ title: `${todayMilestone.label}`, text, url: window.location.origin }).catch(() => {})
                  } else {
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "noopener")
                  }
                }}
                className="w-full h-11 rounded-2xl bg-sky-100 hover:bg-sky-200 text-sky-700 font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Share2 size={15} />
                シェアする
              </button>
              <button
                onClick={() => { setMilestoneDismissed(true); setCurrentScreen("timeline") }}
                className="w-full h-12 rounded-2xl bg-primary/80 text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
              >
                今日の思い出を残す
              </button>
              <button
                onClick={() => setMilestoneDismissed(true)}
                className="w-full h-10 rounded-2xl text-sm text-muted-foreground hover:bg-black/5 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}

      {/* Header */}
      <header className="px-6 pt-safe">
        <div className="h-16 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{greeting}</p>
            {pet && (
              <p className="text-base font-medium text-foreground/80">{pet.name}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {pet && (
              <div className="w-10 h-10 rounded-full overflow-hidden bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                {pet.photoUrl ? (
                  <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">🐾</span>
                )}
              </div>
            )}
            <button
              aria-label="設定"
              onClick={() => setCurrentScreen("settings")}
              className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center text-muted-foreground"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 space-y-4 pb-8">
        {/* First Record Nudge — memories が 0 件の時のみ */}
        {pet && memories.length === 0 && (
          <div
            className="rounded-3xl p-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500"
            style={{ background: "linear-gradient(135deg, #F5EEE4 0%, #EDD9B5 100%)" }}
          >
            <p className="text-2xl">🐾</p>
            <div className="space-y-1">
              <p className="font-semibold text-foreground/85">
                {pet.name}との最初の思い出を残しましょう
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                小さな記録が、かけがえのない物語になります。
              </p>
            </div>
            <button
              onClick={() => setCurrentScreen("timeline")}
              className="w-full h-11 rounded-2xl bg-primary/80 text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              今すぐ残す
            </button>
          </div>
        )}

        {/* Days Counter */}
        {pet && (
          <GlassCard className="text-center py-10 space-y-2">
            <p className="text-sm text-muted-foreground">
              {pet.status === "rainbow_bridge" ? `${pet.name}と過ごした` : `${pet.name}と一緒に`}
            </p>
            {days !== null ? (
              <div className="flex items-end justify-center gap-2">
                <span className="text-8xl font-bold text-foreground/85 leading-none tabular-nums tracking-tight">
                  {days.toLocaleString()}
                </span>
                <span className="text-3xl text-muted-foreground pb-3">日</span>
              </div>
            ) : (
              <p className="text-4xl font-medium text-foreground/70 py-4">
                一緒にいる日々
              </p>
            )}

            {/* Streak Badge */}
            {streak > 0 && (
              <div className="flex justify-center pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-xs font-medium text-orange-500">
                  🔥 {streak}日連続記録中
                </span>
              </div>
            )}

            {/* Milestone Message */}
            {milestoneMessage && (
              <p className="text-xs text-primary/70 font-medium pt-1 animate-in fade-in duration-500">
                {milestoneMessage}
              </p>
            )}
          </GlassCard>
        )}

        {/* Primary CTA */}
        {recordedToday ? (
          <button
            onClick={() => setCurrentScreen("timeline")}
            className="w-full rounded-2xl overflow-hidden active:scale-[0.98] transition-all shadow-md"
            style={{ background: "linear-gradient(135deg, #F0E6D8, #EDD9B5)" }}
          >
            {recordedToday.photoUrls?.[0] && (
              <img
                src={recordedToday.photoUrls[0]}
                alt={recordedToday.title}
                className="w-full h-28 object-cover"
              />
            )}
            <div className="h-14 flex items-center justify-center gap-3 text-foreground/80 font-medium text-base">
              <span className="text-lg">✓</span>
              今日も残せました
            </div>
          </button>
        ) : (
          <button
            onClick={() => setCurrentScreen("timeline")}
            className="w-full rounded-2xl overflow-hidden active:scale-[0.98] transition-all shadow-md"
            style={{ background: "linear-gradient(135deg, #F0E6D8, #EDD9B5)" }}
          >
            <div className="h-16 flex items-center justify-center gap-3 text-foreground/80 font-medium text-base">
              <BookOpen size={20} />
              <span>
                {streak > 0 && !recordedToday
                  ? `${streak}日連続中 — 今日も残しませんか`
                  : "今日の思い出を残す"}
              </span>
            </div>
          </button>
        )}

        {/* Sub Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setCurrentScreen("feelings")}
            className="h-12 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:bg-white/80 transition-colors"
          >
            <Heart size={16} />
            気持ちを記録
          </button>
          <button
            onClick={() => setCurrentScreen("schedule")}
            className="h-12 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:bg-white/80 transition-colors"
          >
            <CalendarDays size={16} />
            予定を見る
          </button>
        </div>

        {/* Loss Care Navigation — RAINBOW_BRIDGE only */}
        {pet?.status === "rainbow_bridge" && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCurrentScreen("letter")}
              className="h-12 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:bg-white/80 transition-colors"
            >
              <Mail size={16} />
              ことば
            </button>
            <button
              onClick={() => setCurrentScreen("chat")}
              className="h-12 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:bg-white/80 transition-colors"
            >
              <MessageCircle size={16} />
              はなす
            </button>
          </div>
        )}

        {/* On This Day */}
        {onThisDay && (
          <button
            onClick={() => setCurrentScreen("timeline")}
            className="w-full text-left active:scale-[0.98] transition-all"
          >
            <GlassCard className="overflow-hidden p-0">
              {onThisDay.photoUrls?.[0] && (
                <img
                  src={onThisDay.photoUrls[0]}
                  alt={onThisDay.title}
                  className="w-full h-36 object-cover"
                />
              )}
              <div className="px-4 py-3 space-y-0.5">
                <p className="text-xs font-medium text-primary/70">
                  {onThisDayLabel(onThisDay.date)}
                </p>
                <p className="text-sm font-medium text-foreground/85 leading-snug">
                  {onThisDay.title}
                </p>
              </div>
            </GlassCard>
          </button>
        )}

        {/* Monthly Recap Card */}
        {monthlyRecap && (
          <button
            onClick={() => setCurrentScreen("timeline")}
            className="w-full text-left active:scale-[0.98] transition-all"
            aria-label="先月のふりかえり"
          >
            <GlassCard className="overflow-hidden p-0">
              {monthlyRecap.coverPhotoUrl && (
                <img
                  src={monthlyRecap.coverPhotoUrl}
                  alt="先月のカバー写真"
                  className="w-full h-28 object-cover"
                />
              )}
              <div className="px-4 py-3 space-y-2">
                <p className="text-xs font-medium text-primary/70">
                  {monthlyRecap.label}のふりかえり
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-foreground/80">
                    📝 {monthlyRecap.memoryCount}件の思い出
                  </span>
                  {monthlyRecap.photoCount > 0 && (
                    <span className="text-sm text-foreground/80">
                      📷 {monthlyRecap.photoCount}枚
                    </span>
                  )}
                  {monthlyRecap.topMoodTag && (
                    <span className="text-sm text-foreground/80">
                      ✨ {monthlyRecap.topMoodTag}が多かった月
                    </span>
                  )}
                </div>
              </div>
            </GlassCard>
          </button>
        )}

        {/* Sora+ バナー（Free + 5件以上） */}
        {plan === "FREE" && memories.length >= 5 && pet && (
          <div className="relative rounded-3xl overflow-hidden border border-amber-100 bg-linear-to-br from-amber-50 to-orange-50 p-5 space-y-3">
            <Lock size={14} className="absolute top-4 right-4 text-amber-400" />
            <div className="space-y-1 pr-6">
              <p className="font-semibold text-foreground/85 text-sm leading-snug">
                {pet.name}の今月をフォトブックにまとめよう 📷
              </p>
              <p className="text-xs text-muted-foreground">Sora+ で毎月PDF保存できます</p>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="h-9 px-4 rounded-2xl bg-amber-400/90 hover:bg-amber-400 text-white font-medium text-xs transition-colors"
            >
              Sora+ を見る
            </button>
          </div>
        )}

        {/* Recent Memories */}
        {recentMemories.length > 0 && (
          <section className="space-y-3 pt-2">
            <h2 className="text-sm font-medium text-foreground/60 px-1">最近の思い出</h2>
            <div className="space-y-2">
              {recentMemories.map((memory) => (
                <button
                  key={memory.id}
                  onClick={() => setCurrentScreen("timeline")}
                  className="w-full text-left"
                >
                  <GlassCard className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground/80 truncate">
                        {memory.title}
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(memory.date).toLocaleDateString("ja-JP", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    {memory.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {memory.description}
                      </p>
                    )}
                  </GlassCard>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
