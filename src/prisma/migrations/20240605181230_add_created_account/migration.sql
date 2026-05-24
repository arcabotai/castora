-- CreateTable
CREATE TABLE "CreatedAccount" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "accountCreatedId" TEXT NOT NULL,

    CONSTRAINT "CreatedAccount_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CreatedAccount" ADD CONSTRAINT "CreatedAccount_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "SupercastPrivyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
