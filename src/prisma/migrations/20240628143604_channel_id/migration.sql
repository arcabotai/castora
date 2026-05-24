/*
  Warnings:

  - You are about to drop the column `parentURL` on the `Draft` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Draft" DROP COLUMN "parentURL",
ADD COLUMN     "channelId" TEXT;
