-- CreateEnum
CREATE TYPE "WAITLIST_STATUS" AS ENUM ('PENDING', 'APPROVED');

-- CreateEnum
CREATE TYPE "WAITLIST_TYPE" AS ENUM ('PETS');

-- CreateTable
CREATE TABLE "Waitlist" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supercastFarcasterAccountId" TEXT NOT NULL,
    "type" "WAITLIST_TYPE" NOT NULL DEFAULT 'PETS',
    "status" "WAITLIST_STATUS" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Waitlist_supercastFarcasterAccountId_type_idx" ON "Waitlist"("supercastFarcasterAccountId", "type");

-- AddForeignKey
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_supercastFarcasterAccountId_fkey" FOREIGN KEY ("supercastFarcasterAccountId") REFERENCES "SupercastFarcasterAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
