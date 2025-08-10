-- Backfill null updatedAt values and enforce NOT NULL
BEGIN;

-- 1) Ensure updatedAt is populated for existing rows
UPDATE "User" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;

-- 2) Add optional note to TaskAssignment
ALTER TABLE "TaskAssignment" ADD COLUMN IF NOT EXISTS "note" TEXT;

-- 3) Enforce NOT NULL on updatedAt
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET NOT NULL;

COMMIT;


