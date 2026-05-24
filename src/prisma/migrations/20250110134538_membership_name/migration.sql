/*
  Warnings:

  - The values [SUBSCRIPTION] on the enum `PRODUCT_TYPE` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PRODUCT_TYPE_new" AS ENUM ('MEMBERSHIP', 'REGISTRATION', 'STORAGE');
ALTER TABLE "PaymentSession" ALTER COLUMN "productType" TYPE "PRODUCT_TYPE_new" USING ("productType"::text::"PRODUCT_TYPE_new");
ALTER TYPE "PRODUCT_TYPE" RENAME TO "PRODUCT_TYPE_old";
ALTER TYPE "PRODUCT_TYPE_new" RENAME TO "PRODUCT_TYPE";
DROP TYPE "PRODUCT_TYPE_old";
COMMIT;
