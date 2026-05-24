-- CreateEnum
CREATE TYPE "PRODUCT_TYPE" AS ENUM ('REGISTRATION', 'SUBSCRIPTION', 'STORAGE');

-- CreateEnum
CREATE TYPE "PAYMENT_METHOD" AS ENUM ('CREDIT_CARD', 'CRYPTO');

-- CreateTable
CREATE TABLE "PaymentSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supercastPrivyUserId" TEXT NOT NULL,
    "productType" "PRODUCT_TYPE" NOT NULL,
    "productQuantity" INTEGER NOT NULL,
    "usdValue" INTEGER NOT NULL,
    "sessionStatus" "SESSION_STATUS" NOT NULL,
    "paymentMethod" "PAYMENT_METHOD" NOT NULL,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "PaymentSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentSession_sessionId_key" ON "PaymentSession"("sessionId");

-- AddForeignKey
ALTER TABLE "PaymentSession" ADD CONSTRAINT "PaymentSession_supercastPrivyUserId_fkey" FOREIGN KEY ("supercastPrivyUserId") REFERENCES "SupercastPrivyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
