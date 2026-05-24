/*
  Warnings:

  - Made the column `recurring` on table `Draft` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Draft" ALTER COLUMN "recurring" SET NOT NULL,
ALTER COLUMN "recurring" SET DEFAULT 'NONE';
