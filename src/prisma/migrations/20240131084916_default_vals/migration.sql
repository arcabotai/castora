/*
  Warnings:

  - You are about to drop the column `question_slug` on the `Poll` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "question_slug",
ALTER COLUMN "answer_2" SET DEFAULT '',
ALTER COLUMN "answer_3" SET DEFAULT '',
ALTER COLUMN "answer_4" SET DEFAULT '';
