-- CreateEnum
CREATE TYPE "EVENT_TYPE" AS ENUM ('FEED_REFRESH', 'PROFILE_VIEW', 'CAST_DETAIL_VIEW', 'CAST_SENT', 'REPLY_SENT', 'BOOKMARK_SAVED', 'LIST_CREATED');

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userFid" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "event_type" "EVENT_TYPE" NOT NULL,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsEvent_userFid_key" ON "AnalyticsEvent"("userFid");
