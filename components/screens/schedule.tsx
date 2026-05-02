"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import type { ScheduleType } from "@/lib/app-context"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, X, Trash2 } from "lucide-react"

const scheduleTypes: { type: ScheduleType; emoji: string; label: string }[] = [
  { type: "hospital",    emoji: "🏥", label: "通院" },
  { type: "trimming",   emoji: "✂️", label: "トリミング" },
  { type: "vaccine",    emoji: "💉", label: "ワクチン" },
  { type: "anniversary", emoji: "🎂", label: "記念日" },
  { type: "other",      emoji: "📝", label: "その他" },
]

function typeInfo(type: ScheduleType) {
  return scheduleTypes.find((t) => t.type === type) ?? scheduleTypes[4]
}

function isUpcoming(date: string) {
  return new Date(date) >= new Date(new Date().toISOString().split("T")[0])
}

export function ScheduleScreen() {
  const { setCurrentScreen, schedules, addSchedule, deleteSchedule } = useApp()
  const [isAdding, setIsAdding] = useState(false)
  const [form, setForm] = useState<{
    type: ScheduleType
    title: string
    date: string
    memo: string
  }>({ type: "hospital", title: "", date: "", memo: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const upcoming = schedules.filter((s) => isUpcoming(s.date))
  const past = schedules.filter((s) => !isUpcoming(s.date))

  const handleSubmit = async () => {
    if (!form.title || !form.date || isSubmitting) return
    setIsSubmitting(true)
    try {
      await addSchedule({
        type: form.type,
        title: form.title,
        date: form.date,
        memo: form.memo || undefined,
      })
      setForm({ type: "hospital", title: "", date: "", memo: "" })
      setIsAdding(false)
    } catch {
      // stay on form
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSchedule(id)
    } catch {
      // silent
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
            <h1 className="flex-1 font-medium text-foreground/90">予定</h1>
            {!isAdding && (
              <button
                aria-label="予定を追加"
                onClick={() => setIsAdding(true)}
                className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary/70 hover:bg-primary/25 transition-colors"
              >
                <Plus size={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Add Form */}
        {isAdding && (
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground/80">新しい予定</h3>
              <button
                aria-label="フォームを閉じる"
                onClick={() => setIsAdding(false)}
                className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-muted-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {/* Type Selector */}
            <div className="flex flex-wrap gap-2">
              {scheduleTypes.map(({ type, emoji, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, type }))}
                  className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 transition-all ${
                    form.type === type
                      ? "bg-primary/20 border border-primary/30 text-foreground/80"
                      : "bg-white/50 border border-white/60 text-muted-foreground"
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <Input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="タイトル（例：定期健診）"
              className="h-12 rounded-xl bg-white/50 border-white/60"
            />
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              className="h-12 rounded-xl bg-white/50 border-white/60"
            />
            <Textarea
              value={form.memo}
              onChange={(e) => setForm((prev) => ({ ...prev, memo: e.target.value }))}
              placeholder="メモ（任意）"
              rows={2}
              className="rounded-xl bg-white/50 border-white/60 resize-none"
            />
            <Button
              onClick={handleSubmit}
              disabled={!form.title || !form.date || isSubmitting}
              className="w-full h-12 rounded-xl bg-primary/80 hover:bg-primary/90"
            >
              {isSubmitting ? "保存中..." : "保存する"}
            </Button>
          </GlassCard>
        )}

        {/* Empty State */}
        {schedules.length === 0 && !isAdding && (
          <div className="py-20 flex flex-col items-center gap-6 text-center">
            <div className="w-20 h-20 rounded-full bg-white/60 backdrop-blur-sm border border-white/50 flex items-center justify-center text-3xl">
              📅
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground/70">予定はまだありません</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                通院やトリミングなど、<br />大切な予定を記録できます
              </p>
            </div>
            <button
              onClick={() => setIsAdding(true)}
              className="px-6 h-12 rounded-2xl bg-primary/15 text-primary/80 font-medium text-sm hover:bg-primary/25 transition-colors"
            >
              予定を追加する
            </button>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-1">
              <span className="text-sm font-medium text-foreground/50">これからの予定</span>
              <div className="flex-1 h-px bg-foreground/10" />
            </div>
            <div className="space-y-3">
              {upcoming.map((schedule) => {
                const info = typeInfo(schedule.type)
                return (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    info={info}
                    onDelete={() => handleDelete(schedule.id)}
                    onRecord={() => setCurrentScreen("timeline")}
                    isPast={false}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Past */}
        {past.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-1">
              <span className="text-sm font-medium text-foreground/40">過去の予定</span>
              <div className="flex-1 h-px bg-foreground/8" />
            </div>
            <div className="space-y-3 opacity-70">
              {past.map((schedule) => {
                const info = typeInfo(schedule.type)
                return (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    info={info}
                    onDelete={() => handleDelete(schedule.id)}
                    onRecord={() => setCurrentScreen("timeline")}
                    isPast
                  />
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

type ScheduleCardProps = {
  schedule: ReturnType<typeof typeInfo> extends never ? never : {
    id: string; type: ScheduleType; title: string; date: string; memo: string | null
  }
  info: { emoji: string; label: string }
  onDelete: () => void
  onRecord: () => void
  isPast: boolean
}

function ScheduleCard({ schedule, info, onDelete, onRecord, isPast }: ScheduleCardProps) {
  return (
    <GlassCard className="space-y-2">
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">{info.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs text-muted-foreground">{info.label}</span>
              <p className="font-medium text-foreground/90 text-sm leading-snug">{schedule.title}</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {new Date(schedule.date).toLocaleDateString("ja-JP", {
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          {schedule.memo && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{schedule.memo}</p>
          )}
        </div>
        <button
          aria-label="予定を削除"
          onClick={onDelete}
          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-destructive/60 hover:bg-destructive/5 transition-colors shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {isPast && (
        <button
          onClick={onRecord}
          className="w-full text-left text-xs text-primary/60 hover:text-primary/80 transition-colors pl-8"
        >
          → 記録を残しますか？
        </button>
      )}
    </GlassCard>
  )
}
