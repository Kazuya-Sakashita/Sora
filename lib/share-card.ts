export type ShareCardData = {
  petName: string
  daysCount: number | null
  label: string // "2026年4月"
  memoryCount: number
  photoCount: number
  topMoodLabel: string | null
  coverPhotoUrl: string | null
}

export type ShareCardOrientation = "vertical" | "horizontal"

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const imgRatio = img.naturalWidth / img.naturalHeight
  const areaRatio = dw / dh
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight
  if (imgRatio > areaRatio) {
    sw = img.naturalHeight * areaRatio
    sx = (img.naturalWidth - sw) / 2
  } else {
    sh = img.naturalWidth / areaRatio
    sy = (img.naturalHeight - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}

export async function generateMonthlyShareCard(
  data: ShareCardData,
  orientation: ShareCardOrientation = "vertical",
): Promise<Blob> {
  const W = orientation === "vertical" ? 1080 : 1920
  const H = orientation === "vertical" ? 1920 : 1080

  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")!

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, W * 0.6, H)
  bgGrad.addColorStop(0, "#fef7f2")
  bgGrad.addColorStop(1, "#f5e8f5")
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  const photoAreaH = orientation === "vertical" ? Math.round(H * 0.56) : H

  let petImg: HTMLImageElement | null = null
  if (data.coverPhotoUrl) {
    petImg = await loadImage(data.coverPhotoUrl)
  }

  if (petImg) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, W, photoAreaH)
    ctx.clip()
    drawCoverImage(ctx, petImg, 0, 0, W, photoAreaH)
    ctx.restore()

    // Fade photo into background
    const fadeH = Math.round(H * 0.22)
    const fadeGrad = ctx.createLinearGradient(0, photoAreaH - fadeH, 0, photoAreaH + 10)
    fadeGrad.addColorStop(0, "rgba(254,247,242,0)")
    fadeGrad.addColorStop(1, "#fef7f2")
    ctx.fillStyle = fadeGrad
    ctx.fillRect(0, photoAreaH - fadeH, W, fadeH + 10)
  } else {
    // No photo — draw decorative circle
    const cx = W / 2, cy = photoAreaH / 2
    const circleGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.round(W * 0.42))
    circleGrad.addColorStop(0, "rgba(220,190,230,0.35)")
    circleGrad.addColorStop(1, "rgba(220,190,230,0)")
    ctx.fillStyle = circleGrad
    ctx.beginPath()
    ctx.arc(cx, cy, Math.round(W * 0.42), 0, Math.PI * 2)
    ctx.fill()
    // Paw print placeholder emoji
    ctx.font = `${Math.round(W * 0.18)}px serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.globalAlpha = 0.18
    ctx.fillStyle = "#8b5e8b"
    ctx.fillText("🐾", cx, cy)
    ctx.globalAlpha = 1
    ctx.textBaseline = "alphabetic"
  }

  // --- Text section ---
  const FONT = `"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif`
  const s = orientation === "vertical" ? 1 : 0.56 // scale

  ctx.textAlign = "center"

  const baseY = orientation === "vertical" ? photoAreaH + Math.round(H * 0.032) : 80

  // Pet name sub-label
  ctx.font = `500 ${Math.round(52 * s)}px ${FONT}`
  ctx.fillStyle = "rgba(90,55,90,0.70)"
  ctx.fillText(`${data.petName} と`, W / 2, baseY + Math.round(70 * s))

  // Days count — headline
  if (data.daysCount !== null) {
    ctx.font = `700 ${Math.round(155 * s)}px ${FONT}`
    ctx.fillStyle = "rgba(70,35,80,0.88)"
    ctx.fillText(`${data.daysCount.toLocaleString("ja-JP")} 日目`, W / 2, baseY + Math.round(240 * s))
  } else {
    ctx.font = `700 ${Math.round(100 * s)}px ${FONT}`
    ctx.fillStyle = "rgba(70,35,80,0.88)"
    ctx.fillText(`${data.petName} との記録`, W / 2, baseY + Math.round(220 * s))
  }

  // Month label
  ctx.font = `400 ${Math.round(44 * s)}px ${FONT}`
  ctx.fillStyle = "rgba(100,65,100,0.60)"
  ctx.fillText(`${data.label}のふりかえり`, W / 2, baseY + Math.round(335 * s))

  // Stats
  const statsLine = [
    `📝 ${data.memoryCount}件の思い出`,
    data.photoCount > 0 ? `📷 ${data.photoCount}枚` : null,
  ]
    .filter(Boolean)
    .join("　")
  ctx.font = `400 ${Math.round(40 * s)}px ${FONT}`
  ctx.fillStyle = "rgba(100,65,100,0.55)"
  ctx.fillText(statsLine, W / 2, baseY + Math.round(410 * s))

  if (data.topMoodLabel) {
    ctx.font = `400 ${Math.round(38 * s)}px ${FONT}`
    ctx.fillStyle = "rgba(100,65,100,0.50)"
    ctx.fillText(`✨ ${data.topMoodLabel}な一ヶ月でした`, W / 2, baseY + Math.round(478 * s))
  }

  // Branding
  ctx.font = `300 ${Math.round(28 * s)}px ${FONT}`
  ctx.fillStyle = "rgba(150,100,150,0.38)"
  ctx.fillText("Sora — ペットとの思い出を残すアプリ", W / 2, H - Math.round(55 * s))

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("Canvas toBlob failed"))
      },
      "image/png",
    )
  })
}
