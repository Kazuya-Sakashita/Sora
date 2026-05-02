"use client"

import { useEffect, useState } from "react"
import { useApp } from "@/lib/app-context"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import {
  getNotificationStatus,
  isCurrentlySubscribed,
  subscribePush,
  savePushSubscription,
  unsubscribePush,
  deletePushSubscription,
} from "@/lib/push-client"
import { GlassCard } from "@/components/glass-card"
import { ArrowLeft, Bell, Palette, Lock, MessageCircle, Check, LogOut, Loader2, Sparkles, ExternalLink, Rainbow } from "lucide-react"

export function SettingsScreen() {
  const { setCurrentScreen, conversationTone, setConversationTone, pet, updatePetStatus } = useApp()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [plan, setPlan] = useState<"FREE" | "PLUS" | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [notifStatus, setNotifStatus] = useState<"granted" | "denied" | "default" | "unsupported" | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isTogglingNotif, setIsTogglingNotif] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
    fetch("/api/billing/plan").then((r) => r.json()).then(({ plan }) => setPlan(plan))
    getNotificationStatus().then(setNotifStatus)
    isCurrentlySubscribed().then(setIsSubscribed)
  }, [])

  const handleToggleNotification = async () => {
    if (isTogglingNotif) return
    setIsTogglingNotif(true)
    try {
      if (isSubscribed) {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js")
        const sub = await reg?.pushManager.getSubscription()
        if (sub) {
          await deletePushSubscription(sub.endpoint)
          await unsubscribePush()
        }
        setIsSubscribed(false)
      } else {
        const sub = await subscribePush()
        if (sub) {
          await savePushSubscription(sub)
          setIsSubscribed(true)
          setNotifStatus("granted")
        }
      }
    } catch {
      // permission denied or error — do nothing
    } finally {
      setIsTogglingNotif(false)
      getNotificationStatus().then(setNotifStatus)
    }
  }

  const handleCheckout = async (interval: "month" | "year") => {
    setIsCheckingOut(true)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setIsCheckingOut(false)
    }
  }

  const handlePortal = async () => {
    setIsOpeningPortal(true)
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setIsOpeningPortal(false)
    }
  }

  const handleStatusChange = async (status: "alive" | "rainbow_bridge") => {
    setIsUpdatingStatus(true)
    try {
      await updatePetStatus(status)
      setShowStatusModal(false)
    } catch {
      // keep modal open on error
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    window.location.href = "/auth/login"
  }

  const toneOptions = [
    { label: "やさしく寄り添う", description: "あたたかく、そっと支える言葉" },
    { label: "思い出を一緒に振り返る", description: "大切な時間を一緒に思い出す" },
    { label: "少し前を向く言葉もほしい", description: "ゆっくりと、次の一歩へ" },
  ]

  const settingSections = [
    { icon: Palette, label: "テーマ", description: "画面の雰囲気" },
    { icon: Lock, label: "プライバシー", description: "あなたの思い出を守る" },
  ]

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
            <h1 className="flex-1 font-medium text-foreground/90">設定</h1>
          </div>
        </div>
      </header>

      <main className="px-6 py-6 space-y-8">
        {/* Account */}
        {userEmail && (
          <section>
            <GlassCard className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary/70 font-medium text-sm">
                {userEmail[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">ログイン中</p>
                <p className="text-sm font-medium text-foreground/80 truncate">{userEmail}</p>
              </div>
              {plan === "PLUS" && (
                <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-600">
                  <Sparkles size={11} />Sora+
                </span>
              )}
              {plan === "FREE" && (
                <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full bg-muted/40 text-xs text-muted-foreground">
                  Free
                </span>
              )}
            </GlassCard>
          </section>
        )}

        {/* Plan */}
        <section className="space-y-3">
          {plan === "FREE" && (
            <GlassCard className="space-y-4 py-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <Sparkles size={20} className="text-amber-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground/90">Sora+</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">無制限記録・年次レポート・フォトブック</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCheckout("month")}
                  disabled={isCheckingOut}
                  className="h-12 rounded-2xl bg-amber-400/90 hover:bg-amber-400 text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
                >
                  {isCheckingOut ? <Loader2 size={16} className="animate-spin" /> : "月額 ¥480"}
                </button>
                <button
                  onClick={() => handleCheckout("year")}
                  disabled={isCheckingOut}
                  className="h-12 rounded-2xl bg-amber-500/90 hover:bg-amber-500 text-white font-semibold text-sm transition-colors disabled:opacity-60 flex flex-col items-center justify-center leading-tight"
                >
                  <span>年額 ¥4,300</span>
                  <span className="text-[10px] opacity-80">約25%お得</span>
                </button>
              </div>
            </GlassCard>
          )}
          {plan === "PLUS" && (
            <GlassCard className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <Sparkles size={20} className="text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground/90 text-sm">Sora+ ご利用中</p>
                  <p className="text-xs text-muted-foreground">すべての機能をお使いいただけます</p>
                </div>
                <button
                  onClick={handlePortal}
                  disabled={isOpeningPortal}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground/70 transition-colors disabled:opacity-60"
                >
                  {isOpeningPortal ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
                  管理
                </button>
              </div>
            </GlassCard>
          )}
        </section>

        {/* Conversation Tone */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle size={20} className="text-primary/70" />
            </div>
            <div>
              <h2 className="font-medium text-foreground/90">会話の雰囲気</h2>
              <p className="text-xs text-muted-foreground">どんな言葉で寄り添いますか？</p>
            </div>
          </div>

          <div className="space-y-3">
            {toneOptions.map(({ label, description }) => (
              <button
                key={label}
                onClick={() => setConversationTone(label)}
                className={`w-full p-4 rounded-2xl flex items-start gap-4 text-left transition-all ${
                  conversationTone === label
                    ? "bg-primary/15 border-2 border-primary/30"
                    : "bg-white/60 backdrop-blur-sm border border-white/50 hover:bg-white/80"
                }`}
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground/80 text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{description}</p>
                </div>
                {conversationTone === label && (
                  <div className="w-5 h-5 rounded-full bg-primary/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={12} className="text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Notification Toggle */}
        {notifStatus !== "unsupported" && (
          <section>
            <GlassCard className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell size={20} className="text-primary/70" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground/80 text-sm">毎朝のリマインダー</p>
                <p className="text-xs text-muted-foreground">
                  {notifStatus === "denied"
                    ? "通知がブロックされています（ブラウザ設定から変更）"
                    : isSubscribed
                    ? "毎朝8時にお知らせします"
                    : "やさしいリマインダー"}
                </p>
              </div>
              <button
                onClick={handleToggleNotification}
                disabled={isTogglingNotif || notifStatus === "denied"}
                className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
                  isSubscribed ? "bg-primary/70" : "bg-muted/50"
                }`}
                aria-label="通知トグル"
              >
                {isTogglingNotif ? (
                  <Loader2 size={12} className="absolute inset-0 m-auto animate-spin text-white" />
                ) : (
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      isSubscribed ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                )}
              </button>
            </GlassCard>
          </section>
        )}

        {/* Other Settings */}
        <section className="space-y-3">
          {settingSections.map(({ icon: Icon, label, description }) => (
            <GlassCard key={label} className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                <Icon size={20} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground/80 text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-muted/30 flex items-center justify-center">
                <ArrowLeft size={14} className="text-muted-foreground rotate-180" />
              </div>
            </GlassCard>
          ))}
        </section>

        {/* Pet Status */}
        {pet && (
          <section>
            <GlassCard className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center">
                <Rainbow size={20} className="text-sky-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground/80 text-sm">{pet.name}のステータス</p>
                <p className="text-xs text-muted-foreground">
                  {pet.status === "rainbow_bridge" ? "虹の橋の向こうに" : "一緒に過ごしている"}
                </p>
              </div>
              <button
                onClick={() => setShowStatusModal(true)}
                className="text-xs text-muted-foreground hover:text-foreground/70 transition-colors"
              >
                変更
              </button>
            </GlassCard>
          </section>
        )}

        {/* Status Change Modal */}
        {showStatusModal && pet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
              {pet.status === "rainbow_bridge" ? (
                <>
                  <div className="text-center space-y-3">
                    <p className="text-4xl">🌿</p>
                    <h2 className="font-semibold text-foreground/90 text-base leading-snug">
                      {pet.name}のステータスを<br />「一緒に過ごしている」に戻しますか？
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      いつでもまた変更できます。
                    </p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleStatusChange("alive")}
                      disabled={isUpdatingStatus}
                      className="w-full h-12 rounded-2xl bg-sky-100 hover:bg-sky-200 text-sky-700 font-medium text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {isUpdatingStatus ? <Loader2 size={16} className="animate-spin" /> : "「一緒に過ごしている」に戻す"}
                    </button>
                    <button
                      onClick={() => setShowStatusModal(false)}
                      className="w-full h-10 text-sm text-muted-foreground hover:text-foreground/70 transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center space-y-3">
                    <p className="text-4xl">🌈</p>
                    <h2 className="font-semibold text-foreground/90 text-base leading-snug">
                      {pet.name}が虹の橋へ<br />旅立ったことを記録しますか？
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {pet.name}との思い出を、これからも大切に残していけます。手紙やおはなし機能が使えるようになります。
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      いつでも変更できます
                    </p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleStatusChange("rainbow_bridge")}
                      disabled={isUpdatingStatus}
                      className="w-full h-12 rounded-2xl bg-primary/10 hover:bg-primary/15 text-primary/80 font-medium text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {isUpdatingStatus ? <Loader2 size={16} className="animate-spin" /> : "虹の橋へ旅立ったことを記録する"}
                    </button>
                    <button
                      onClick={() => setShowStatusModal(false)}
                      className="w-full h-10 text-sm text-muted-foreground hover:text-foreground/70 transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Logout */}
        <section>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-sm text-muted-foreground/70 hover:text-destructive/70 hover:bg-destructive/5 transition-colors disabled:opacity-50"
          >
            <LogOut size={16} />
            {isLoggingOut ? "ログアウト中..." : "ログアウト"}
          </button>
        </section>

        {/* Professional Support */}
        <section className="space-y-3">
          <div className="h-px bg-foreground/8" />
          <div className="px-1 space-y-2">
            <p className="text-xs font-medium text-muted-foreground/70">サポートについて</p>
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              このアプリはペットとの思い出を大切にするためのものです。深刻な悲しみや日常生活への影響を感じている場合は、専門家のサポートもご検討ください。
            </p>
            <a
              href="https://www.mhlw.go.jp/mamorouyokokoro/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 underline underline-offset-2 hover:text-muted-foreground/80 transition-colors"
            >
              こころの健康について（厚生労働省）
            </a>
          </div>
        </section>

        {/* Footer Message */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            あなたの思い出は、<br />大切に守られています
          </p>
        </div>
      </main>
    </div>
  )
}
