/*
  Warnings:

  - A unique constraint covering the columns `[supercastFarcasterAccountId,type]` on the table `Waitlist` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_supercastFarcasterAccountId_type_key" ON "Waitlist"("supercastFarcasterAccountId", "type");
