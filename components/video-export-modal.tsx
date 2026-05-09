"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X, Download, Share2, Loader2, Film } from "lucide-react"

interface Props {
  petName: string
  photoUrls: string[]     // already-loaded ordered list
  label: string           // "2026年4月"
  onClose: () => void
}

const SLIDE_DURATION_MS = 2000  // each photo visible for 2s
const TRANSITION_MS = 400       // fade between photos
const W = 1080
const H = 1920

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  alpha: number,
  progress: number, // 0→1 ken burns zoom
  petName: string,
  label: string,
) {
  ctx.clearRect(0, 0, W, H)

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, "#fef7f2")
  bg.addColorStop(1, "#f5e8f5")
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Photo with Ken Burns (subtle zoom in)
  ctx.save()
  ctx.globalAlpha = alpha
  const scale = 1 + progress * 0.04
  const sw = img.naturalWidth, sh = img.naturalHeight
  const ar = sw / sh
  const areaAr = W / H
  let sx = 0, sy = 0, ssw = sw, ssh = sh
  if (ar > areaAr) { ssw = sh * areaAr; sx = (sw - ssw) / 2 }
  else { ssh = sw / areaAr; sy = (sh - ssh) / 2 }
  const cx = W / 2, cy = H / 2
  ctx.translate(cx, cy)
  ctx.scale(scale, scale)
  ctx.translate(-cx, -cy)
  ctx.drawImage(img, sx, sy, ssw, ssh, 0, 0, W, H)
  ctx.restore()

  // Bottom gradient overlay
  ctx.save()
  ctx.globalAlpha = alpha
  const grad = ctx.createLinearGradient(0, H * 0.6, 0, H)
  grad.addColorStop(0, "rgba(0,0,0,0)")
  grad.addColorStop(1, "rgba(0,0,0,0.55)")
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)
  ctx.restore()

  // Text
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.textAlign = "center"
  const FONT = `"Noto Sans JP", "Hiragino Sans", sans-serif`
  ctx.font = `500 56px ${FONT}`
  ctx.fillStyle = "rgba(255,255,255,0.90)"
  ctx.fillText(`${petName} と`, W / 2, H - 240)
  ctx.font = `700 48px ${FONT}`
  ctx.fillStyle = "rgba(255,255,255,0.75)"
  ctx.fillText(label, W / 2, H - 168)
  ctx.font = `300 36px ${FONT}`
  ctx.fillStyle = "rgba(255,255,255,0.55)"
  ctx.fillText("Sora", W / 2, H - 100)
  ctx.restore()
}

export function VideoExportModal({ petName, photoUrls, label, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const [images, setImages] = useState<(HTMLImageElement | null)[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [canRecord, setCanRecord] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const startTimeRef = useRef<number>(0)

  // Check MediaRecorder support
  useEffect(() => {
    setCanRecord(
      typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus"),
    )
  }, [])

  // Load images
  useEffect(() => {
    let cancelled = false
    async function load() {
      const loaded = await Promise.all(photoUrls.slice(0, 9).map(loadImage))
      if (!cancelled) {
        setImages(loaded)
        setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [photoUrls])

  // Animate slideshow on canvas
  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || images.length === 0) return
    const ctx = canvas.getContext("2d")!
    const elapsed = performance.now() - startTimeRef.current
    const totalPerSlide = SLIDE_DURATION_MS + TRANSITION_MS
    const slideIdx = Math.floor(elapsed / totalPerSlide) % images.length
    const slideElapsed = elapsed % totalPerSlide
    const progress = Math.min(slideElapsed / SLIDE_DURATION_MS, 1)

    // Alpha: fade in/out at transitions
    let alpha = 1
    if (slideElapsed < TRANSITION_MS) alpha = slideElapsed / TRANSITION_MS
    else if (slideElapsed > SLIDE_DURATION_MS) alpha = 1 - (slideElapsed - SLIDE_DURATION_MS) / TRANSITION_MS

    setCurrentSlide(slideIdx)
    const img = images[slideIdx]
    if (img) drawFrame(ctx, img, alpha, progress, petName, label)

    animFrameRef.current = requestAnimationFrame(animate)
  }, [images, petName, label])

  useEffect(() => {
    if (isLoading || images.length === 0) return
    startTimeRef.current = performance.now()
    animFrameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [isLoading, images, animate])

  const handleRecord = async () => {
    const canvas = canvasRef.current
    if (!canvas || !canRecord) return
    setIsRecording(true)
    setVideoBlob(null)
    setVideoUrl(null)

    const totalDuration = images.filter(Boolean).length * (SLIDE_DURATION_MS + TRANSITION_MS) + TRANSITION_MS
    const stream = canvas.captureStream(30)
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9,opus" })
    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" })
      const url = URL.createObjectURL(blob)
      setVideoBlob(blob)
      setVideoUrl(url)
      setIsRecording(false)
    }

    // Restart animation from beginning for recording
    cancelAnimationFrame(animFrameRef.current)
    startTimeRef.current = performance.now()
    recorder.start(100)
    animFrameRef.current = requestAnimationFrame(animate)

    setTimeout(() => {
      recorder.stop()
      cancelAnimationFrame(animFrameRef.current)
      startTimeRef.current = performance.now()
      animFrameRef.current = requestAnimationFrame(animate)
    }, totalDuration)
  }

  const handleDownload = () => {
    if (!videoBlob || !videoUrl) return
    const a = document.createElement("a")
    a.href = videoUrl
    a.download = `sora-${label}-slideshow.webm`
    a.click()
  }

  const handleShare = async () => {
    if (!videoBlob) return
    const file = new File([videoBlob], `sora-${label}.webm`, { type: "video/webm" })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: `${petName}との${label}` }).catch(() => {})
    } else {
      handleDownload()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe py-3 shrink-0">
        <div className="flex items-center gap-2 text-white/80">
          <Film size={15} />
          <p className="text-sm font-medium">スライドショー動画</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white/80"
          aria-label="閉じる"
        >
          <X size={16} />
        </button>
      </div>

      {/* Canvas Preview */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 text-white/70">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">写真を読み込み中...</p>
          </div>
        ) : images.filter(Boolean).length === 0 ? (
          <p className="text-white/60 text-sm">写真付きの記録がありません</p>
        ) : (
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="max-h-full max-w-[min(100%,240px)] rounded-2xl shadow-2xl object-contain"
          />
        )}
      </div>

      {/* Slide indicator */}
      {images.filter(Boolean).length > 1 && !isLoading && (
        <div className="flex justify-center gap-1.5 py-2 shrink-0">
          {images.filter(Boolean).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${i === currentSlide ? "w-4 bg-white/80" : "w-1.5 bg-white/30"}`}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="shrink-0 px-4 pb-safe py-4 space-y-2">
        {!canRecord && !isLoading && images.filter(Boolean).length > 0 && (
          <p className="text-center text-xs text-white/50 pb-1">
            スクリーン録画で保存してSNSに投稿できます
          </p>
        )}

        {canRecord && !videoUrl && (
          <button
            onClick={handleRecord}
            disabled={isRecording || isLoading}
            className="w-full h-12 rounded-2xl bg-white/15 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isRecording ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                録画中...
              </>
            ) : (
              <>
                <Film size={16} />
                動画を生成する
              </>
            )}
          </button>
        )}

        {videoUrl && (
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 h-12 rounded-2xl bg-white/15 text-white font-medium flex items-center justify-center gap-2"
            >
              <Download size={16} />
              保存
            </button>
            <button
              onClick={handleShare}
              className="flex-1 h-12 rounded-2xl bg-white text-foreground/80 font-medium flex items-center justify-center gap-2"
            >
              <Share2 size={16} />
              シェア
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full h-10 rounded-2xl text-white/50 text-sm"
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
