-- AlterTable
ALTER TABLE "ScheduledThread" ADD COLUMN     "supercastFarcasterAccountId" TEXT;

-- AddForeignKey
ALTER TABLE "ScheduledThread" ADD CONSTRAINT "ScheduledThread_supercastFarcasterAccountId_fkey" FOREIGN KEY ("supercastFarcasterAccountId") REFERENCES "SupercastFarcasterAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
