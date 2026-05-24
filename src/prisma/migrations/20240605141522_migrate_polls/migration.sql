-- DropForeignKey
ALTER TABLE "Poll" DROP CONSTRAINT "Poll_ownerId_fkey";

-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "supercastFarcasterAccountId" TEXT,
ALTER COLUMN "ownerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "SupercastUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_supercastFarcasterAccountId_fkey" FOREIGN KEY ("supercastFarcasterAccountId") REFERENCES "SupercastFarcasterAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
