/*
  Warnings:

  - You are about to drop the column `accountCreatedId` on the `CreatedAccount` table. All the data in the column will be lost.
  - Added the required column `createdSupercastAccountId` to the `CreatedAccount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CreatedAccount" DROP COLUMN "accountCreatedId",
ADD COLUMN     "createdSupercastAccountId" TEXT NOT NULL;
