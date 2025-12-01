/*
  Warnings:

  - Made the column `description` on table `Vendor` required. This step will fail if there are existing NULL values in that column.
  - Made the column `logoUrl` on table `Vendor` required. This step will fail if there are existing NULL values in that column.
  - Made the column `coverUrl` on table `Vendor` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `Vendor` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `Vendor` required. This step will fail if there are existing NULL values in that column.
  - Made the column `city` on table `Vendor` required. This step will fail if there are existing NULL values in that column.
  - Made the column `country` on table `Vendor` required. This step will fail if there are existing NULL values in that column.
  - Made the column `zipCode` on table `Vendor` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Vendor" ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "logoUrl" SET NOT NULL,
ALTER COLUMN "coverUrl" SET NOT NULL,
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "country" SET NOT NULL,
ALTER COLUMN "zipCode" SET NOT NULL;
