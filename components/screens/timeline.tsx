"use client"

import { useRef, useState, useEffect } from "react"
import { useApp } from "@/lib/app-context"
import type { Memory } from "@/lib/app-context"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, X, Camera, Loader2, Image, LayoutList, CalendarDays, Share2, FileText, BookOpen } from "lucide-react"
import { uploadPhoto } from "@/lib/storage"
import { MemoryCalendar } from "@/components/memory-calendar"
import { shareMemory } from "@/lib/share"
import { UpgradeModal } from "@/components/upgrade-modal"

const moodMap: Record<string, { emoji: string; label: string }> = {
  happy: { emoji: "🥰", label: "うれしい" },
  calm: { emoji: "😌", label: "おだやか" },
  fun: { emoji: "😄", label: "笑った" },
  worried: { emoji: "😟", label: "心配" },
  loving: { emoji: "💝", label: "愛おしい" },
}

function groupByMonth(memories: Memory[]): { label: string; year: number; month: number; items: Memory[] }[] {
  const sorted = [...memories].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const groups: { label: string; year: number; month: number; items: Memory[] }[] = []
  const indexMap = new Map<string, number>()

  for (const memory of sorted) {
    const d = new Date(memory.date)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const key = `${year}年${month}月`
    if (!indexMap.has(key)) {
      indexMap.set(key, groups.length)
      groups.push({ label: key, year, month, items: [] })
    }
    groups[indexMap.get(key)!].items.push(memory)
  }
  return groups
}

export function TimelineScreen() {
  const { setCurrentScreen, pet, memories, memoriesTotal, addMemory, loadMoreMemories, isLoadingMore } = useApp()
  const [isAdding, setIsAdding] = useState(false)
  const [newMemory, setNewMemory] = useState({ title: "", description: "" })
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [shareToast, setShareToast] = useState<"shared" | "copied" | null>(null)
  const [isDownloadingReport, setIsDownloadingReport] = useState(false)
  const [downloadingPhotobook, setDownloadingPhotobook] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [view, setView] = useState<"list" | "calendar">("list")
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [scrollTarget, setScrollTarget] = useState<string | null>(null)
  const [plan, setPlan] = useState<"FREE" | "PLUS" | null>(null)

  useEffect(() => {
    fetch("/api/billing/plan")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.plan) setPlan(d.plan) })
      .catch(() => {})
  }, [])

  const recordedDates = new Set(memories.map((m) => m.date))
  const hasPhotoDates = new Set(
    memories.filter((m) => m.photoUrls.length > 0).map((m) => m.date)
  )

  useEffect(() => {
    if (scrollTarget && view === "list") {
      const el = document.getElementById(`memory-${scrollTarget}`)
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
      setScrollTarget(null)
    }
  }, [scrollTarget, view])

  const handleDownloadReport = async () => {
    if (!pet || isDownloadingReport) return
    setIsDownloadingReport(true)
    const year = new Date().getFullYear() - 1
    try {
      const res = await fetch(`/api/pets/${pet.id}/report?year=${year}`)
      if (res.status === 402) { setShowUpgradeModal(true); return }
      if (res.status === 404) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `sora-${year}-report.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsDownloadingReport(false)
    }
  }

  const handleDownloadPhotobook = async (label: string, year: number, month: number) => {
    if (!pet || downloadingPhotobook) return
    setDownloadingPhotobook(label)
    try {
      const res = await fetch(`/api/pets/${pet.id}/photobook?year=${year}&month=${month}`)
      if (res.status === 402) { setShowUpgradeModal(true); return }
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `sora-${pet.name}-${year}-${String(month).padStart(2, "0")}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloadingPhotobook(null)
    }
  }

  const handleShare = async (memoryId: string, title: string) => {
    const result = await shareMemory(memoryId, title)
    setShareToast(result)
    setTimeout(() => setShareToast(null), 2500)
  }

  const handleCalendarDayClick = (dateStr: string) => {
    setView("list")
    setScrollTarget(dateStr)
  }

  const handlePrevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }

  const handleNextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setUploadError(null)
    try {
      const url = await uploadPhoto(file, "memories")
      setPhotoUrl(url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "写真のアップロードに失敗しました")
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddMemory = async () => {
    if (!newMemory.title || isSubmitting) return
    setIsSubmitting(true)
    const newTotal = memoriesTotal + 1
    try {
      await addMemory({
        title: newMemory.title,
        description: newMemory.description || undefined,
        date: new Date().toISOString().split("T")[0],
        photoUrls: photoUrl ? [photoUrl] : undefined,
      })
      setNewMemory({ title: "", description: "" })
      setPhotoUrl(null)
      setIsAdding(false)
      setShowFeedback(true)
      setTimeout(() => setShowFeedback(false), 3000)
    } catch (e) {
      if (e instanceof Error && e.message === "PLAN_LIMIT") {
        setShowUpgradeModal(true)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const groups = groupByMonth(memories)

  return (
    <div className="min-h-screen pb-safe">
      {/* Header */}
      {/* 上限カウントダウンバナー（Free + 20件以上使用時） */}
      {plan === "FREE" && memoriesTotal >= 20 && (() => {
        const remaining = 50 - memoriesTotal
        if (remaining <= 0) return null
        const isUrgent = remaining <= 10
        const isWarning = remaining <= 20
        return (
          <div className={`px-4 py-2 flex items-center justify-between gap-3 ${isUrgent ? "bg-orange-50 border-b border-orange-200" : "bg-amber-50/80 border-b border-amber-100"}`}>
            <p className={`text-xs font-medium ${isUrgent ? "text-orange-700" : "text-amber-700"}`}>
              {isUrgent
                ? `残り${remaining}件！記録が上限に近づいています`
                : `残り${remaining}件 / Free プラン`}
            </p>
            {isUrgent && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="shrink-0 text-xs font-semibold text-orange-600 underline underline-offset-2"
              >
                アップグレード
              </button>
            )}
            {isWarning && !isUrgent && (
              <span className="shrink-0 text-xs text-amber-500">Sora+ で無制限に</span>
            )}
          </div>
        )
      })()}

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
            <h1 className="flex-1 font-medium text-foreground/90">思い出</h1>
            {!isAdding && (
              <>
                <button
                  aria-label={view === "list" ? "カレンダービューに切り替え" : "リストビューに切り替え"}
                  onClick={() => setView(v => v === "list" ? "calendar" : "list")}
                  className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center text-muted-foreground hover:bg-white/80 transition-colors"
                >
                  {view === "list" ? <CalendarDays size={18} /> : <LayoutList size={18} />}
                </button>
                <button
                  aria-label="思い出を追加"
                  onClick={() => { setIsAdding(true); setView("list") }}
                  className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary/70 hover:bg-primary/25 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Add Memory Form */}
        {isAdding && (
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground/80">新しい思い出</h3>
              <button
                aria-label="フォームを閉じる"
                onClick={() => { setIsAdding(false); setPhotoUrl(null) }}
                className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-muted-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full aspect-4/3 rounded-xl bg-white/40 border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 transition-colors overflow-hidden disabled:opacity-60"
            >
              {isUploading ? (
                <Loader2 size={28} className="text-primary/50 animate-spin" />
              ) : photoUrl ? (
                <img src={photoUrl} alt="Memory" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera size={28} className="text-primary/40" />
                  <span className="text-xs">写真を追加する（任意）</span>
                </>
              )}
            </button>
            {uploadError && (
              <p className="text-xs text-destructive">{uploadError}</p>
            )}

            <Input
              value={newMemory.title}
              onChange={(e) => setNewMemory((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="タイトル（例：いっしょにお散歩した日）"
              className="h-12 rounded-xl bg-white/50 border-white/60"
            />
            <Textarea
              value={newMemory.description}
              onChange={(e) => setNewMemory((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="その時の思い出を少しだけ..."
              rows={3}
              className="rounded-xl bg-white/50 border-white/60 resize-none"
            />
            <Button
              onClick={handleAddMemory}
              disabled={!newMemory.title || isSubmitting || isUploading}
              className="w-full h-12 rounded-xl bg-primary/80 hover:bg-primary/90"
            >
              {isSubmitting ? "保存中..." : "保存する"}
            </Button>
          </GlassCard>
        )}

        {/* Calendar View */}
        {view === "calendar" && (
          <MemoryCalendar
            year={calYear}
            month={calMonth}
            recordedDates={recordedDates}
            hasPhotoDates={hasPhotoDates}
            onDayClick={handleCalendarDayClick}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />
        )}

        {/* Empty State */}
        {memories.length === 0 && !isAdding && view === "list" && (
          <div className="py-20 flex flex-col items-center gap-6 text-center">
            <div className="w-20 h-20 rounded-full bg-white/60 backdrop-blur-sm border border-white/50 flex items-center justify-center">
              <Image size={32} className="text-primary/40" />
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground/70">
                まだ思い出がありません
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {pet ? `${pet.name}との最初の思い出を\n残してみませんか？` : "最初の思い出を\n残してみませんか？"}
              </p>
            </div>
            <button
              onClick={() => setIsAdding(true)}
              className="px-6 h-12 rounded-2xl bg-primary/15 text-primary/80 font-medium text-sm hover:bg-primary/25 transition-colors"
            >
              思い出を記録する
            </button>
          </div>
        )}

        {/* Monthly Groups */}
        {view === "list" && groups.map((group) => (
          <div key={group.label} className="space-y-3">
            {/* Month Header */}
            <div className="flex items-center gap-3 px-1">
              <span className="text-sm font-medium text-foreground/50">{group.label}</span>
              <div className="flex-1 h-px bg-foreground/10" />
              <button
                onClick={() => handleDownloadPhotobook(group.label, group.year, group.month)}
                disabled={downloadingPhotobook === group.label}
                aria-label={`${group.label}のフォトブックを作る`}
                className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-primary/60 transition-colors disabled:opacity-50"
              >
                {downloadingPhotobook === group.label
                  ? <Loader2 size={12} className="animate-spin" />
                  : <BookOpen size={12} />}
                <span className="hidden sm:inline">フォトブック</span>
              </button>
            </div>

            {/* Memory Cards */}
            <div className="space-y-3">
              {group.items.map((memory) => (
                <div
                  key={memory.id}
                  id={`memory-${memory.date}`}
                  className="rounded-3xl overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
                >
                  {/* Photo */}
                  {memory.photoUrls?.[0] ? (
                    <div className="aspect-4/3 overflow-hidden">
                      <img
                        src={memory.photoUrls[0]}
                        alt={memory.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-4/3 bg-linear-to-br from-white/80 to-accent/20 flex items-center justify-center">
                      <span className="text-4xl opacity-30">🐾</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-foreground/90 leading-snug">{memory.title}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-muted-foreground mt-0.5">
                          {new Date(memory.date).toLocaleDateString("ja-JP", {
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                        <button
                          aria-label="シェアする"
                          onClick={() => handleShare(memory.id, memory.title)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-black/5 transition-colors"
                        >
                          <Share2 size={15} />
                        </button>
                      </div>
                    </div>

                    {memory.moodTag && moodMap[memory.moodTag] && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/30 text-xs text-foreground/60">
                        {moodMap[memory.moodTag].emoji} {moodMap[memory.moodTag].label}
                      </span>
                    )}

                    {memory.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {memory.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Annual Report */}
        {view === "list" && memories.length > 0 && (
          <div className="flex justify-center pt-1 pb-2">
            <button
              onClick={handleDownloadReport}
              disabled={isDownloadingReport}
              className="flex items-center gap-2 px-5 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-60"
            >
              {isDownloadingReport ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <FileText size={15} />
              )}
              {new Date().getFullYear() - 1}年の思い出レポート
            </button>
          </div>
        )}

        {/* Load More */}
        {view === "list" && memories.length < memoriesTotal && (
          <div className="flex justify-center pt-2 pb-4">
            <button
              onClick={loadMoreMemories}
              disabled={isLoadingMore}
              className="px-6 h-11 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 text-sm text-muted-foreground hover:bg-white/80 transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {isLoadingMore ? (
                <><Loader2 size={16} className="animate-spin" />読み込み中...</>
              ) : (
                `もっと見る（残り ${memoriesTotal - memories.length}件）`
              )}
            </button>
          </div>
        )}
      </main>

      {/* Upgrade モーダル */}
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}

      {/* シェアトースト */}
      {shareToast && (
        <div className="fixed bottom-8 inset-x-4 max-w-sm mx-auto z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-none">
          <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.10)] px-6 py-4 flex items-center gap-3">
            <span className="text-xl">{shareToast === "shared" ? "✈️" : "🔗"}</span>
            <p className="text-sm font-medium text-foreground/90">
              {shareToast === "shared" ? "シェアしました" : "URLをコピーしました"}
            </p>
          </div>
        </div>
      )}

      {/* 保存完了フィードバック */}
      {showFeedback && (
        <button
          aria-label="フィードバックを閉じる"
          onClick={() => setShowFeedback(false)}
          className="fixed bottom-8 inset-x-4 max-w-sm mx-auto z-50 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.10)] px-6 py-4 flex items-center gap-4">
            <span className="text-2xl">✨</span>
            <div className="text-left">
              <p className="font-medium text-foreground/90 text-sm">残せました</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pet ? `${pet.name}との今日が、ここに残りました。` : "今日の思い出が、ずっとここにあります。"}
              </p>
            </div>
          </div>
        </button>
      )}
    </div>
  )
}
