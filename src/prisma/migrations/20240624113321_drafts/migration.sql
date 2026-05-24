-- CreateEnum
CREATE TYPE "DRAFT_SEND_STATUS" AS ENUM ('DRAFT', 'SENT', 'SCHEDULED', 'ERROR', 'DELETED');

-- CreateEnum
CREATE TYPE "RECURRING_SCHEDULE" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "Draft" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "castHash" TEXT,
    "text" TEXT NOT NULL,
    "embeds" JSONB[],
    "parentURL" TEXT,
    "replyId" TEXT,
    "isTopLevel" BOOLEAN NOT NULL DEFAULT true,
    "authorId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "sendStatus" "DRAFT_SEND_STATUS" NOT NULL DEFAULT 'DRAFT',
    "recurring" "RECURRING_SCHEDULE",
    "firstScheduledAt" TIMESTAMP(3),
    "lastScheduledAt" TIMESTAMP(3),
    "lastSentAt" TIMESTAMP(3),

    CONSTRAINT "Draft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Draft_replyId_idx" ON "Draft"("replyId");

-- AddForeignKey
ALTER TABLE "Draft" ADD CONSTRAINT "Draft_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "Draft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Draft" ADD CONSTRAINT "Draft_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "SupercastFarcasterAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Draft" ADD CONSTRAINT "Draft_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "SupercastPrivyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
