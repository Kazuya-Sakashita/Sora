-- CreateEnum
CREATE TYPE "Species" AS ENUM ('DOG', 'CAT', 'RABBIT', 'BIRD', 'OTHER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');

-- AlterTable
ALTER TABLE "memories" ADD COLUMN     "photo_urls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "pets" ADD COLUMN     "birth_date" TIMESTAMP(3),
ADD COLUMN     "breed" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "species" "Species";
