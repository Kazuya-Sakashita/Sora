import type { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"
import { requirePlus } from "@/lib/plan"
import { buildReportData } from "@/lib/report"
import { AnnualReportDocument } from "@/lib/report-pdf"
import type { MemoryCategory, MoodTag, FeelingTag } from "@/lib/api-types"
import { renderToBuffer } from "@react-pdf/renderer"
import React from "react"
import sharp from "sharp"

type Params = { params: Promise<{ petId: string }> }

// Fetch + re-encode via sharp: strips problematic EXIF metadata that jay-peg can't parse,
// and resizes to a PDF-appropriate resolution to keep file size manageable.
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
  const pet = await prisma.pet.findFirst({ where: { id: petId, userId: user.id } })
  if (!pet) return problem(404, "Not Found")

  const yearParam = request.nextUrl.searchParams.get("year")
  const year = yearParam ? parseInt(yearParam) : new Date().getFullYear() - 1
  if (isNaN(year) || year < 2000 || year > 2100) return problem(400, "Bad Request", "year が不正です")

  const startDate = new Date(`${year}-01-01T00:00:00Z`)
  const endDate = new Date(`${year + 1}-01-01T00:00:00Z`)

  const [memories, feelings] = await Promise.all([
    prisma.memory.findMany({
      where: { petId, date: { gte: startDate, lt: endDate } },
      orderBy: { date: "asc" },
    }),
    prisma.feeling.findMany({
      where: { petId, date: { gte: startDate, lt: endDate } },
    }),
  ])

  if (memories.length === 0) return problem(404, "Not Found", `${year}年の記録がありません`)

  const memoriesForReport = memories.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    date: m.date.toISOString().split("T")[0],
    category: m.category.toLowerCase() as MemoryCategory,
    moodTag: (m.moodTag?.toLowerCase() ?? null) as MoodTag | null,
    photoUrls: m.photoUrls,
    createdAt: m.createdAt.toISOString(),
  }))
  const feelingsForReport = feelings.map((f) => ({
    id: f.id,
    tag: f.tag.toLowerCase() as FeelingTag,
    memo: f.memo,
    date: f.date.toISOString().split("T")[0],
    createdAt: f.createdAt.toISOString(),
  }))

  const data = buildReportData(
    { name: pet.name, photoUrl: pet.photoUrl ?? null },
    memoriesForReport,
    feelingsForReport,
    year
  )

  // Fetch images as data URIs — react-pdf's resolveImage handles { uri: 'data:...' } via resolveBase64Image
  const [petPhotoBuf, ...featuredPhotoBufs] = await Promise.all([
    data.petPhotoUrl ? fetchImageAsDataUri(data.petPhotoUrl) : Promise.resolve(null),
    ...data.featuredMemories.map((m) =>
      m.photoUrl ? fetchImageAsDataUri(m.photoUrl) : Promise.resolve(null)
    ),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolvedData: any = {
    ...data,
    petPhotoUrl: petPhotoBuf ?? null,
    featuredMemories: data.featuredMemories.map((m, i) => ({
      ...m,
      photoUrl: featuredPhotoBufs[i] ?? null,
    })),
  }

  const element = React.createElement(AnnualReportDocument, { data: resolvedData })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any)

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="sora-${year}-report.pdf"`,
    },
  })
}
