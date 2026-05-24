-- CreateTable
CREATE TABLE "SupercastPrivyUser" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fid" INTEGER NOT NULL,
    "privyUserId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL DEFAULT '',
    "plan" "PLAN" NOT NULL DEFAULT 'FREE',
    "lastPlanChange" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupercastPrivyUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupercastFarcasterAccount" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fid" INTEGER NOT NULL,
    "signerUUID" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "SupercastFarcasterAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectedAccount" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supercastFarcasterAccountId" TEXT NOT NULL,
    "supercastPrivyUserId" TEXT NOT NULL,

    CONSTRAINT "ConnectedAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupercastPrivyUser_privyUserId_key" ON "SupercastPrivyUser"("privyUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SupercastFarcasterAccount_fid_key" ON "SupercastFarcasterAccount"("fid");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectedAccount_supercastFarcasterAccountId_supercastPrivy_key" ON "ConnectedAccount"("supercastFarcasterAccountId", "supercastPrivyUserId");

-- AddForeignKey
ALTER TABLE "ConnectedAccount" ADD CONSTRAINT "ConnectedAccount_supercastFarcasterAccountId_fkey" FOREIGN KEY ("supercastFarcasterAccountId") REFERENCES "SupercastFarcasterAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectedAccount" ADD CONSTRAINT "ConnectedAccount_supercastPrivyUserId_fkey" FOREIGN KEY ("supercastPrivyUserId") REFERENCES "SupercastPrivyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
