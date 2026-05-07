"use client"

import { useRef, useState } from "react"
import { useApp } from "@/lib/app-context"
import { GlassCard } from "@/components/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Camera, ArrowLeft, Loader2 } from "lucide-react"
import { uploadPhoto } from "@/lib/storage"

export function ProfileCreateScreen() {
  const { setCurrentScreen, createPet } = useApp()
  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    personality: "",
    favorites: "",
    broughtAt: "",
    birthDate: "",
    species: "",
  })
  const [photo, setPhoto] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setUploadError(null)
    try {
      const url = await uploadPhoto(file, "pets")
      setPhoto(url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "写真のアップロードに失敗しました")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name || isSubmitting) return
    setIsSubmitting(true)
    try {
      await createPet({
        name: formData.name,
        nickname: formData.nickname || undefined,
        personality: formData.personality || undefined,
        favorites: formData.favorites || undefined,
        broughtAt: formData.broughtAt || undefined,
        birthDate: formData.birthDate || undefined,
        species: (formData.species || undefined) as "dog" | "cat" | "rabbit" | "bird" | "other" | undefined,
        photoUrl: photo || undefined,
      })
    } catch {
      // stay on form if error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pb-safe">
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 pt-safe">
        <div className="h-14 flex items-center">
          <button
            onClick={() => setCurrentScreen("onboarding")}
            className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center text-muted-foreground"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
      </header>

      <main className="px-6 pb-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-xl font-medium text-foreground/90 mb-2">
            あなたの大切な子を教えてください
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            少しずつで大丈夫です。<br />わかる範囲で教えてください
          </p>
        </div>

        <GlassCard className="space-y-6">
          {/* Photo Upload */}
          <div className="flex flex-col items-center gap-2">
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
              className="w-28 h-28 rounded-3xl bg-linear-to-br from-white/80 to-white/40 border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 transition-colors overflow-hidden disabled:opacity-60"
            >
              {isUploading ? (
                <Loader2 size={24} className="text-primary/50 animate-spin" />
              ) : photo ? (
                <img src={photo} alt="Pet" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera size={24} className="text-primary/50" />
                  <span className="text-xs">写真を追加する</span>
                </>
              )}
            </button>
            {uploadError && (
              <p className="text-xs text-destructive text-center">{uploadError}</p>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm text-foreground/70 font-medium">
                お名前
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="例：ポチ、ミケ"
                className="h-12 rounded-xl bg-white/50 border-white/60 focus:border-primary/30 focus:ring-primary/20 placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-foreground/70 font-medium">
                呼び方（ニックネーム）
              </label>
              <Input
                value={formData.nickname}
                onChange={(e) => setFormData((prev) => ({ ...prev, nickname: e.target.value }))}
                placeholder="例：ポチくん、みーちゃん"
                className="h-12 rounded-xl bg-white/50 border-white/60 focus:border-primary/30 focus:ring-primary/20 placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-foreground/70 font-medium">
                性格
              </label>
              <Input
                value={formData.personality}
                onChange={(e) => setFormData((prev) => ({ ...prev, personality: e.target.value }))}
                placeholder="例：甘えんぼ、元気、マイペース"
                className="h-12 rounded-xl bg-white/50 border-white/60 focus:border-primary/30 focus:ring-primary/20 placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-foreground/70 font-medium">
                好きなこと
              </label>
              <Input
                value={formData.favorites}
                onChange={(e) => setFormData((prev) => ({ ...prev, favorites: e.target.value }))}
                placeholder="例：お散歩、ひなたぼっこ"
                className="h-12 rounded-xl bg-white/50 border-white/60 focus:border-primary/30 focus:ring-primary/20 placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-foreground/70 font-medium">
                一緒に暮らし始めた日
              </label>
              <Input
                type="date"
                value={formData.broughtAt}
                onChange={(e) => setFormData((prev) => ({ ...prev, broughtAt: e.target.value }))}
                className="h-12 rounded-xl bg-white/50 border-white/60 focus:border-primary/30 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-foreground/70 font-medium">
                誕生日（任意）
              </label>
              <Input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, birthDate: e.target.value }))}
                className="h-12 rounded-xl bg-white/50 border-white/60 focus:border-primary/30 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-foreground/70 font-medium">
                種類（任意）
              </label>
              <div className="flex gap-2 flex-wrap">
                {(["dog", "cat", "rabbit", "bird", "other"] as const).map((s) => {
                  const labels: Record<string, string> = { dog: "犬", cat: "猫", rabbit: "うさぎ", bird: "鳥", other: "その他" }
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, species: prev.species === s ? "" : s }))}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        formData.species === s
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
          </div>
        </GlassCard>

        {/* Submit Button */}
        <div className="mt-8">
          <Button
            onClick={handleSubmit}
            disabled={!formData.name || isSubmitting}
            className="w-full h-14 rounded-2xl bg-primary/80 hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-medium text-base shadow-lg shadow-primary/10 transition-all"
          >
            {isSubmitting ? "登録中..." : "この子を登録する"}
          </Button>
        </div>
      </main>
    </div>
  )
}
