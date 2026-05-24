/*
  Warnings:

  - Added the required column `parentURL` to the `ScheduledThread` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ScheduledThread" ADD COLUMN     "parentURL" TEXT NOT NULL;
