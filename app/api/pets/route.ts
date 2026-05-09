import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"
import { parseBody } from "@/lib/validate"
import { PetInputSchema } from "@/lib/schemas"

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

  const parsed = await parseBody(PetInputSchema, request)
  if (parsed.error) return parsed.error
  const body = parsed.data

  const pet = await prisma.pet.create({
    data: {
      userId: user.id,
      name: body.name,
      nickname: body.nickname ?? null,
      species: (body.species?.toUpperCase() ?? null) as never,
      breed: body.breed ?? null,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      broughtAt: body.broughtAt ? new Date(body.broughtAt) : null,
      gender: (body.gender?.toUpperCase() ?? null) as never,
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
  publicProfile: boolean
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
    publicProfile: pet.publicProfile,
    createdAt: pet.createdAt.toISOString(),
    updatedAt: pet.updatedAt.toISOString(),
  }
}
