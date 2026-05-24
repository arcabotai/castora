-- DropForeignKey
ALTER TABLE "ScheduledReaction" DROP CONSTRAINT "ScheduledReaction_draftId_fkey";

-- AddForeignKey
ALTER TABLE "ScheduledReaction" ADD CONSTRAINT "ScheduledReaction_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "Draft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
