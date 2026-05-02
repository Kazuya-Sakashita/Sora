"use client"

import { useApp } from "@/lib/app-context"
import { GlassCard } from "@/components/glass-card"
import { Settings, BookOpen, Heart, CalendarDays } from "lucide-react"
import { calcDaysWith, getTimeGreeting } from "@/lib/date"
import { calcStreak, getMilestoneMessage } from "@/lib/streak"

export function HomeScreen() {
  const { pet, memories, setCurrentScreen } = useApp()
  const greeting = getTimeGreeting()
  const days = pet?.broughtAt ? calcDaysWith(pet.broughtAt) : null
  const recentMemories = memories.slice(0, 3)
  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]
  const recordedToday = memories.find((m) => m.date === todayStr)
  const streak = calcStreak(memories.map((m) => m.date))
  const milestoneMessage = getMilestoneMessage(streak)

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
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
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
        {/* Days Counter */}
        {pet && (
          <GlassCard className="text-center py-10 space-y-2">
            <p className="text-sm text-muted-foreground">
              {pet.name}と一緒に
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
