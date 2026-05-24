-- AlterTable
ALTER TABLE "SupercastPrivyUser" ADD COLUMN     "superanonLeaderboardOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "superanonScore" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SuperanonScore" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "draftId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "SuperanonScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SuperanonScore_draftId_key" ON "SuperanonScore"("draftId");

-- AddForeignKey
ALTER TABLE "SuperanonScore" ADD CONSTRAINT "SuperanonScore_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "Draft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
