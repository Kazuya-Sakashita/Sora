-- Recreate FeelingTag enum with correct values matching the feelings screen UI.
-- PostgreSQL does not support DROP VALUE, so we create a new enum and swap.

-- 1. Create new enum
CREATE TYPE "FeelingTag_new" AS ENUM ('HAPPY', 'CALM', 'FUN', 'WORRIED', 'LOVING');

-- 2. Map old values to new ones
ALTER TABLE "feelings"
  ALTER COLUMN "tag" TYPE "FeelingTag_new"
  USING (
    CASE "tag"::text
      WHEN 'HAPPY'    THEN 'HAPPY'
      WHEN 'CALM'     THEN 'CALM'
      WHEN 'FUN'      THEN 'FUN'
      WHEN 'WORRIED'  THEN 'WORRIED'
      WHEN 'LOVING'   THEN 'LOVING'
      WHEN 'LONELY'   THEN 'FUN'
      WHEN 'SAD'      THEN 'WORRIED'
      WHEN 'GRATEFUL' THEN 'LOVING'
      WHEN 'ANXIOUS'  THEN 'WORRIED'
      ELSE 'HAPPY'
    END
  )::"FeelingTag_new";

-- 3. Drop old enum and rename new one
DROP TYPE "FeelingTag";
ALTER TYPE "FeelingTag_new" RENAME TO "FeelingTag";
