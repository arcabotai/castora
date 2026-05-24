-- DropForeignKey
ALTER TABLE "ListFollowing" DROP CONSTRAINT "ListFollowing_listId_fkey";

-- DropForeignKey
ALTER TABLE "ListMembership" DROP CONSTRAINT "ListMembership_listId_fkey";

-- AddForeignKey
ALTER TABLE "ListMembership" ADD CONSTRAINT "ListMembership_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListFollowing" ADD CONSTRAINT "ListFollowing_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;
