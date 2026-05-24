/*
  Warnings:

  - You are about to drop the column `userFid` on the `StripeSession` table. All the data in the column will be lost.
  - Added the required column `fid` to the `StripeSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StripeSession" DROP COLUMN "userFid",
ADD COLUMN     "fid" INTEGER NOT NULL;
