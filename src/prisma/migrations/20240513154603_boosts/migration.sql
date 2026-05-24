-- CreateEnum
CREATE TYPE "OPT_OUT_TYPE" AS ENUM ('GLOBAL', 'PERSONAL');

-- CreateTable
CREATE TABLE "BoostRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorFid" INTEGER NOT NULL,
    "castHash" TEXT NOT NULL,
    "recipientFids" INTEGER[],

    CONSTRAINT "BoostRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoostRequestOptOut" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "boostId" TEXT NOT NULL,
    "userFid" INTEGER NOT NULL,
    "type" "OPT_OUT_TYPE" NOT NULL,
    "targetFid" INTEGER,

    CONSTRAINT "BoostRequestOptOut_pkey" PRIMARY KEY ("id")
);
