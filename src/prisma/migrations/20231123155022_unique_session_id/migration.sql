/*
  Warnings:

  - A unique constraint covering the columns `[sessionId]` on the table `StripeSession` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "StripeSession_sessionId_key" ON "StripeSession"("sessionId");
