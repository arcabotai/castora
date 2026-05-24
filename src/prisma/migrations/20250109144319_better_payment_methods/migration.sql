/*
  Warnings:

  - The values [CREDIT_CARD,CRYPTO] on the enum `PAYMENT_METHOD` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PAYMENT_METHOD_new" AS ENUM ('STRIPE', 'DAIMO');
ALTER TABLE "PaymentSession" ALTER COLUMN "paymentMethod" TYPE "PAYMENT_METHOD_new" USING ("paymentMethod"::text::"PAYMENT_METHOD_new");
ALTER TYPE "PAYMENT_METHOD" RENAME TO "PAYMENT_METHOD_old";
ALTER TYPE "PAYMENT_METHOD_new" RENAME TO "PAYMENT_METHOD";
DROP TYPE "PAYMENT_METHOD_old";
COMMIT;
