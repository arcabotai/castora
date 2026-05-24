/*
  Warnings:

  - You are about to drop the column `lastScheduledAt` on the `Draft` table. All the data in the column will be lost.
  - The `recurring` column on the `Draft` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DRAFT_RECURRING_SCHEDULE" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "Draft" DROP COLUMN "lastScheduledAt",
ADD COLUMN     "nextScheduledAt" TIMESTAMP(3),
DROP COLUMN "recurring",
ADD COLUMN     "recurring" "DRAFT_RECURRING_SCHEDULE";

-- DropEnum
DROP TYPE "RECURRING_SCHEDULE";
