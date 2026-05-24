-- DropForeignKey
ALTER TABLE "ScheduledCast" DROP CONSTRAINT "ScheduledCast_supercastUserId_fkey";

-- AlterTable
ALTER TABLE "ScheduledCast" ADD COLUMN     "supercastFarcasterAccountId" TEXT,
ALTER COLUMN "supercastUserId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ScheduledCast" ADD CONSTRAINT "ScheduledCast_supercastUserId_fkey" FOREIGN KEY ("supercastUserId") REFERENCES "SupercastUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledCast" ADD CONSTRAINT "ScheduledCast_supercastFarcasterAccountId_fkey" FOREIGN KEY ("supercastFarcasterAccountId") REFERENCES "SupercastFarcasterAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
