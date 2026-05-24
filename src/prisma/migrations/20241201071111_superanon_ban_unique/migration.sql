-- CreateEnum
CREATE TYPE "SUPERANON_BAN_LEVEL" AS ENUM ('WARNING', 'BANNED');

-- CreateTable
CREATE TABLE "SuperanonBan" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supercastPrivyUserId" TEXT NOT NULL,
    "level" "SUPERANON_BAN_LEVEL" NOT NULL DEFAULT 'WARNING',

    CONSTRAINT "SuperanonBan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SuperanonBan_supercastPrivyUserId_idx" ON "SuperanonBan"("supercastPrivyUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SuperanonBan_supercastPrivyUserId_key" ON "SuperanonBan"("supercastPrivyUserId");

-- AddForeignKey
ALTER TABLE "SuperanonBan" ADD CONSTRAINT "SuperanonBan_supercastPrivyUserId_fkey" FOREIGN KEY ("supercastPrivyUserId") REFERENCES "SupercastPrivyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
