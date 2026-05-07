"use client"

import { useState, useEffect, useCallback } from "react"
import { Download, Share2, X, Loader2, LayoutTemplate } from "lucide-react"
import { generateMonthlyShareCard, type ShareCardData, type ShareCardOrientation } from "@/lib/share-card"

interface Props {
  data: ShareCardData
  onClose: () => void
}

export function MonthlyShareCardModal({ data, onClose }: Props) {
  const [orientation, setOrientation] = useState<ShareCardOrientation>("vertical")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [isGenerating, setIsGenerating] = useState(true)
  const [isSharing, setIsSharing] = useState(false)

  const generate = useCallback(async (o: ShareCardOrientation) => {
    setIsGenerating(true)
    setPreviewUrl(null)
    try {
      const b = await generateMonthlyShareCard(data, o)
      setBlob(b)
      setPreviewUrl(URL.createObjectURL(b))
    } catch {
      // silent
    } finally {
      setIsGenerating(false)
    }
  }, [data])

  useEffect(() => {
    generate(orientation)
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orientation])

  const handleDownload = () => {
    if (!blob || !previewUrl) return
    const a = document.createElement("a")
    a.href = previewUrl
    a.download = `sora-${data.label}-${orientation}.png`
    a.click()
  }

  const handleShare = async () => {
    if (!blob) return
    setIsSharing(true)
    try {
      const file = new File([blob], `sora-${data.label}.png`, { type: "image/png" })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${data.petName}と${data.daysCount !== null ? `${data.daysCount}日目` : ""}`,
          text: `${data.label}のふりかえり 📝 ${data.memoryCount}件の思い出 #Sora #ペット記録`,
        })
      } else if (navigator.share) {
        await navigator.share({
          title: `${data.petName}と${data.daysCount !== null ? `${data.daysCount}日目` : ""}`,
          text: `${data.label}のふりかえり 📝 ${data.memoryCount}件の思い出 #Sora #ペット記録`,
        })
      } else {
        handleDownload()
      }
    } catch {
      // user cancelled or unsupported
    } finally {
      setIsSharing(false)
    }
  }

  const toggleOrientation = () => {
    setOrientation((prev) => (prev === "vertical" ? "horizontal" : "vertical"))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe py-3 shrink-0">
        <p className="text-sm font-medium text-white/90">シェアカード</p>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleOrientation}
            className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/15 text-white/80 text-xs font-medium"
            title={orientation === "vertical" ? "横型に切り替え" : "縦型に切り替え"}
          >
            <LayoutTemplate size={13} />
            {orientation === "vertical" ? "9:16" : "16:9"}
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white/80"
            aria-label="閉じる"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0 overflow-hidden">
        {isGenerating ? (
          <div className="flex flex-col items-center gap-3 text-white/70">
            <Loader2 size={32} className="animate-spin" />
            <p className="text-sm">カードを生成中...</p>
          </div>
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt="シェアカードプレビュー"
            className={`object-contain rounded-2xl shadow-2xl ${
              orientation === "vertical"
                ? "max-h-full max-w-[min(100%,360px)]"
                : "max-w-full max-h-[min(100%,320px)]"
            }`}
          />
        ) : (
          <p className="text-white/60 text-sm">生成に失敗しました</p>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 px-4 pb-safe py-4 flex gap-3">
        <button
          onClick={handleDownload}
          disabled={!previewUrl || isGenerating}
          className="flex-1 h-12 rounded-2xl bg-white/15 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <Download size={17} />
          保存する
        </button>
        <button
          onClick={handleShare}
          disabled={!previewUrl || isGenerating || isSharing}
          className="flex-1 h-12 rounded-2xl bg-white text-foreground/80 font-medium flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {isSharing ? <Loader2 size={17} className="animate-spin" /> : <Share2 size={17} />}
          シェアする
        </button>
      </div>
    </div>
  )
}
