/*
  Warnings:

  - A unique constraint covering the columns `[daimoPayId]` on the table `CryptoCheckoutSession` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CryptoCheckoutSession" ADD COLUMN     "daimoPayAmountUsd" DOUBLE PRECISION,
ADD COLUMN     "daimoPayId" TEXT,
ALTER COLUMN "glideSessionId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CryptoCheckoutSession_daimoPayId_key" ON "CryptoCheckoutSession"("daimoPayId");
