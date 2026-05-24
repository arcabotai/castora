-- CreateEnum
CREATE TYPE "REACTION_TYPE" AS ENUM ('LIKE', 'RECAST', 'REPLY');

-- AlterTable
ALTER TABLE "Draft" ADD COLUMN     "shared" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ScheduledReaction" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "reaction" "REACTION_TYPE" NOT NULL,
    "text" TEXT,
    "draftId" TEXT NOT NULL,
    "reactionAuthorId" TEXT NOT NULL,

    CONSTRAINT "ScheduledReaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScheduledReaction" ADD CONSTRAINT "ScheduledReaction_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "Draft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledReaction" ADD CONSTRAINT "ScheduledReaction_reactionAuthorId_fkey" FOREIGN KEY ("reactionAuthorId") REFERENCES "SupercastFarcasterAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
