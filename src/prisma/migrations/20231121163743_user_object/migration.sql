-- CreateEnum
CREATE TYPE "PLAN" AS ENUM ('FREE', 'PERSONAL');

-- CreateTable
CREATE TABLE "SupercastUser" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fid" INTEGER NOT NULL,
    "signerUUID" TEXT NOT NULL,
    "plan" "PLAN" NOT NULL DEFAULT 'FREE',

    CONSTRAINT "SupercastUser_pkey" PRIMARY KEY ("id")
);
