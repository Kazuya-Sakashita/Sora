import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthUser, problem } from "@/lib/auth"
import { toPetResponse } from "../route"
import { getPetAccess } from "@/lib/pet-access"

type Params = { params: Promise<{ petId: string }> }

async function findOwnedPet(petId: string, userId: string) {
  return prisma.pet.findFirst({ where: { id: petId, userId } })
}

export async function GET(_request: Request, { params }: Params) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const { petId } = await params
  const access = await getPetAccess(petId, user.id)
  if (!access) return problem(404, "Not Found")

  return NextResponse.json({ ...toPetResponse(access.pet), role: access.role })
}

export async function PATCH(request: Request, { params }: Params) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const { petId } = await params
  const existing = await findOwnedPet(petId, user.id)
  if (!existing) return problem(404, "Not Found")

  const body = await request.json().catch(() => ({}))

  const pet = await prisma.pet.update({
    where: { id: petId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.nickname !== undefined && { nickname: body.nickname }),
      ...(body.species !== undefined && { species: body.species?.toUpperCase() ?? null }),
      ...(body.breed !== undefined && { breed: body.breed }),
      ...(body.birthDate !== undefined && { birthDate: body.birthDate ? new Date(body.birthDate) : null }),
      ...(body.gender !== undefined && { gender: body.gender?.toUpperCase() ?? null }),
      ...(body.personality !== undefined && { personality: body.personality }),
      ...(body.favorites !== undefined && { favorites: body.favorites }),
      ...(body.photoUrl !== undefined && { photoUrl: body.photoUrl }),
      ...(body.status !== undefined && { status: body.status === "rainbow_bridge" ? "RAINBOW_BRIDGE" : "ALIVE" }),
    },
  })

  return NextResponse.json(toPetResponse(pet))
}

export async function DELETE(_request: Request, { params }: Params) {
  const { user, errorResponse } = await getAuthUser()
  if (errorResponse) return errorResponse

  const { petId } = await params
  const existing = await findOwnedPet(petId, user.id)
  if (!existing) return problem(404, "Not Found")

  await prisma.pet.delete({ where: { id: petId } })
  return new NextResponse(null, { status: 204 })
}
