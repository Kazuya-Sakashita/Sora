import type { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"
import { requirePlus } from "@/lib/plan"
import { buildReportData } from "@/lib/report"
import { AnnualReportDocument } from "@/lib/report-pdf"
import { renderToBuffer } from "@react-pdf/renderer"
import React from "react"

type Params = { params: Promise<{ petId: string }> }

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
    category: m.category.toLowerCase(),
    moodTag: m.moodTag?.toLowerCase() ?? null,
    photoUrls: m.photoUrls,
    createdAt: m.createdAt.toISOString(),
  }))
  const feelingsForReport = feelings.map((f) => ({
    id: f.id,
    tag: f.tag.toLowerCase(),
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

  // renderToBuffer expects the Document root element directly
  const element = React.createElement(AnnualReportDocument, { data })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any)

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="sora-${year}-report.pdf"`,
    },
  })
}
