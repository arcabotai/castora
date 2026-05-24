-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supercastPrivyUserId" TEXT NOT NULL,
    "supercastFarcasterAccountId" TEXT NOT NULL,
    "priorityMode" BOOLEAN NOT NULL DEFAULT true,
    "replies" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSubscription" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supercastPrivyUserId" TEXT NOT NULL,
    "subscriptionObject" JSONB NOT NULL,

    CONSTRAINT "NotificationSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationSettings_supercastFarcasterAccountId_idx" ON "NotificationSettings"("supercastFarcasterAccountId");

-- CreateIndex
CREATE INDEX "NotificationSettings_supercastPrivyUserId_idx" ON "NotificationSettings"("supercastPrivyUserId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSettings_supercastPrivyUserId_supercastFarcaste_key" ON "NotificationSettings"("supercastPrivyUserId", "supercastFarcasterAccountId");

-- CreateIndex
CREATE INDEX "NotificationSubscription_supercastPrivyUserId_idx" ON "NotificationSubscription"("supercastPrivyUserId");

-- AddForeignKey
ALTER TABLE "NotificationSettings" ADD CONSTRAINT "NotificationSettings_supercastPrivyUserId_fkey" FOREIGN KEY ("supercastPrivyUserId") REFERENCES "SupercastPrivyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSettings" ADD CONSTRAINT "NotificationSettings_supercastFarcasterAccountId_fkey" FOREIGN KEY ("supercastFarcasterAccountId") REFERENCES "SupercastFarcasterAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSubscription" ADD CONSTRAINT "NotificationSubscription_supercastPrivyUserId_fkey" FOREIGN KEY ("supercastPrivyUserId") REFERENCES "SupercastPrivyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
