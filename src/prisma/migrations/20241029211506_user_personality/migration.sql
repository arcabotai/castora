-- CreateTable
CREATE TABLE "UserPersonality" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "interests" TEXT[],
    "traits" TEXT[],
    "channels" TEXT[],
    "randomFacts" TEXT[],
    "friend_usernames" TEXT[],
    "occupations" TEXT[],
    "supercastFarcasterAccountId" TEXT NOT NULL,

    CONSTRAINT "UserPersonality_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserPersonality" ADD CONSTRAINT "UserPersonality_supercastFarcasterAccountId_fkey" FOREIGN KEY ("supercastFarcasterAccountId") REFERENCES "SupercastFarcasterAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
