/*
  Warnings:

  - The values [STARTED] on the enum `SESSION_STATUS` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SESSION_STATUS_new" AS ENUM ('PENDING', 'CANCELLED', 'SUCCESS');
ALTER TABLE "StripeSession" ALTER COLUMN "status" TYPE "SESSION_STATUS_new" USING ("status"::text::"SESSION_STATUS_new");
ALTER TYPE "SESSION_STATUS" RENAME TO "SESSION_STATUS_old";
ALTER TYPE "SESSION_STATUS_new" RENAME TO "SESSION_STATUS";
DROP TYPE "SESSION_STATUS_old";
COMMIT;
