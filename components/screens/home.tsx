"use client"

import { useApp } from "@/lib/app-context"
import { GlassCard } from "@/components/glass-card"
import { Settings, BookOpen, Heart, CalendarDays, Mail, MessageCircle, Download, Loader2, Lock, Share2, Sparkles, Bell, X } from "lucide-react"
import { calcDaysWith, getTimeGreeting } from "@/lib/date"
import { calcStreak, getMilestoneMessage } from "@/lib/streak"
import { getTodayMilestone } from "@/lib/milestone"
import { buildMonthlyRecap, isRecapWindow } from "@/lib/recap"
import { UpgradeModal } from "@/components/upgrade-modal"
import { useState, useEffect } from "react"
import { getNotificationStatus } from "@/lib/push-client"

export function HomeScreen() {
  const { pet, memories, feelings, setCurrentScreen, setPendingMemoryTitle, updatePetStatus, setPendingHighlightMemoryId } = useApp()
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
  const [dailyQuestion, setDailyQuestion] = useState<string | null>(null)
  const [showPetSheet, setShowPetSheet] = useState(false)
  const [showLossCareConfirm, setShowLossCareConfirm] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showPushBanner, setShowPushBanner] = useState(false)
  const [monthlyMessage, setMonthlyMessage] = useState<string | null>(null)
  const [isLoadingMonthlyMessage, setIsLoadingMonthlyMessage] = useState(false)
  const [monthlyMessageGenerated, setMonthlyMessageGenerated] = useState(false)
  const [showLossWelcome, setShowLossWelcome] = useState(false)
  const [showLossGuidance, setShowLossGuidance] = useState(false)

  useEffect(() => {
    fetch("/api/billing/plan")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.plan) setPlan(d.plan) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
    const currentMonthCount = memories.filter((m) => m.date?.startsWith(currentMonthStr)).length
    if (!pet || pet.status !== "alive" || currentMonthCount < 3) return
    const cacheKey = `sora:monthly-message-${pet.id}-${today.getFullYear()}-${today.getMonth() + 1}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) { setMonthlyMessage(cached); return }
    setIsLoadingMonthlyMessage(true)
    fetch(`/api/pets/${pet.id}/ai-message`, { method: "POST" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.message) {
          setMonthlyMessage(d.message)
          localStorage.setItem(cacheKey, d.message)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingMonthlyMessage(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pet?.id, memories.length])

  useEffect(() => {
    const dismissed = localStorage.getItem("sora:push-banner-dismissed")
    if (dismissed) return
    getNotificationStatus().then((status) => {
      if (status === "default") setShowPushBanner(true)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!pet || pet.status !== "rainbow_bridge") return
    const dismissKey = `sora:loss-welcome-dismissed-${pet.id}`
    if (localStorage.getItem(dismissKey)) return
    const transitionKey = `sora:loss-transition-${pet.id}`
    const stored = localStorage.getItem(transitionKey)
    if (!stored) {
      localStorage.setItem(transitionKey, Date.now().toString())
      setShowLossWelcome(true)
    } else {
      const elapsed = Date.now() - parseInt(stored, 10)
      if (elapsed < 72 * 60 * 60 * 1000) setShowLossWelcome(true)
    }
  }, [pet?.id, pet?.status])

  useEffect(() => {
    if (!pet) return
    fetch(`/api/pets/${pet.id}/daily-question`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.question) setDailyQuestion(d.question) })
      .catch(() => {})
  }, [pet?.id])

  const handleLossCareTransition = async () => {
    setIsTransitioning(true)
    try {
      await updatePetStatus("rainbow_bridge")
      setShowLossCareConfirm(false)
      setShowPetSheet(false)
      setShowLossGuidance(true)
    } catch {
      // keep modal open on error
    } finally {
      setIsTransitioning(false)
    }
  }

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

  const handleRegenerateMonthlyMessage = async () => {
    if (!pet || isLoadingMonthlyMessage || monthlyMessageGenerated) return
    setIsLoadingMonthlyMessage(true)
    setMonthlyMessageGenerated(true)
    try {
      const r = await fetch(`/api/pets/${pet.id}/ai-message`, { method: "POST" })
      if (!r.ok) return
      const d = await r.json()
      if (d?.message) {
        setMonthlyMessage(d.message)
        const cacheKey = `sora:monthly-message-${pet.id}-${today.getFullYear()}-${today.getMonth() + 1}`
        localStorage.setItem(cacheKey, d.message)
      }
    } catch {
      // silent
    } finally {
      setIsLoadingMonthlyMessage(false)
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
              <button
                aria-label="ペットのプロフィール"
                onClick={() => setShowPetSheet(true)}
                className="w-10 h-10 rounded-full overflow-hidden bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {pet.photoUrl ? (
                  <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">🐾</span>
                )}
              </button>
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

        {/* Push Notification Banner — 初回のみ、defaultの場合のみ */}
        {showPushBanner && (
          <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <Bell size={16} className="text-primary/60 shrink-0" />
            <p className="text-xs text-muted-foreground flex-1">
              記録を忘れた日に、そっとお知らせします
            </p>
            <button
              onClick={() => setCurrentScreen("settings")}
              className="text-xs text-primary/70 underline underline-offset-2 shrink-0"
            >
              設定する
            </button>
            <button
              aria-label="バナーを閉じる"
              onClick={() => {
                localStorage.setItem("sora:push-banner-dismissed", "1")
                setShowPushBanner(false)
              }}
              className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:bg-black/5 shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Loss Welcome Card — 72h post-transition (ISSUE-062) */}
        {showLossWelcome && (
          <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 px-5 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-foreground/85 leading-relaxed flex-1 pr-3">
                急がなくていい。ゆっくりでいい。<br />
                Soraはここにいます。
              </p>
              <button
                aria-label="カードを閉じる"
                onClick={() => {
                  if (pet) localStorage.setItem(`sora:loss-welcome-dismissed-${pet.id}`, "1")
                  setShowLossWelcome(false)
                }}
                className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:bg-black/5 shrink-0"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentScreen("letter")}
                className="flex-1 text-xs text-primary/70 py-2 rounded-xl bg-primary/8 hover:bg-primary/12 transition-colors"
              >
                ことば
              </button>
              <button
                onClick={() => setCurrentScreen("chat")}
                className="flex-1 text-xs text-primary/70 py-2 rounded-xl bg-primary/8 hover:bg-primary/12 transition-colors"
              >
                はなす
              </button>
            </div>
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
                {pet?.status === "rainbow_bridge" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-xs font-medium text-primary/60">
                    {streak}日分の思い出が残っています
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-xs font-medium text-orange-500">
                    🔥 {streak}日連続記録中
                  </span>
                )}
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

        {/* Daily Question Card */}
        {pet && dailyQuestion && (pet.status === "rainbow_bridge" || !recordedToday) && (
          <button
            onClick={() => {
              setPendingMemoryTitle(dailyQuestion.replace(/？$/, ""))
              setCurrentScreen("timeline")
            }}
            className="w-full text-left active:scale-[0.98] transition-all"
            aria-label="今日の問いかけ"
          >
            <GlassCard className="space-y-2">
              <div className="flex items-center gap-2 text-primary/60">
                <Sparkles size={14} />
                <span className="text-xs font-medium">今日の問いかけ</span>
              </div>
              <p className="text-sm font-medium text-foreground/85 leading-snug">{dailyQuestion}</p>
              <p className="text-xs text-muted-foreground">
                {pet.status === "rainbow_bridge" ? "今日も残しませんか" : "タップして記録する"}
              </p>
            </GlassCard>
          </button>
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
                {pet?.status === "rainbow_bridge"
                  ? "思い出を振り返る"
                  : streak > 0 && !recordedToday
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
            onClick={() => {
              setPendingHighlightMemoryId(onThisDay.id)
              setCurrentScreen("timeline")
            }}
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

        {/* 今月のひとこと（alive + 月末5日間 + 記録3件以上） */}
        {pet?.status === "alive" && (monthlyMessage || isLoadingMonthlyMessage) && (
          <GlassCard className="space-y-3">
            <div className="flex items-center gap-2 text-primary/60">
              <Sparkles size={14} />
              <span className="text-xs font-medium">
                {today.getMonth() + 1}月の{pet.name}へのひとこと
              </span>
            </div>
            {isLoadingMonthlyMessage ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-1">
                <Loader2 size={14} className="animate-spin shrink-0" />
                <span>Soraが読んでいます...</span>
              </div>
            ) : (
              <p className="text-sm text-foreground/80 leading-relaxed">{monthlyMessage}</p>
            )}
            <div className="flex items-center justify-between">
              {!monthlyMessageGenerated && (
                <button
                  onClick={handleRegenerateMonthlyMessage}
                  disabled={isLoadingMonthlyMessage}
                  className="text-xs text-muted-foreground underline underline-offset-2 disabled:opacity-50"
                >
                  もう一度生成
                </button>
              )}
              {plan === "FREE" && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="text-xs text-primary/60 ml-auto"
                >
                  毎月の手紙は Sora+ →
                </button>
              )}
            </div>
          </GlassCard>
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

      {/* ペットプロフィールシート */}
      {showPetSheet && pet && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowPetSheet(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white/95 backdrop-blur-xl border-t border-white/60 shadow-2xl p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                {pet.photoUrl ? (
                  <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🐾</span>
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground/90">{pet.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pet.status === "rainbow_bridge" ? "虹の橋の向こうに" : "一緒に過ごしている"}
                </p>
              </div>
            </div>

            {pet.status === "alive" && (
              <button
                onClick={() => { setShowPetSheet(false); setShowLossCareConfirm(true) }}
                className="w-full h-12 rounded-2xl border border-muted/60 text-sm text-muted-foreground hover:bg-muted/10 transition-colors flex items-center justify-center gap-2"
              >
                🌈 虹の橋を渡りました
              </button>
            )}

            <button
              onClick={() => setShowPetSheet(false)}
              className="w-full h-10 rounded-2xl text-sm text-muted-foreground hover:bg-black/5 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* ロスケア移行確認モーダル */}
      {showLossCareConfirm && pet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-4">
              <p className="text-5xl">🌈</p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {pet.name}のことを教えてくれてありがとう。<br />
                これからも、ここに残していいですよ。
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={handleLossCareTransition}
                disabled={isTransitioning}
                className="w-full h-12 rounded-2xl bg-primary/10 hover:bg-primary/15 text-primary/80 font-medium text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isTransitioning ? <Loader2 size={16} className="animate-spin" /> : "はい、移行します"}
              </button>
              <button
                onClick={() => setShowLossCareConfirm(false)}
                className="w-full h-10 rounded-2xl text-sm text-muted-foreground hover:bg-black/5 transition-colors"
              >
                まだ大丈夫です
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ロスケア移行後ガイダンスモーダル */}
      {showLossGuidance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-4">
              <p className="text-5xl">🌿</p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                これからも、ここに残していいですよ。<br />
                Soraには、今の気持ちを話せる「はなす」と、思い出から生まれる「ことば」があります。急がなくていい。気が向いたときに。
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => { setShowLossGuidance(false); setCurrentScreen("chat") }}
                className="w-full h-12 rounded-2xl bg-primary/10 hover:bg-primary/15 text-primary/80 font-medium text-sm transition-colors"
              >
                話してみる
              </button>
              <button
                onClick={() => setShowLossGuidance(false)}
                className="w-full h-10 rounded-2xl text-sm text-muted-foreground hover:bg-black/5 transition-colors"
              >
                ホームへ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
