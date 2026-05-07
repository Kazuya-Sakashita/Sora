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
import { UpgradeModal } from "@/components/upgrade-modal"
import { ArrowLeft, Bell, Palette, Lock, MessageCircle, Check, LogOut, Loader2, Sparkles, ExternalLink, Rainbow, Users, Copy, X, BookOpen, FileText, Download, Infinity, Mail, ChevronRight, Pencil } from "lucide-react"
import { Input } from "@/components/ui/input"

type Member = { id: string; userId: string; email: string; role: string; joinedAt: string }
type LetterIndex = { id: string; year: number; month: number; generatedAt: string }
type LetterDetail = { id: string; year: number; month: number; content: string; generatedAt: string }

export function SettingsScreen() {
  const { setCurrentScreen, conversationTone, setConversationTone, pet, updatePetStatus, updatePet } = useApp()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [plan, setPlan] = useState<"FREE" | "PLUS" | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState<string | undefined>(undefined)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [showFamilySection, setShowFamilySection] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false)
  const [copiedInvite, setCopiedInvite] = useState(false)
  const [isRemovingMember, setIsRemovingMember] = useState<string | null>(null)
  const [notifStatus, setNotifStatus] = useState<"granted" | "denied" | "default" | "unsupported" | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isTogglingNotif, setIsTogglingNotif] = useState(false)
  const [letters, setLetters] = useState<LetterIndex[]>([])
  const [openLetter, setOpenLetter] = useState<LetterDetail | null>(null)
  const [isLoadingLetter, setIsLoadingLetter] = useState(false)
  const [onThisDayEnabled, setOnThisDayEnabled] = useState(true)
  const [isTogglingOnThisDay, setIsTogglingOnThisDay] = useState(false)
  const [showPetEdit, setShowPetEdit] = useState(false)
  const [petEditForm, setPetEditForm] = useState({ name: "", birthDate: "", broughtAt: "", species: "" })
  const [isSavingPet, setIsSavingPet] = useState(false)
  const [petEditError, setPetEditError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
    fetch("/api/billing/plan").then((r) => r.json()).then(({ plan }) => setPlan(plan))
    getNotificationStatus().then(setNotifStatus)
    isCurrentlySubscribed().then(setIsSubscribed)
    fetch("/api/settings/on-this-day").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d?.enabled !== undefined) setOnThisDayEnabled(d.enabled)
    })
  }, [])

  useEffect(() => {
    if (plan !== "PLUS" || !pet) return
    fetch(`/api/pets/${pet.id}/letters`)
      .then((r) => r.ok ? r.json() : { letters: [] })
      .then(({ letters }) => setLetters(letters ?? []))
  }, [plan, pet])

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

  const handleOpenFamily = async () => {
    setShowFamilySection(true)
    if (!pet) return
    const res = await fetch(`/api/pets/${pet.id}/members`)
    if (res.ok) {
      const data = await res.json()
      setMembers(data.items ?? [])
    }
  }

  const handleGenerateInvite = async () => {
    if (!pet || isGeneratingInvite) return
    setIsGeneratingInvite(true)
    try {
      const res = await fetch(`/api/pets/${pet.id}/invite`, { method: "POST" })
      const data = await res.json()
      setInviteUrl(data.url)
    } finally {
      setIsGeneratingInvite(false)
    }
  }

  const handleCopyInvite = async () => {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopiedInvite(true)
    setTimeout(() => setCopiedInvite(false), 2000)
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!pet || isRemovingMember) return
    setIsRemovingMember(memberId)
    try {
      await fetch(`/api/pets/${pet.id}/members/${memberId}`, { method: "DELETE" })
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
    } finally {
      setIsRemovingMember(null)
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

  const handleToggleOnThisDay = async () => {
    if (isTogglingOnThisDay) return
    setIsTogglingOnThisDay(true)
    const next = !onThisDayEnabled
    try {
      const res = await fetch("/api/settings/on-this-day", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      })
      if (res.ok) setOnThisDayEnabled(next)
    } finally {
      setIsTogglingOnThisDay(false)
    }
  }

  const handleOpenLetter = async (year: number, month: number) => {
    if (!pet) return
    setIsLoadingLetter(true)
    try {
      const res = await fetch(`/api/pets/${pet.id}/letters/${year}/${month}`)
      if (!res.ok) return
      const { letter } = await res.json()
      setOpenLetter(letter)
    } finally {
      setIsLoadingLetter(false)
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

        {/* Pet Profile Edit */}
        {pet && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-foreground/80">{pet.name}のプロフィール</h2>
              <button
                onClick={() => {
                  setPetEditForm({
                    name: pet.name ?? "",
                    birthDate: pet.birthDate ? new Date(pet.birthDate).toISOString().split("T")[0] : "",
                    broughtAt: pet.broughtAt ?? "",
                    species: pet.species ?? "",
                  })
                  setPetEditError(null)
                  setShowPetEdit((v) => !v)
                }}
                className="flex items-center gap-1 text-xs text-primary/60 hover:text-primary/80 transition-colors"
              >
                <Pencil size={12} />
                編集
              </button>
            </div>
            {showPetEdit && (
              <GlassCard className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">お名前</label>
                  <Input
                    value={petEditForm.name}
                    onChange={(e) => setPetEditForm((p) => ({ ...p, name: e.target.value }))}
                    className="h-10 rounded-xl bg-white/50 border-white/60 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">誕生日</label>
                  <Input
                    type="date"
                    value={petEditForm.birthDate}
                    onChange={(e) => setPetEditForm((p) => ({ ...p, birthDate: e.target.value }))}
                    className="h-10 rounded-xl bg-white/50 border-white/60 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">一緒に暮らし始めた日</label>
                  <Input
                    type="date"
                    value={petEditForm.broughtAt}
                    onChange={(e) => setPetEditForm((p) => ({ ...p, broughtAt: e.target.value }))}
                    className="h-10 rounded-xl bg-white/50 border-white/60 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">種類</label>
                  <div className="flex gap-2 flex-wrap">
                    {(["dog", "cat", "rabbit", "bird", "other"] as const).map((s) => {
                      const labels: Record<string, string> = { dog: "犬", cat: "猫", rabbit: "うさぎ", bird: "鳥", other: "その他" }
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setPetEditForm((p) => ({ ...p, species: p.species === s ? "" : s }))}
                          className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                            petEditForm.species === s
                              ? "bg-primary/20 text-primary/80 border border-primary/30"
                              : "bg-white/50 text-muted-foreground border border-white/60 hover:bg-white/80"
                          }`}
                        >
                          {labels[s]}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {petEditError && <p className="text-xs text-destructive">{petEditError}</p>}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={async () => {
                      if (!petEditForm.name.trim() || isSavingPet) return
                      setIsSavingPet(true)
                      setPetEditError(null)
                      try {
                        await updatePet({
                          name: petEditForm.name.trim(),
                          birthDate: petEditForm.birthDate || undefined,
                          broughtAt: petEditForm.broughtAt || undefined,
                          species: (petEditForm.species || undefined) as "dog" | "cat" | "rabbit" | "bird" | "other" | undefined,
                        })
                        setShowPetEdit(false)
                      } catch {
                        setPetEditError("更新に失敗しました")
                      } finally {
                        setIsSavingPet(false)
                      }
                    }}
                    disabled={!petEditForm.name.trim() || isSavingPet}
                    className="flex items-center gap-1.5 px-4 h-9 rounded-xl bg-primary/80 text-primary-foreground text-xs font-medium disabled:opacity-50 transition-colors"
                  >
                    {isSavingPet ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    保存する
                  </button>
                  <button
                    onClick={() => setShowPetEdit(false)}
                    className="px-4 h-9 rounded-xl bg-white/50 text-muted-foreground text-xs border border-white/50 hover:bg-white/80 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </GlassCard>
            )}
          </section>
        )}

        {/* Plan */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Sparkles size={14} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-foreground/80">Sora+ でできること</h2>
          </div>

          {[
            { icon: Mail, label: "月次AIメモリーレター", desc: "毎月の記録をAIが手紙に", cta: "見てみる →" },
            { icon: BookOpen, label: "月別フォトブック", desc: "毎月の思い出をPDFに", cta: "作ってみる →" },
            { icon: FileText, label: "年次メモリーレポート", desc: "1年間の記録を自動まとめ", cta: "見てみる →" },
            { icon: Download, label: "記念日カード保存", desc: "100日・誕生日を画像に", cta: "保存してみる →" },
            { icon: Infinity, label: "無制限記録", desc: "50件の制限なし", cta: "今すぐ始める →" },
          ].map(({ icon: Icon, label, desc, cta }) => (
            <GlassCard key={label} className="flex items-center gap-4 py-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground/85">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              {plan === "PLUS" ? (
                <span className="shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <Check size={12} className="text-green-600" />
                </span>
              ) : (
                <button
                  onClick={() => { setUpgradeFeature(label); setShowUpgradeModal(true) }}
                  className="shrink-0 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors whitespace-nowrap"
                >
                  {cta}
                </button>
              )}
            </GlassCard>
          ))}

          {plan === "FREE" && (
            <div className={`pt-1 ${process.env.NEXT_PUBLIC_PRICE_YEARLY ? "grid grid-cols-2 gap-2" : "flex"}`}>
              <button
                onClick={() => handleCheckout("month")}
                disabled={isCheckingOut}
                className="flex-1 h-12 rounded-2xl bg-amber-400/90 hover:bg-amber-400 text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
              >
                {isCheckingOut ? <Loader2 size={16} className="animate-spin" /> : `月額 ¥${process.env.NEXT_PUBLIC_PRICE_MONTHLY ?? "480"}`}
              </button>
              {process.env.NEXT_PUBLIC_PRICE_YEARLY && (
                <button
                  onClick={() => handleCheckout("year")}
                  disabled={isCheckingOut}
                  className="h-12 rounded-2xl bg-amber-500/90 hover:bg-amber-500 text-white font-semibold text-sm transition-colors disabled:opacity-60 flex flex-col items-center justify-center leading-tight"
                >
                  <span>年額 ¥{process.env.NEXT_PUBLIC_PRICE_YEARLY}</span>
                  <span className="text-[10px] opacity-80">年間まとめ払いでお得</span>
                </button>
              )}
            </div>
          )}

          {plan === "PLUS" && (
            <GlassCard className="py-3.5">
              <div className="flex items-center gap-3">
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

        {showUpgradeModal && (
          <UpgradeModal featureName={upgradeFeature} onClose={() => setShowUpgradeModal(false)} />
        )}

        {/* Monthly Letter Archive */}
        {plan === "PLUS" && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Mail size={14} className="text-amber-500" />
              <h2 className="text-sm font-semibold text-foreground/80">AIメモリーレター</h2>
            </div>
            {letters.length === 0 ? (
              <GlassCard className="py-5 text-center space-y-1">
                <p className="text-sm text-foreground/70">まだレターがありません</p>
                <p className="text-xs text-muted-foreground">毎月末、記録が3件以上ある月に届きます</p>
              </GlassCard>
            ) : (
              <div className="space-y-2">
                {letters.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => handleOpenLetter(l.year, l.month)}
                    className="w-full"
                  >
                    <GlassCard className="flex items-center gap-4 py-3.5 hover:bg-white/80 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <Mail size={18} className="text-amber-500" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-foreground/85">{l.year}年{l.month}月のレター</p>
                        <p className="text-xs text-muted-foreground">{new Date(l.generatedAt).toLocaleDateString("ja-JP")} 生成</p>
                      </div>
                      <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                    </GlassCard>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {plan === "FREE" && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Mail size={14} className="text-amber-500" />
              <h2 className="text-sm font-semibold text-foreground/80">AIメモリーレター</h2>
            </div>
            <GlassCard className="space-y-3 py-4 relative overflow-hidden">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground/80">{new Date().getFullYear()}年{new Date().getMonth() + 1}月のレター</p>
                <p className="text-xs text-muted-foreground leading-relaxed blur-sm select-none pointer-events-none">
                  今月も〇〇とたくさんの時間を過ごしましたね。〇〇日の散歩の記録や、トリミングの日の様子…毎日の積み重ねがここにあります。Sora より
                </p>
              </div>
              <button
                onClick={() => { setUpgradeFeature("月次AIメモリーレター"); setShowUpgradeModal(true) }}
                className="w-full h-9 rounded-2xl bg-amber-400/90 hover:bg-amber-400 text-white font-semibold text-xs transition-colors"
              >
                Sora+ でレターを受け取る
              </button>
            </GlassCard>
          </section>
        )}

        {/* Letter Modal */}
        {openLetter && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-t-3xl bg-white/97 backdrop-blur-xl border-t border-white/60 shadow-2xl p-6 space-y-5 animate-in slide-in-from-bottom-4 duration-300 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground/90">{openLetter.year}年{openLetter.month}月のレター</p>
                  <p className="text-xs text-muted-foreground">{pet?.name}へ</p>
                </div>
                <button
                  onClick={() => setOpenLetter(null)}
                  className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center"
                >
                  <X size={14} className="text-muted-foreground" />
                </button>
              </div>
              <div className="bg-amber-50/60 rounded-2xl p-5">
                <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">{openLetter.content}</p>
              </div>
            </div>
          </div>
        )}

        {isLoadingLetter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
            <div className="bg-white/90 rounded-2xl p-6">
              <Loader2 size={24} className="animate-spin text-amber-500" />
            </div>
          </div>
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
                  <div className="w-5 h-5 rounded-full bg-primary/80 flex items-center justify-center shrink-0 mt-0.5">
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

        {/* On This Day Toggle */}
        <section>
          <GlassCard className="flex items-center gap-4 py-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell size={20} className="text-primary/70" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground/80 text-sm">あの日の通知</p>
              <p className="text-xs text-muted-foreground">1ヶ月・3ヶ月・1年後に記録を振り返るお知らせ</p>
            </div>
            <button
              onClick={handleToggleOnThisDay}
              disabled={isTogglingOnThisDay}
              className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
                onThisDayEnabled ? "bg-primary/70" : "bg-muted/50"
              }`}
              aria-label="あの日通知トグル"
            >
              {isTogglingOnThisDay ? (
                <Loader2 size={12} className="absolute inset-0 m-auto animate-spin text-white" />
              ) : (
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    onThisDayEnabled ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              )}
            </button>
          </GlassCard>
        </section>

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

        {/* Family Sharing — owner only */}
        {pet?.role === "owner" && (
          <section>
            <GlassCard className="space-y-0 py-0 overflow-hidden">
              <button
                onClick={showFamilySection ? () => setShowFamilySection(false) : handleOpenFamily}
                className="w-full flex items-center gap-4 py-4 px-5"
              >
                <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center">
                  <Users size={20} className="text-sky-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground/80 text-sm">家族を招待する</p>
                  <p className="text-xs text-muted-foreground">一緒に思い出を残す</p>
                </div>
                <ArrowLeft size={14} className={`text-muted-foreground transition-transform ${showFamilySection ? "rotate-90" : "-rotate-90"}`} />
              </button>

              {showFamilySection && (
                <div className="border-t border-white/40 px-5 py-4 space-y-4">
                  {/* Invite link */}
                  <div className="space-y-2">
                    {inviteUrl ? (
                      <div className="flex gap-2">
                        <p className="flex-1 text-xs text-muted-foreground bg-muted/30 rounded-xl px-3 py-2 truncate font-mono">
                          {inviteUrl}
                        </p>
                        <button
                          onClick={handleCopyInvite}
                          className="shrink-0 w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center"
                        >
                          {copiedInvite ? <Check size={14} className="text-sky-600" /> : <Copy size={14} className="text-sky-600" />}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleGenerateInvite}
                        disabled={isGeneratingInvite}
                        className="w-full h-10 rounded-2xl bg-sky-100 hover:bg-sky-200 text-sky-700 font-medium text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {isGeneratingInvite ? <Loader2 size={14} className="animate-spin" /> : "招待リンクを作成"}
                      </button>
                    )}
                    <p className="text-xs text-muted-foreground/60">リンクは24時間有効です</p>
                  </div>

                  {/* Members list */}
                  {members.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">メンバー</p>
                      {members.map((m) => (
                        <div key={m.id} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary/70 text-xs font-medium">
                            {m.email[0].toUpperCase()}
                          </div>
                          <p className="flex-1 text-xs text-foreground/70 truncate">{m.email}</p>
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            disabled={isRemovingMember === m.id}
                            className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive/70 transition-colors disabled:opacity-50"
                          >
                            {isRemovingMember === m.id ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {members.length === 0 && (
                    <p className="text-xs text-muted-foreground/60">まだメンバーがいません</p>
                  )}
                </div>
              )}
            </GlassCard>
          </section>
        )}

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
