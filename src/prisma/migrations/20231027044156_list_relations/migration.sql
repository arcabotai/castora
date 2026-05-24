/*
  Warnings:

  - Changed the type of `followerFid` on the `ListFollowing` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `memberFid` on the `ListMembership` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ListFollowing" DROP COLUMN "followerFid",
ADD COLUMN     "followerFid" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ListMembership" DROP COLUMN "memberFid",
ADD COLUMN     "memberFid" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "ListMembership" ADD CONSTRAINT "ListMembership_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListFollowing" ADD CONSTRAINT "ListFollowing_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
