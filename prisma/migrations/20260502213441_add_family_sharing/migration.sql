-- CreateEnum
CREATE TYPE "PetRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateTable
CREATE TABLE "pet_members" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "PetRole" NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pet_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet_invites" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pet_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pet_members_pet_id_user_id_key" ON "pet_members"("pet_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "pet_invites_token_key" ON "pet_invites"("token");

-- AddForeignKey
ALTER TABLE "pet_members" ADD CONSTRAINT "pet_members_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_members" ADD CONSTRAINT "pet_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_invites" ADD CONSTRAINT "pet_invites_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
