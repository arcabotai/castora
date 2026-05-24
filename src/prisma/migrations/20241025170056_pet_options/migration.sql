-- CreateTable
CREATE TABLE "PetOption" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "traits" TEXT[],
    "interests" TEXT[],
    "pfp_url" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "PetOption_pkey" PRIMARY KEY ("id")
);
