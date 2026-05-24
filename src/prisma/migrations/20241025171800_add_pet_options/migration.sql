/*
  Warnings:

  - Added the required column `ownerId` to the `PetOption` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PetOption" ADD COLUMN     "ownerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "PetOption" ADD CONSTRAINT "PetOption_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "SupercastFarcasterAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
