/*
  Warnings:

  - You are about to drop the column `replyId` on the `Draft` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[parentId]` on the table `Draft` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Draft" DROP CONSTRAINT "Draft_replyId_fkey";

-- DropIndex
DROP INDEX "Draft_replyId_idx";

-- DropIndex
DROP INDEX "Draft_replyId_key";

-- AlterTable
ALTER TABLE "Draft" DROP COLUMN "replyId",
ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Draft_parentId_key" ON "Draft"("parentId");

-- CreateIndex
CREATE INDEX "Draft_parentId_idx" ON "Draft"("parentId");

-- AddForeignKey
ALTER TABLE "Draft" ADD CONSTRAINT "Draft_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Draft"("id") ON DELETE SET NULL ON UPDATE CASCADE;
