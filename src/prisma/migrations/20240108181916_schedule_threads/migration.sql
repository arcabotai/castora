-- AlterTable
ALTER TABLE "ScheduledCast" ADD COLUMN     "scheduledThreadId" TEXT;

-- CreateTable
CREATE TABLE "ScheduledThread" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "supercastUserId" TEXT,

    CONSTRAINT "ScheduledThread_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScheduledCast" ADD CONSTRAINT "ScheduledCast_scheduledThreadId_fkey" FOREIGN KEY ("scheduledThreadId") REFERENCES "ScheduledThread"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledThread" ADD CONSTRAINT "ScheduledThread_supercastUserId_fkey" FOREIGN KEY ("supercastUserId") REFERENCES "SupercastUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
