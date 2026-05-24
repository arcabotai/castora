/*
  Warnings:

  - A unique constraint covering the columns `[sharedById,sharedWithId,supercastFarcasterAccountId]` on the table `SharedAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "SharedAccount_sharedById_sharedWithId_key";

-- CreateIndex
CREATE UNIQUE INDEX "SharedAccount_sharedById_sharedWithId_supercastFarcasterAcc_key" ON "SharedAccount"("sharedById", "sharedWithId", "supercastFarcasterAccountId");
