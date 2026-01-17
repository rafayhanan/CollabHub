-- Add invitation email delivery status tracking
CREATE TYPE "InvitationEmailStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

ALTER TABLE "Invitation"
ADD COLUMN "emailStatus" "InvitationEmailStatus" NOT NULL DEFAULT 'QUEUED',
ADD COLUMN "emailLastSentAt" TIMESTAMP(3),
ADD COLUMN "emailError" TEXT;
