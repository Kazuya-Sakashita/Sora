import prisma from "@/lib/prisma"

export async function getPetAccess(petId: string, userId: string) {
  const owned = await prisma.pet.findFirst({ where: { id: petId, userId } })
  if (owned) return { pet: owned, role: "owner" as const }

  const membership = await prisma.petMember.findFirst({
    where: { petId, userId },
    include: { pet: true },
  })
  if (membership) return { pet: membership.pet, role: "member" as const }

  return null
}
