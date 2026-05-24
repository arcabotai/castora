-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "petOptionId" TEXT;

-- CreateIndex
CREATE INDEX "Pet_ownerId_idx" ON "Pet"("ownerId");

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_petOptionId_fkey" FOREIGN KEY ("petOptionId") REFERENCES "PetOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
