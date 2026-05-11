import type { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"
import { requirePlus } from "@/lib/plan"
import { getPetAccess } from "@/lib/pet-access"
import { MemorialBookDocument } from "@/lib/memorial-book-pdf"
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

export async function GET(_request: NextRequest, { params }: Params) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { plan: true } })
  const planError = requirePlus(dbUser?.plan ?? "FREE")
  if (planError) return planError

  const { petId } = await params
  const access = await getPetAccess(petId, user.id)
  if (!access) return problem(404, "Not Found")

  const { pet } = access

  const [memories, letters] = await Promise.all([
    prisma.memory.findMany({
      where: { petId },
      orderBy: { date: "asc" },
      select: { id: true, title: true, date: true, photoUrls: true, moodTag: true },
    }),
    prisma.monthlyLetter.findMany({
      where: { petId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 3,
      select: { year: true, month: true, content: true },
    }),
  ])

  const daysTogether = pet.broughtAt
    ? Math.floor((Date.now() - new Date(pet.broughtAt).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : null

  const items = memories.map((m) => ({
    id: m.id,
    title: m.title,
    date: m.date.toISOString().split("T")[0],
    photoUrl: m.photoUrls[0] ?? null,
    moodTag: m.moodTag?.toLowerCase() ?? null,
  }))

  const allUrls = [pet.photoUrl, ...items.map((i) => i.photoUrl)]
  const buffers = await Promise.all(
    allUrls.map((url) => (url ? fetchImageAsDataUri(url) : Promise.resolve(null)))
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {
    petName: pet.name,
    petPhotoUrl: buffers[0] ?? null,
    daysTogether,
    items: items.map((item, i) => ({ ...item, photoUrl: buffers[i + 1] ?? null })),
    letters,
  }

  const element = React.createElement(MemorialBookDocument, { data })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any)

  const filename = `sora-${pet.name}-memorial-book.pdf`
  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  })
}
