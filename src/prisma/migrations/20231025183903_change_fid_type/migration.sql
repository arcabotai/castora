/*
  Warnings:

  - Changed the type of `ownerFid` on the `Bookmark` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Bookmark" DROP COLUMN "ownerFid",
ADD COLUMN     "ownerFid" INTEGER NOT NULL;
