/*
  Warnings:

  - You are about to drop the column `name` on the `Pet` table. All the data in the column will be lost.
  - You are about to drop the column `pfp` on the `Pet` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `Pet` table. All the data in the column will be lost.
  - Added the required column `farcasterAccountId` to the `Pet` table without a default value. This is not possible if the table is not empty.
  - Made the column `lastFedAt` on table `Pet` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lastPlayedAt` on table `Pet` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Pet" DROP COLUMN "name",
DROP COLUMN "pfp",
DROP COLUMN "username",
ADD COLUMN     "farcasterAccountId" TEXT NOT NULL,
ALTER COLUMN "lastFedAt" SET NOT NULL,
ALTER COLUMN "lastFedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "lastPlayedAt" SET NOT NULL,
ALTER COLUMN "lastPlayedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_farcasterAccountId_fkey" FOREIGN KEY ("farcasterAccountId") REFERENCES "SupercastFarcasterAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
