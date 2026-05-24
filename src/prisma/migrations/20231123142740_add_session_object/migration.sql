-- CreateEnum
CREATE TYPE "SESSION_STATUS" AS ENUM ('STARTED', 'CANCELLED', 'SUCCESS');

-- CreateTable
CREATE TABLE "StripeSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userFid" INTEGER NOT NULL,
    "sessionId" TEXT NOT NULL,
    "plan" "PLAN" NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "StripeSession_pkey" PRIMARY KEY ("id")
);
