/*
  Warnings:

  - You are about to drop the column `parent_url` on the `List` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "List" DROP COLUMN "parent_url";

-- CreateTable
CREATE TABLE "CryptoCheckoutSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "glideSessionId" TEXT NOT NULL,
    "plan" "PLAN" NOT NULL,
    "status" "SESSION_STATUS" NOT NULL,
    "supercastPrivyUserId" TEXT,

    CONSTRAINT "CryptoCheckoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CryptoCheckoutSession_glideSessionId_key" ON "CryptoCheckoutSession"("glideSessionId");
