/*
  Warnings:

  - You are about to drop the column `timestamp` on the `AnalyticsEvent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AnalyticsEvent" DROP COLUMN "timestamp";
