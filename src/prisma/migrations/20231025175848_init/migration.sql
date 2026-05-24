-- CreateTable
CREATE TABLE "Bookmark" (
    "uuid" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "castHash" TEXT NOT NULL,
    "ownerFid" TEXT NOT NULL,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("uuid")
);
