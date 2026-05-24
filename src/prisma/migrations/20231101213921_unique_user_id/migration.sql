/*
  Warnings:

  - A unique constraint covering the columns `[userFid]` on the table `NotificationLastChecked` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "NotificationLastChecked_userFid_key" ON "NotificationLastChecked"("userFid");
