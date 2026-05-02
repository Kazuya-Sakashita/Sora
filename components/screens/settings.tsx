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
import { ArrowLeft, Bell, Palette, Lock, MessageCircle, Check, LogOut, Loader2 } from "lucide-react"

export function SettingsScreen() {
  const { setCurrentScreen, conversationTone, setConversationTone } = useApp()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [notifStatus, setNotifStatus] = useState<"granted" | "denied" | "default" | "unsupported" | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isTogglingNotif, setIsTogglingNotif] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
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
            </GlassCard>
          </section>
        )}

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
