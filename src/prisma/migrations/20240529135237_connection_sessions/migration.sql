-- CreateTable
CREATE TABLE "AccountConnectionSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supercastPrivyUserId" TEXT NOT NULL,

    CONSTRAINT "AccountConnectionSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AccountConnectionSession" ADD CONSTRAINT "AccountConnectionSession_supercastPrivyUserId_fkey" FOREIGN KEY ("supercastPrivyUserId") REFERENCES "SupercastPrivyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
