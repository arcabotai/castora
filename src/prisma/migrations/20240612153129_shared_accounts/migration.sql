-- CreateTable
CREATE TABLE "SharedAccount" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sharedById" TEXT NOT NULL,
    "sharedWithId" TEXT NOT NULL,
    "supercastFarcasterAccountId" TEXT NOT NULL,

    CONSTRAINT "SharedAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SharedAccount_sharedById_idx" ON "SharedAccount"("sharedById");

-- CreateIndex
CREATE INDEX "SharedAccount_sharedWithId_idx" ON "SharedAccount"("sharedWithId");

-- CreateIndex
CREATE INDEX "SharedAccount_supercastFarcasterAccountId_idx" ON "SharedAccount"("supercastFarcasterAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedAccount_sharedById_sharedWithId_key" ON "SharedAccount"("sharedById", "sharedWithId");

-- AddForeignKey
ALTER TABLE "SharedAccount" ADD CONSTRAINT "SharedAccount_sharedById_fkey" FOREIGN KEY ("sharedById") REFERENCES "SupercastPrivyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedAccount" ADD CONSTRAINT "SharedAccount_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES "SupercastPrivyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedAccount" ADD CONSTRAINT "SharedAccount_supercastFarcasterAccountId_fkey" FOREIGN KEY ("supercastFarcasterAccountId") REFERENCES "SupercastFarcasterAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
