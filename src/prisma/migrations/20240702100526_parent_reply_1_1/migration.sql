/*
  Warnings:

  - A unique constraint covering the columns `[replyId]` on the table `Draft` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Draft_replyId_key" ON "Draft"("replyId");
