-- AlterTable
ALTER TABLE "SupercastPrivyUser" ADD COLUMN     "email" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "stripeSubscriptionId" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "SupercastUser" ADD COLUMN     "stripeCustomerId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "stripeSubscriptionId" TEXT NOT NULL DEFAULT '';
