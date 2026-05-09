-- AlterTable
ALTER TABLE "users" ADD COLUMN "referral_code" TEXT UNIQUE;
ALTER TABLE "users" ADD COLUMN "referred_by" TEXT;
