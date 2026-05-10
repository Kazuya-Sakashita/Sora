"use client"

import { useState, useRef } from "react"
import { Camera, Loader2, X, Check } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { uploadPhoto } from "@/lib/storage"

interface Props {
  onClose: () => void
  onSaved?: (memoryId: string) => void
}

export function QuickRecordSheet({ onClose, onSaved }: Props) {
  const { pet, addMemory } = useApp()
  const [title, setTitle] = useState("")
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [reaction, setReaction] = useState<string | null>(null)
  const [isLoadingReaction, setIsLoadingReaction] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const url = await uploadPhoto(file, "memories")
      setPhotoUrl(url)
    } catch {
      // silent
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim() || isSaving || !pet) return
    setIsSaving(true)
    try {
      const memory = await addMemory({
        title: title.trim(),
        date: new Date().toISOString().split("T")[0],
        photoUrls: photoUrl ? [photoUrl] : undefined,
      })
      setSaved(true)
      onSaved?.(memory.id)
      setIsLoadingReaction(true)
      fetch(`/api/pets/${pet.id}/memories/${memory.id}/reaction`, { method: "POST" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setReaction(d?.reaction ?? null))
        .catch(() => setReaction(null))
        .finally(() => setIsLoadingReaction(false))
    } catch {
      // silent
    } finally {
      setIsSaving(false)
    }
  }

  // After saved state — show reaction then close
  if (saved) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="mx-2 mb-2 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/70 shadow-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Check size={16} className="text-primary/70" />
            </div>
            <p className="text-sm font-medium text-foreground/80">「{title}」を残しました</p>
          </div>

          {(isLoadingReaction || reaction) && (
            <div className="pl-11">
              {isLoadingReaction ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 size={13} className="animate-spin" />
                  <span className="text-xs">Soraが読んでいます…</span>
                </div>
              ) : (
                <p className="text-sm text-foreground/75 leading-relaxed">{reaction}</p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full h-10 rounded-2xl bg-black/5 text-sm text-foreground/60 font-medium"
          >
            閉じる
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="mx-2 mb-2 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/70 shadow-2xl overflow-hidden">
          {/* Photo preview */}
          {photoUrl && (
            <div className="relative">
              <img
                src={photoUrl}
                alt="選択した写真"
                className="w-full h-40 object-cover"
              />
              <button
                type="button"
                onClick={() => setPhotoUrl(null)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white"
                aria-label="写真を外す"
              >
                <X size={13} />
              </button>
            </div>
          )}

          <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">今日の思い出を残す</p>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center text-muted-foreground"
                aria-label="閉じる"
              >
                <X size={14} />
              </button>
            </div>

            {/* Title input */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSave() }}
              placeholder={`${pet?.name ?? "うちの子"}との今日は？`}
              autoFocus
              className="w-full bg-transparent text-base font-medium text-foreground/85 placeholder:text-muted-foreground/60 outline-none py-1"
              maxLength={100}
            />

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              {/* Photo button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center text-muted-foreground disabled:opacity-50"
                aria-label="写真を追加"
              >
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />

              {/* Save button */}
              <button
                type="button"
                onClick={handleSave}
                disabled={!title.trim() || isSaving || isUploading}
                className="flex-1 h-10 rounded-2xl bg-primary/90 text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : null}
                残す
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
