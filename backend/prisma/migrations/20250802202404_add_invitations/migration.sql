-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "invitedUserEmail" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
