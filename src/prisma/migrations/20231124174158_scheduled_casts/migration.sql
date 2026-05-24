-- CreateEnum
CREATE TYPE "SCHEDULED_CAST_STATUS" AS ENUM ('PENDING', 'CANCELLED', 'FAILED', 'SUCCESS');

-- CreateTable
CREATE TABLE "ScheduledCast" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "supercastUserId" TEXT NOT NULL,
    "status" "SCHEDULED_CAST_STATUS" NOT NULL DEFAULT 'PENDING',
    "text" TEXT NOT NULL,
    "embedURLs" TEXT[],
    "parentURL" TEXT NOT NULL,

    CONSTRAINT "ScheduledCast_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScheduledCast" ADD CONSTRAINT "ScheduledCast_supercastUserId_fkey" FOREIGN KEY ("supercastUserId") REFERENCES "SupercastUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
