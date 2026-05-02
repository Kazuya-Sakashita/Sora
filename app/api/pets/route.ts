import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"

export async function GET() {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const [ownedPets, memberships] = await Promise.all([
    prisma.pet.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.petMember.findMany({
      where: { userId: user.id },
      include: { pet: true },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const items = [
    ...ownedPets.map((p) => ({ ...toPetResponse(p), role: "owner" })),
    ...memberships.map((m) => ({ ...toPetResponse(m.pet), role: "member" })),
  ]

  return NextResponse.json({ items })
}

export async function POST(request: Request) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const body = await request.json().catch(() => null)
  if (!body || !body.name) {
    return problem(400, "Bad Request", "name は必須です")
  }

  const pet = await prisma.pet.create({
    data: {
      userId: user.id,
      name: body.name,
      nickname: body.nickname ?? null,
      species: body.species?.toUpperCase() ?? null,
      breed: body.breed ?? null,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      broughtAt: body.broughtAt ? new Date(body.broughtAt) : null,
      gender: body.gender?.toUpperCase() ?? null,
      personality: body.personality ?? null,
      favorites: body.favorites ?? null,
      photoUrl: body.photoUrl ?? null,
      status: body.status === "rainbow_bridge" ? "RAINBOW_BRIDGE" : "ALIVE",
    },
  })

  return NextResponse.json(toPetResponse(pet), { status: 201 })
}

export function toPetResponse(pet: {
  id: string
  name: string
  nickname: string | null
  species: string | null
  breed: string | null
  birthDate: Date | null
  broughtAt: Date | null
  gender: string | null
  photoUrl: string | null
  personality: string | null
  favorites: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: pet.id,
    name: pet.name,
    nickname: pet.nickname,
    species: pet.species?.toLowerCase() ?? null,
    breed: pet.breed,
    birthDate: pet.birthDate?.toISOString().split("T")[0] ?? null,
    broughtAt: pet.broughtAt?.toISOString().split("T")[0] ?? null,
    gender: pet.gender?.toLowerCase() ?? null,
    photoUrl: pet.photoUrl,
    personality: pet.personality,
    favorites: pet.favorites,
    status: pet.status === "RAINBOW_BRIDGE" ? "rainbow_bridge" : "alive",
    createdAt: pet.createdAt.toISOString(),
    updatedAt: pet.updatedAt.toISOString(),
  }
}
