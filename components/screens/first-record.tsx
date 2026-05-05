"use client"

import { useRef, useState } from "react"
import { useApp } from "@/lib/app-context"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Camera, Loader2 } from "lucide-react"
import { uploadPhoto } from "@/lib/storage"

const MOOD_OPTIONS = [
  { value: "happy", emoji: "🥰", label: "うれしい" },
  { value: "calm", emoji: "😌", label: "おだやか" },
  { value: "fun", emoji: "😄", label: "笑った" },
  { value: "worried", emoji: "😟", label: "心配" },
  { value: "loving", emoji: "💝", label: "愛おしい" },
] as const

type MoodValue = (typeof MOOD_OPTIONS)[number]["value"]

export function FirstRecordScreen() {
  const { pet, addMemory, setCurrentScreen } = useApp()
  const [title, setTitle] = useState("")
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [moodTag, setMoodTag] = useState<MoodValue | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [aiReaction, setAiReaction] = useState<string | null>(null)
  const [isReactionLoading, setIsReactionLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleSave = async () => {
    if (!title.trim()) {
      setTitleError("タイトルを入力してください")
      return
    }
    if (isSubmitting) return
    setIsSubmitting(true)
    setTitleError(null)
    try {
      const saved = await addMemory({
        title: title.trim(),
        date: new Date().toISOString().split("T")[0],
        photoUrls: photoUrl ? [photoUrl] : undefined,
        moodTag: moodTag ?? undefined,
      })
      setIsReactionLoading(true)
      setAiReaction("")
      if (pet) {
        fetch(`/api/pets/${pet.id}/memories/${saved.id}/reaction`, { method: "POST" })
          .then((r) => r.ok ? r.json() : null)
          .then((d) => setAiReaction(d?.reaction ?? ""))
          .catch(() => setAiReaction(""))
          .finally(() => setIsReactionLoading(false))
      } else {
        setIsReactionLoading(false)
        setAiReaction("")
      }
    } catch {
      // stay on form
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isReactionLoading || aiReaction !== null) {
    return (
      <div className="min-h-screen flex items-end sm:items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl p-6 space-y-4 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <p className="font-medium text-foreground/90 text-sm">最初の記録を残せました</p>
          </div>
          {isReactionLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-1">
              <Loader2 size={15} className="animate-spin shrink-0" />
              <span>Soraが読んでいます...</span>
            </div>
          ) : aiReaction ? (
            <p className="text-sm text-foreground/80 leading-relaxed">{aiReaction}</p>
          ) : null}
          <button
            onClick={() => setCurrentScreen("home")}
            className="w-full h-12 rounded-2xl bg-primary/80 text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            ホームへ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-safe">
      <header className="px-6 pt-safe">
        <div className="h-16 flex items-center">
          <div />
        </div>
      </header>

      <main className="px-6 pb-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-xl font-medium text-foreground/90">
            {pet ? `${pet.name}との最初の記録を残しましょう` : "最初の記録を残しましょう"}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            小さな記録が、かけがえのない物語になります。
          </p>
        </div>

        <GlassCard className="space-y-5">
          {/* Photo */}
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
          {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}

          {/* Title */}
          <div className="space-y-1.5">
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setTitleError(null) }}
              placeholder={pet ? `今日の${pet.name}` : "タイトル"}
              className="h-12 rounded-xl bg-white/50 border-white/60"
            />
            {titleError && <p className="text-xs text-destructive">{titleError}</p>}
          </div>

          {/* Mood */}
          <div className="flex gap-2 flex-wrap">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMoodTag(moodTag === m.value ? null : m.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
                  moodTag === m.value
                    ? "bg-primary/20 text-primary/80 border border-primary/30"
                    : "bg-white/50 text-muted-foreground border border-white/60 hover:bg-white/80"
                }`}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
        </GlassCard>

        <Button
          onClick={handleSave}
          disabled={!title.trim() || isSubmitting || isUploading}
          className="w-full h-14 rounded-2xl bg-primary/80 hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-medium text-base"
        >
          {isSubmitting ? "保存中..." : "記録する"}
        </Button>
      </main>
    </div>
  )
}
