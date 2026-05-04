import type { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"
import { requirePlus } from "@/lib/plan"
import { getPetAccess } from "@/lib/pet-access"
import { buildPhotobookData } from "@/lib/photobook"
import { PhotobookDocument } from "@/lib/photobook-pdf"
import { renderToBuffer } from "@react-pdf/renderer"
import React from "react"
import sharp from "sharp"

type Params = { params: Promise<{ petId: string }> }

async function fetchImageAsDataUri(url: string): Promise<{ uri: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const contentType = res.headers.get("content-type") ?? ""
    if (!contentType.startsWith("image/")) return null
    const raw = Buffer.from(await res.arrayBuffer())
    const processed = await sharp(raw)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()
    const base64 = processed.toString("base64")
    return { uri: `data:image/jpeg;base64,${base64}` }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { plan: true } })
  const planError = requirePlus(dbUser?.plan ?? "FREE")
  if (planError) return planError

  const { petId } = await params
  const access = await getPetAccess(petId, user.id)
  if (!access) return problem(404, "Not Found")

  const yearParam = request.nextUrl.searchParams.get("year")
  const monthParam = request.nextUrl.searchParams.get("month")
  const now = new Date()
  const year = yearParam ? parseInt(yearParam) : now.getFullYear()
  const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1

  if (isNaN(year) || year < 2000 || year > 2100) return problem(400, "Bad Request", "year が不正です")
  if (isNaN(month) || month < 1 || month > 12) return problem(400, "Bad Request", "month が不正です")

  const startDate = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00Z`)
  const endDate = new Date(year, month, 1)

  const memories = await prisma.memory.findMany({
    where: { petId, date: { gte: startDate, lt: endDate } },
    orderBy: { date: "asc" },
  })

  const memoriesForBook = memories.map((m) => ({
    id: m.id,
    title: m.title,
    date: m.date.toISOString().split("T")[0],
    photoUrls: m.photoUrls,
    moodTag: m.moodTag?.toLowerCase() ?? null,
  }))

  const data = buildPhotobookData(
    { name: access.pet.name, photoUrl: access.pet.photoUrl ?? null },
    memoriesForBook,
    year,
    month
  )

  // Fetch images as data URIs — react-pdf's resolveImage handles { uri: 'data:...' } via resolveBase64Image
  const allUrls = [data.petPhotoUrl, ...data.items.map((item) => item.photoUrl)]
  const buffers = await Promise.all(
    allUrls.map((url) => (url ? fetchImageAsDataUri(url) : Promise.resolve(null)))
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolvedData: any = {
    ...data,
    petPhotoUrl: buffers[0] ?? null,
    items: data.items.map((item, i) => ({
      ...item,
      photoUrl: buffers[i + 1] ?? null,
    })),
  }

  const element = React.createElement(PhotobookDocument, { data: resolvedData })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any)

  const filename = `sora-${access.pet.name}-${year}-${String(month).padStart(2, "0")}.pdf`
  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  })
}
